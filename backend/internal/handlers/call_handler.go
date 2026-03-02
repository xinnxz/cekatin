package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cepatchat/internal/models"
	"github.com/xinnxz/cepatchat/internal/services"
)

/*
═══════════════════════════════════════════════════════
Call Handler — Panggilan WhatsApp (infrastruktur)

Penjelasan:
WhatsApp Cloud API belum membuka Calling API secara publik.
Handler ini mempersiapkan infrastruktur agar siap pakai
saat Meta membuka aksesnya.

Fitur yang sudah ready:
- Log panggilan (inbound/outbound) ke database
- Analytics: durasi rata-rata, missed calls, call per agent
- Assign call ke agent
- Transfer call antar agent
- Call recording URL tracking

Endpoints:
- GET    /api/calls                → List semua panggilan
- GET    /api/calls/:id            → Detail satu panggilan
- POST   /api/calls                → Log panggilan baru (manual/webhook)
- PATCH  /api/calls/:id/status     → Update status panggilan
- PATCH  /api/calls/:id/assign     → Assign call ke agent
- PATCH  /api/calls/:id/transfer   → Transfer call ke agent lain
- GET    /api/calls/analytics      → Statistik panggilan
═══════════════════════════════════════════════════════
*/

// CallHandler mengelola panggilan WhatsApp
type CallHandler struct {
	DB  *pgxpool.Pool
	Hub *services.Hub
}

// ListCalls — GET /api/calls
// Query params: ?status=missed&direction=inbound&agent=AgentName&limit=50
func (h *CallHandler) ListCalls(c *gin.Context) {
	ctx := context.Background()
	status := c.Query("status")
	direction := c.Query("direction")
	agent := c.Query("agent")

	// Base query
	query := `SELECT id, conversation_id, contact_id, caller_phone, callee_phone,
			  direction, call_type, status, duration_seconds, assigned_agent,
			  recording_url, wa_call_id, started_at, answered_at, ended_at, created_at
			  FROM calls WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += " AND status = $" + itoa(argIdx)
		args = append(args, status)
		argIdx++
	}
	if direction != "" {
		query += " AND direction = $" + itoa(argIdx)
		args = append(args, direction)
		argIdx++
	}
	if agent != "" {
		query += " AND assigned_agent = $" + itoa(argIdx)
		args = append(args, agent)
		argIdx++
	}

	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := h.DB.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query calls"})
		return
	}
	defer rows.Close()

	var calls []models.Call
	for rows.Next() {
		var call models.Call
		if err := rows.Scan(&call.ID, &call.ConversationID, &call.ContactID,
			&call.CallerPhone, &call.CalleePhone, &call.Direction, &call.CallType,
			&call.Status, &call.DurationSeconds, &call.AssignedAgent, &call.RecordingURL,
			&call.WACallID, &call.StartedAt, &call.AnsweredAt, &call.EndedAt, &call.CreatedAt); err != nil {
			continue
		}
		calls = append(calls, call)
	}

	if calls == nil {
		calls = []models.Call{}
	}

	c.JSON(http.StatusOK, gin.H{"calls": calls, "total": len(calls)})
}

// GetCall — GET /api/calls/:id
func (h *CallHandler) GetCall(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	var call models.Call
	err := h.DB.QueryRow(ctx,
		`SELECT id, conversation_id, contact_id, caller_phone, callee_phone,
		 direction, call_type, status, duration_seconds, assigned_agent,
		 recording_url, wa_call_id, started_at, answered_at, ended_at, created_at
		 FROM calls WHERE id = $1`, id,
	).Scan(&call.ID, &call.ConversationID, &call.ContactID,
		&call.CallerPhone, &call.CalleePhone, &call.Direction, &call.CallType,
		&call.Status, &call.DurationSeconds, &call.AssignedAgent, &call.RecordingURL,
		&call.WACallID, &call.StartedAt, &call.AnsweredAt, &call.EndedAt, &call.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Call not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"call": call})
}

// LogCall — POST /api/calls
// Body: { conversation_id, caller_phone, callee_phone, direction, call_type, wa_call_id? }
func (h *CallHandler) LogCall(c *gin.Context) {
	var req struct {
		ConversationID string `json:"conversation_id" binding:"required"`
		CallerPhone    string `json:"caller_phone" binding:"required"`
		CalleePhone    string `json:"callee_phone" binding:"required"`
		Direction      string `json:"direction" binding:"required"` // inbound, outbound
		CallType       string `json:"call_type"`                    // voice, video (default: voice)
		WACallID       string `json:"wa_call_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.CallType == "" {
		req.CallType = "voice"
	}

	ctx := context.Background()
	now := time.Now()

	var call models.Call
	err := h.DB.QueryRow(ctx,
		`INSERT INTO calls (conversation_id, caller_phone, callee_phone, direction, call_type, status, wa_call_id, started_at)
		 VALUES ($1, $2, $3, $4, $5, 'ringing', $6, $7)
		 RETURNING id, conversation_id, caller_phone, callee_phone, direction, call_type, status, 
		           duration_seconds, assigned_agent, wa_call_id, started_at, created_at`,
		req.ConversationID, req.CallerPhone, req.CalleePhone, req.Direction, req.CallType, req.WACallID, now,
	).Scan(&call.ID, &call.ConversationID, &call.CallerPhone, &call.CalleePhone,
		&call.Direction, &call.CallType, &call.Status, &call.DurationSeconds,
		&call.AssignedAgent, &call.WACallID, &call.StartedAt, &call.CreatedAt)

	if err != nil {
		log.Printf("❌ Gagal log call: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log call"})
		return
	}

	// Broadcast ke dashboard — incoming call notification
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "incoming_call",
		Call: &call,
	})

	log.Printf("📞 Call logged: %s → %s (%s, %s)", req.CallerPhone, req.CalleePhone, req.Direction, req.CallType)

	c.JSON(http.StatusCreated, gin.H{"call": call})
}

// UpdateCallStatus — PATCH /api/calls/:id/status
// Body: { status: "answered"|"missed"|"rejected"|"ended"|"busy", recording_url? }
func (h *CallHandler) UpdateCallStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status       string `json:"status" binding:"required"`
		RecordingURL string `json:"recording_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ctx := context.Background()
	now := time.Now()

	// Update status + timestamps berdasarkan status baru
	var query string
	var args []interface{}

	switch req.Status {
	case "answered":
		query = `UPDATE calls SET status = $1, answered_at = $2 WHERE id = $3`
		args = []interface{}{req.Status, now, id}
	case "ended":
		// Hitung durasi jika ada answered_at
		query = `UPDATE calls SET status = $1, ended_at = $2, recording_url = COALESCE(NULLIF($3, ''), recording_url),
				 duration_seconds = CASE WHEN answered_at IS NOT NULL THEN EXTRACT(EPOCH FROM ($2::timestamptz - answered_at))::int ELSE 0 END
				 WHERE id = $4`
		args = []interface{}{req.Status, now, req.RecordingURL, id}
	default: // missed, rejected, busy
		query = `UPDATE calls SET status = $1, ended_at = $2 WHERE id = $3`
		args = []interface{}{req.Status, now, id}
	}

	result, err := h.DB.Exec(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update call"})
		return
	}
	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Call not found"})
		return
	}

	// Broadcast status update ke dashboard
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "call_update",
		Call: &models.Call{ID: id, Status: req.Status},
	})

	log.Printf("📞 Call %s status → %s", id, req.Status)
	c.JSON(http.StatusOK, gin.H{"message": "Call status updated", "status": req.Status})
}

// AssignCall — PATCH /api/calls/:id/assign
// Body: { agent: "AgentName" }
func (h *CallHandler) AssignCall(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Agent string `json:"agent" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	result, err := h.DB.Exec(ctx,
		`UPDATE calls SET assigned_agent = $1 WHERE id = $2`, req.Agent, id)
	if err != nil || result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Call not found"})
		return
	}

	log.Printf("📞 Call %s assigned → %s", id, req.Agent)
	c.JSON(http.StatusOK, gin.H{"message": "Call assigned to " + req.Agent})
}

// TransferCall — PATCH /api/calls/:id/transfer
// Body: { from_agent: "Agent A", to_agent: "Agent B" }
func (h *CallHandler) TransferCall(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		FromAgent string `json:"from_agent" binding:"required"`
		ToAgent   string `json:"to_agent" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	result, err := h.DB.Exec(ctx,
		`UPDATE calls SET assigned_agent = $1 WHERE id = $2 AND assigned_agent = $3`,
		req.ToAgent, id, req.FromAgent)
	if err != nil || result.RowsAffected() == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transfer failed — call not found or agent mismatch"})
		return
	}

	// Broadcast transfer ke dashboard
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "call_update",
		Call: &models.Call{ID: id, AssignedAgent: req.ToAgent, Status: "transferred"},
	})

	log.Printf("📞 Call %s transferred: %s → %s", id, req.FromAgent, req.ToAgent)
	c.JSON(http.StatusOK, gin.H{
		"message":    "Call transferred",
		"from_agent": req.FromAgent,
		"to_agent":   req.ToAgent,
	})
}

// CallAnalytics — GET /api/calls/analytics
// Query params: ?from=2026-01-01&to=2026-03-01&agent=AgentName
// Returns: total calls, avg duration, missed rate, calls per agent, calls per direction
func (h *CallHandler) CallAnalytics(c *gin.Context) {
	ctx := context.Background()

	// 1. Summary: total, answered, missed, avg duration
	var totalCalls, answeredCalls, missedCalls, rejectedCalls int
	var avgDuration float64

	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM calls`).Scan(&totalCalls)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM calls WHERE status = 'ended'`).Scan(&answeredCalls)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM calls WHERE status = 'missed'`).Scan(&missedCalls)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM calls WHERE status = 'rejected'`).Scan(&rejectedCalls)
	_ = h.DB.QueryRow(ctx, `SELECT COALESCE(AVG(duration_seconds), 0) FROM calls WHERE status = 'ended' AND duration_seconds > 0`).Scan(&avgDuration)

	// 2. Calls per agent
	agentRows, err := h.DB.Query(ctx,
		`SELECT assigned_agent, COUNT(*), COALESCE(AVG(duration_seconds), 0)
		 FROM calls WHERE assigned_agent != '' GROUP BY assigned_agent ORDER BY COUNT(*) DESC LIMIT 20`)

	type AgentStat struct {
		Agent       string  `json:"agent"`
		TotalCalls  int     `json:"total_calls"`
		AvgDuration float64 `json:"avg_duration_seconds"`
	}
	var agentStats []AgentStat
	if err == nil {
		defer agentRows.Close()
		for agentRows.Next() {
			var s AgentStat
			if err := agentRows.Scan(&s.Agent, &s.TotalCalls, &s.AvgDuration); err == nil {
				agentStats = append(agentStats, s)
			}
		}
	}
	if agentStats == nil {
		agentStats = []AgentStat{}
	}

	// 3. Calls per direction (inbound vs outbound)
	var inboundCalls, outboundCalls int
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM calls WHERE direction = 'inbound'`).Scan(&inboundCalls)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM calls WHERE direction = 'outbound'`).Scan(&outboundCalls)

	// Calculate missed call rate
	missedRate := float64(0)
	if totalCalls > 0 {
		missedRate = float64(missedCalls) / float64(totalCalls) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": gin.H{
			"total_calls":          totalCalls,
			"answered_calls":       answeredCalls,
			"missed_calls":         missedCalls,
			"rejected_calls":       rejectedCalls,
			"avg_duration_seconds": avgDuration,
			"missed_rate_percent":  missedRate,
		},
		"by_direction": gin.H{
			"inbound":  inboundCalls,
			"outbound": outboundCalls,
		},
		"by_agent": agentStats,
	})
}

// itoa — simple int to string helper (menghindari import strconv)
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := ""
	for n > 0 {
		digits = string(rune('0'+n%10)) + digits
		n /= 10
	}
	return digits
}
