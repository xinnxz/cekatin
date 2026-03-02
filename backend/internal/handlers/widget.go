package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cekatin-backend/internal/models"
	"github.com/xinnxz/cekatin-backend/internal/services"
)

/*
═══════════════════════════════════════════════════════
Widget Handler — Serve the embeddable chat widget

Endpoints:
- GET    /api/widget/config       → Widget configuration per tenant
- GET    /api/widget/history      → Chat history for session
- POST   /api/chat                → Receive message, call AI, return reply
- POST   /api/widget/prechat      → Submit pre-chat form (nama, email, phone)
- PUT    /api/widget/config       → Update widget config (admin)
- POST   /api/widget/blacklist    → Tambah IP ke blacklist (admin)
- DELETE /api/widget/blacklist    → Hapus IP dari blacklist (admin)
- GET    /api/widget/blacklist    → List IP blacklist (admin)

Fitur:
1. ✅ Embeddable widget (Shadow DOM)
2. ✅ Widget → Go backend → Cika AI → reply
3. ✅ Web conversations muncul di dashboard
4. ✅ Widget customization per tenant (logo, warna, greeting)
5. ✅ Pre-chat form (nama, email, phone)
6. ✅ Offline form (di luar working hours)
7. ✅ IP Blacklist (blokir IP spam)
8. ✅ Visitor browser info (user agent, referrer, IP)
═══════════════════════════════════════════════════════
*/

type WidgetHandler struct {
	DB  *pgxpool.Pool
	AI  *services.GeminiService
	Hub *services.Hub
}

// WidgetConfig — GET /api/widget/config?tenant=slug
// Mengembalikan konfigurasi widget dari database (per tenant)
// Jika tenant tidak ditemukan, return default config
func (h *WidgetHandler) WidgetConfig(c *gin.Context) {
	tenant := c.Query("tenant")
	if tenant == "" {
		tenant = "default"
	}

	ctx := context.Background()

	var botName, primaryColor, greetingMessage, logoURL, offlineMessage string
	var prechatEnabled, offlineEnabled bool
	var prechatFieldsJSON, workingHoursJSON []byte

	err := h.DB.QueryRow(ctx,
		`SELECT bot_name, primary_color, greeting_message, logo_url,
		        prechat_enabled, prechat_fields, offline_enabled, offline_message, working_hours
		 FROM widget_configs WHERE tenant_slug = $1`, tenant,
	).Scan(&botName, &primaryColor, &greetingMessage, &logoURL,
		&prechatEnabled, &prechatFieldsJSON, &offlineEnabled, &offlineMessage, &workingHoursJSON)

	if err != nil {
		// Tenant tidak ditemukan → return default
		c.JSON(http.StatusOK, gin.H{
			"botName":         "Cika",
			"primaryColor":    "#4F46E5",
			"greetingMessage": "Halo! 👋 Saya Cika, asisten virtual Cepat Chat. Ada yang bisa saya bantu?",
			"logoUrl":         "",
			"prechatEnabled":  false,
			"prechatFields":   []string{"name"},
			"offlineEnabled":  false,
			"offlineMessage":  "Kami sedang offline. Silakan tinggalkan pesan.",
			"workingHours":    gin.H{"start": "08:00", "end": "22:00", "timezone": "Asia/Jakarta"},
			"isOffline":       false,
		})
		return
	}

	// Parse prechat_fields dan working_hours
	var prechatFields []string
	json.Unmarshal(prechatFieldsJSON, &prechatFields)

	var workingHours map[string]string
	json.Unmarshal(workingHoursJSON, &workingHours)

	// Cek apakah saat ini di luar working hours
	isOffline := false
	if offlineEnabled {
		isOffline = checkOffline(workingHours)
	}

	c.JSON(http.StatusOK, gin.H{
		"botName":         botName,
		"primaryColor":    primaryColor,
		"greetingMessage": greetingMessage,
		"logoUrl":         logoURL,
		"prechatEnabled":  prechatEnabled,
		"prechatFields":   prechatFields,
		"offlineEnabled":  offlineEnabled,
		"offlineMessage":  offlineMessage,
		"workingHours":    workingHours,
		"isOffline":       isOffline,
	})
}

// UpdateWidgetConfig — PUT /api/widget/config
// Update konfigurasi widget per tenant (admin endpoint)
func (h *WidgetHandler) UpdateWidgetConfig(c *gin.Context) {
	var req struct {
		Tenant          string   `json:"tenant" binding:"required"`
		BotName         string   `json:"bot_name"`
		PrimaryColor    string   `json:"primary_color"`
		GreetingMessage string   `json:"greeting_message"`
		LogoURL         string   `json:"logo_url"`
		PrechatEnabled  *bool    `json:"prechat_enabled"`
		PrechatFields   []string `json:"prechat_fields"`
		OfflineEnabled  *bool    `json:"offline_enabled"`
		OfflineMessage  string   `json:"offline_message"`
		WorkingHours    *struct {
			Start    string `json:"start"`
			End      string `json:"end"`
			Timezone string `json:"timezone"`
		} `json:"working_hours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ctx := context.Background()

	// UPSERT — insert atau update jika sudah ada
	prechatFieldsJSON, _ := json.Marshal(req.PrechatFields)
	if req.PrechatFields == nil {
		prechatFieldsJSON = []byte(`["name"]`)
	}

	workingHoursJSON := []byte(`{"start":"08:00","end":"22:00","timezone":"Asia/Jakarta"}`)
	if req.WorkingHours != nil {
		workingHoursJSON, _ = json.Marshal(req.WorkingHours)
	}

	prechatEnabled := false
	if req.PrechatEnabled != nil {
		prechatEnabled = *req.PrechatEnabled
	}
	offlineEnabled := false
	if req.OfflineEnabled != nil {
		offlineEnabled = *req.OfflineEnabled
	}

	if req.BotName == "" {
		req.BotName = "Cika"
	}
	if req.PrimaryColor == "" {
		req.PrimaryColor = "#4F46E5"
	}
	if req.GreetingMessage == "" {
		req.GreetingMessage = "Halo! 👋 Ada yang bisa kami bantu?"
	}

	_, err := h.DB.Exec(ctx,
		`INSERT INTO widget_configs (tenant_slug, bot_name, primary_color, greeting_message, logo_url,
		 prechat_enabled, prechat_fields, offline_enabled, offline_message, working_hours, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
		 ON CONFLICT (tenant_slug) DO UPDATE SET
		   bot_name = EXCLUDED.bot_name, primary_color = EXCLUDED.primary_color,
		   greeting_message = EXCLUDED.greeting_message, logo_url = EXCLUDED.logo_url,
		   prechat_enabled = EXCLUDED.prechat_enabled, prechat_fields = EXCLUDED.prechat_fields,
		   offline_enabled = EXCLUDED.offline_enabled, offline_message = EXCLUDED.offline_message,
		   working_hours = EXCLUDED.working_hours, updated_at = NOW()`,
		req.Tenant, req.BotName, req.PrimaryColor, req.GreetingMessage, req.LogoURL,
		prechatEnabled, prechatFieldsJSON, offlineEnabled, req.OfflineMessage, workingHoursJSON,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save config: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Widget config saved"})
}

// WidgetPrechat — POST /api/widget/prechat
// Submit pre-chat form sebelum mulai chat
// Body: { session_id, name?, email?, phone? }
func (h *WidgetHandler) WidgetPrechat(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id" binding:"required"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id required"})
		return
	}

	ctx := context.Background()

	// Update customer name jika ada
	customerName := "Web Visitor"
	if req.Name != "" {
		customerName = req.Name
	}

	// Cari atau buat conversation
	var convID string
	err := h.DB.QueryRow(ctx,
		`SELECT id FROM conversations WHERE customer_phone = $1 AND platform = 'web' AND status = 'open'
		 ORDER BY created_at DESC LIMIT 1`,
		req.SessionID,
	).Scan(&convID)

	if err != nil {
		// Buat conversation baru dengan info dari pre-chat form
		err = h.DB.QueryRow(ctx,
			`INSERT INTO conversations (customer_phone, customer_name, platform, status, ai_enabled)
			 VALUES ($1, $2, 'web', 'open', true) RETURNING id`,
			req.SessionID, customerName,
		).Scan(&convID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
			return
		}
	} else {
		// Update nama jika conversation sudah ada
		h.DB.Exec(ctx, `UPDATE conversations SET customer_name = $1 WHERE id = $2`, customerName, convID)
	}

	// Auto-create/update contact
	if req.Email != "" || req.Phone != "" {
		h.DB.Exec(ctx,
			`INSERT INTO contacts (name, email, phone) VALUES ($1, $2, $3)
			 ON CONFLICT DO NOTHING`,
			customerName, req.Email, req.Phone)
	}

	log.Printf("📋 Pre-chat form: %s (%s, %s)", customerName, req.Email, req.Phone)
	c.JSON(http.StatusOK, gin.H{"message": "Pre-chat info saved", "conversation_id": convID})
}

// WidgetHistory — GET /api/widget/history
// Mengembalikan riwayat chat untuk session tertentu
func (h *WidgetHandler) WidgetHistory(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusOK, gin.H{"messages": []any{}})
		return
	}

	ctx := context.Background()

	var convID string
	err := h.DB.QueryRow(ctx,
		`SELECT id FROM conversations WHERE customer_phone = $1 AND platform = 'web'
		 ORDER BY created_at DESC LIMIT 1`,
		sessionID,
	).Scan(&convID)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{"messages": []any{}})
		return
	}

	rows, err := h.DB.Query(ctx,
		`SELECT direction, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
		convID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"messages": []any{}})
		return
	}
	defer rows.Close()

	type WidgetMsg struct {
		Text   string `json:"text"`
		Sender string `json:"sender"`
	}

	var msgs []WidgetMsg
	for rows.Next() {
		var direction, content string
		if err := rows.Scan(&direction, &content); err != nil {
			continue
		}
		sender := "bot"
		if direction == "inbound" {
			sender = "user"
		}
		msgs = append(msgs, WidgetMsg{Text: content, Sender: sender})
	}
	if msgs == nil {
		msgs = []WidgetMsg{}
	}

	c.JSON(http.StatusOK, gin.H{"messages": msgs})
}

// WidgetChat — POST /api/chat
// Menerima pesan dari widget, simpan ke DB, panggil AI, return reply
// Body: { message, session_id, tenant?, visitor_info? }
func (h *WidgetHandler) WidgetChat(c *gin.Context) {
	// 0. IP Blacklist check
	clientIP := c.ClientIP()
	if h.isIPBlacklisted(clientIP) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req struct {
		Message     string          `json:"message" binding:"required"`
		SessionID   string          `json:"session_id" binding:"required"`
		Tenant      string          `json:"tenant"`
		VisitorInfo json.RawMessage `json:"visitor_info"` // { user_agent, referrer, language, screen }
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message and session_id required"})
		return
	}

	ctx := context.Background()
	now := time.Now()

	// 1. Cari atau buat conversation
	var convID string
	err := h.DB.QueryRow(ctx,
		`SELECT id FROM conversations WHERE customer_phone = $1 AND platform = 'web' AND status = 'open'
		 ORDER BY created_at DESC LIMIT 1`,
		req.SessionID,
	).Scan(&convID)

	if err != nil {
		err = h.DB.QueryRow(ctx,
			`INSERT INTO conversations (customer_phone, customer_name, platform, status, ai_enabled)
			 VALUES ($1, 'Web Visitor', 'web', 'open', true) RETURNING id`,
			req.SessionID,
		).Scan(&convID)
		if err != nil {
			log.Printf("❌ Gagal buat web conversation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
			return
		}
		log.Printf("🌐 Web conversation baru: %s (session: %s)", convID, req.SessionID)
	}

	// 2. Simpan visitor info (user agent, referrer, IP, dll)
	if len(req.VisitorInfo) > 0 {
		// Merge IP address into visitor info
		var visitorData map[string]interface{}
		json.Unmarshal(req.VisitorInfo, &visitorData)
		if visitorData == nil {
			visitorData = map[string]interface{}{}
		}
		visitorData["ip"] = clientIP
		visitorJSON, _ := json.Marshal(visitorData)
		h.DB.Exec(ctx,
			`UPDATE conversations SET visitor_info = $1 WHERE id = $2`,
			visitorJSON, convID)
	} else {
		// Simpan setidaknya IP
		visitorJSON, _ := json.Marshal(map[string]string{"ip": clientIP})
		h.DB.Exec(ctx,
			`UPDATE conversations SET visitor_info = COALESCE(visitor_info, '{}') || $1::jsonb WHERE id = $2`,
			visitorJSON, convID)
	}

	// 3. Simpan pesan customer ke DB
	var msgID string
	err = h.DB.QueryRow(ctx,
		`INSERT INTO messages (conversation_id, direction, content, message_type, status)
		 VALUES ($1, 'inbound', $2, 'text', 'received') RETURNING id`,
		convID, req.Message,
	).Scan(&msgID)
	if err != nil {
		log.Printf("⚠️ Gagal simpan pesan widget: %v", err)
	}

	// Update last_message
	h.DB.Exec(ctx,
		`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
		req.Message, now, convID)

	// 4. Broadcast pesan masuk ke dashboard
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "new_message",
		Conversation: &models.Conversation{
			ID:            convID,
			CustomerPhone: req.SessionID,
			CustomerName:  "Web Visitor",
			Platform:      "web",
			LastMessage:   req.Message,
			LastMessageAt: &now,
		},
		Message: &models.Message{
			ID:             msgID,
			ConversationID: convID,
			Direction:      "inbound",
			Content:        req.Message,
			MessageType:    "text",
			CreatedAt:      now,
		},
	})

	// 5. Cek AI enabled
	var aiEnabled bool
	h.DB.QueryRow(ctx,
		`SELECT ai_enabled FROM conversations WHERE id = $1`, convID,
	).Scan(&aiEnabled)

	if !aiEnabled || !h.AI.IsEnabled() {
		c.JSON(http.StatusOK, gin.H{
			"response":          "Terima kasih, pesan Anda sudah kami terima. Tim kami akan segera membalas. 🙏",
			"suggested_replies": []string{},
		})
		return
	}

	// 6. Panggil Cika AI
	aiReply, err := h.AI.GenerateReply(ctx, h.DB, convID, req.Message)
	if err != nil || aiReply == "" {
		aiReply = "Maaf, saya sedang tidak bisa memproses pesan. Tim kami akan membalas segera. 🙏"
	}

	// 7. Simpan AI reply ke DB
	var replyMsgID string
	h.DB.QueryRow(ctx,
		`INSERT INTO messages (conversation_id, direction, content, message_type, status)
		 VALUES ($1, 'outbound', $2, 'ai', 'sent') RETURNING id`,
		convID, aiReply,
	).Scan(&replyMsgID)

	// Update last_message
	replyTime := time.Now()
	h.DB.Exec(ctx,
		`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
		aiReply, replyTime, convID)

	// 8. Broadcast AI reply ke dashboard
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "new_message",
		Conversation: &models.Conversation{
			ID:            convID,
			CustomerPhone: req.SessionID,
			CustomerName:  "Web Visitor",
			Platform:      "web",
			LastMessage:   aiReply,
			LastMessageAt: &replyTime,
		},
		Message: &models.Message{
			ID:             replyMsgID,
			ConversationID: convID,
			Direction:      "outbound",
			Content:        aiReply,
			MessageType:    "ai",
			CreatedAt:      replyTime,
		},
	})

	truncated := aiReply
	if len(truncated) > 50 {
		truncated = truncated[:50]
	}
	log.Printf("🌐 Web chat: %s → Cika: %s", req.Message, truncated)

	c.JSON(http.StatusOK, gin.H{
		"response":          aiReply,
		"suggested_replies": []string{},
	})
}

// ═══════════════════════════════════════════════════════
// IP Blacklist Management
// ═══════════════════════════════════════════════════════

// AddIPBlacklist — POST /api/widget/blacklist
// Body: { ip_address, reason?, expires_hours? }
func (h *WidgetHandler) AddIPBlacklist(c *gin.Context) {
	var req struct {
		IPAddress    string `json:"ip_address" binding:"required"`
		Reason       string `json:"reason"`
		ExpiresHours int    `json:"expires_hours"` // 0 = permanent
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ip_address required"})
		return
	}

	ctx := context.Background()
	var expiresAt *time.Time
	if req.ExpiresHours > 0 {
		t := time.Now().Add(time.Duration(req.ExpiresHours) * time.Hour)
		expiresAt = &t
	}

	_, err := h.DB.Exec(ctx,
		`INSERT INTO widget_ip_blacklist (ip_address, reason, expires_at) VALUES ($1, $2, $3)`,
		req.IPAddress, req.Reason, expiresAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to blacklist IP"})
		return
	}

	log.Printf("🚫 IP blacklisted: %s (reason: %s)", req.IPAddress, req.Reason)
	c.JSON(http.StatusCreated, gin.H{"message": "IP blacklisted", "ip": req.IPAddress})
}

// RemoveIPBlacklist — DELETE /api/widget/blacklist
// Body: { ip_address }
func (h *WidgetHandler) RemoveIPBlacklist(c *gin.Context) {
	var req struct {
		IPAddress string `json:"ip_address" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ip_address required"})
		return
	}

	ctx := context.Background()
	_, err := h.DB.Exec(ctx, `DELETE FROM widget_ip_blacklist WHERE ip_address = $1`, req.IPAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove IP"})
		return
	}

	log.Printf("✅ IP removed from blacklist: %s", req.IPAddress)
	c.JSON(http.StatusOK, gin.H{"message": "IP removed from blacklist"})
}

// ListIPBlacklist — GET /api/widget/blacklist
func (h *WidgetHandler) ListIPBlacklist(c *gin.Context) {
	ctx := context.Background()
	rows, err := h.DB.Query(ctx,
		`SELECT id, ip_address, reason, expires_at, created_at FROM widget_ip_blacklist ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query blacklist"})
		return
	}
	defer rows.Close()

	type BlacklistEntry struct {
		ID        string     `json:"id"`
		IP        string     `json:"ip_address"`
		Reason    string     `json:"reason"`
		ExpiresAt *time.Time `json:"expires_at"`
		CreatedAt time.Time  `json:"created_at"`
	}
	var entries []BlacklistEntry
	for rows.Next() {
		var e BlacklistEntry
		if err := rows.Scan(&e.ID, &e.IP, &e.Reason, &e.ExpiresAt, &e.CreatedAt); err == nil {
			entries = append(entries, e)
		}
	}
	if entries == nil {
		entries = []BlacklistEntry{}
	}

	c.JSON(http.StatusOK, gin.H{"blacklist": entries, "total": len(entries)})
}

// ═══════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════

// isIPBlacklisted cek apakah IP ada di blacklist (dan belum expired)
func (h *WidgetHandler) isIPBlacklisted(ip string) bool {
	ctx := context.Background()
	var count int
	err := h.DB.QueryRow(ctx,
		`SELECT COUNT(*) FROM widget_ip_blacklist 
		 WHERE ip_address = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
		ip,
	).Scan(&count)
	return err == nil && count > 0
}

// checkOffline cek apakah saat ini di luar working hours
func checkOffline(hours map[string]string) bool {
	if hours == nil {
		return false
	}

	tz := hours["timezone"]
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return false
	}

	now := time.Now().In(loc)
	hourMin := now.Format("15:04")

	startH := hours["start"]
	endH := hours["end"]
	if startH == "" || endH == "" {
		return false
	}

	// Di luar working hours = offline
	return strings.Compare(hourMin, startH) < 0 || strings.Compare(hourMin, endH) > 0
}
