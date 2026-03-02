package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cepatchat/internal/models"
)

/*
═══════════════════════════════════════════════════════
Inbox Handler — CRUD untuk inboxes (platform connections)

Endpoints:
- GET  /api/inboxes      → List semua inbox
- POST /api/inboxes      → Buat inbox baru
- GET  /api/inboxes/:id  → Detail satu inbox
- DELETE /api/inboxes/:id → Hapus inbox
═══════════════════════════════════════════════════════
*/

// InboxHandler mengelola CRUD inbox
type InboxHandler struct {
	DB *pgxpool.Pool
}

// ListInboxes — GET /api/inboxes
func (h *InboxHandler) ListInboxes(c *gin.Context) {
	ctx := context.Background()

	rows, err := h.DB.Query(ctx,
		`SELECT id, name, platform, phone_number, waba_id, status, created_at
		 FROM inboxes ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query inboxes"})
		return
	}
	defer rows.Close()

	var inboxes []models.Inbox
	for rows.Next() {
		var inbox models.Inbox
		if err := rows.Scan(&inbox.ID, &inbox.Name, &inbox.Platform, &inbox.PhoneNumber,
			&inbox.WabaID, &inbox.Status, &inbox.CreatedAt); err != nil {
			continue
		}
		inboxes = append(inboxes, inbox)
	}

	// Return empty array instead of null jika kosong
	if inboxes == nil {
		inboxes = []models.Inbox{}
	}

	c.JSON(http.StatusOK, gin.H{"inboxes": inboxes})
}

// CreateInbox — POST /api/inboxes
func (h *InboxHandler) CreateInbox(c *gin.Context) {
	var req models.CreateInboxRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ctx := context.Background()
	var inbox models.Inbox

	err := h.DB.QueryRow(ctx,
		`INSERT INTO inboxes (name, platform, phone_number, access_token, phone_id, waba_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, name, platform, phone_number, waba_id, status, created_at`,
		req.Name, req.Platform, req.PhoneNumber, req.AccessToken, req.PhoneID, req.WabaID,
	).Scan(&inbox.ID, &inbox.Name, &inbox.Platform, &inbox.PhoneNumber,
		&inbox.WabaID, &inbox.Status, &inbox.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inbox: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"inbox": inbox})
}

// GetInbox — GET /api/inboxes/:id
func (h *InboxHandler) GetInbox(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	var inbox models.Inbox
	err := h.DB.QueryRow(ctx,
		`SELECT id, name, platform, phone_number, waba_id, status, created_at
		 FROM inboxes WHERE id = $1`,
		id,
	).Scan(&inbox.ID, &inbox.Name, &inbox.Platform, &inbox.PhoneNumber,
		&inbox.WabaID, &inbox.Status, &inbox.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inbox not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"inbox": inbox})
}

// DeleteInbox — DELETE /api/inboxes/:id
func (h *InboxHandler) DeleteInbox(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	result, err := h.DB.Exec(ctx, `DELETE FROM inboxes WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete inbox"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inbox not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inbox deleted"})
}

// UpdateInbox — PATCH /api/inboxes/:id
// Digunakan untuk mengupdate inbox (migrasi nomor, update token, dll)
// Body: { name?, phone_number?, access_token?, phone_id?, waba_id?, status? }
func (h *InboxHandler) UpdateInbox(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateInboxRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ctx := context.Background()

	// Build dynamic UPDATE query berdasarkan field yang di-send
	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.PhoneNumber != nil {
		updates = append(updates, fmt.Sprintf("phone_number = $%d", argIdx))
		args = append(args, *req.PhoneNumber)
		argIdx++
	}
	if req.AccessToken != nil {
		updates = append(updates, fmt.Sprintf("access_token = $%d", argIdx))
		args = append(args, *req.AccessToken)
		argIdx++
	}
	if req.PhoneID != nil {
		updates = append(updates, fmt.Sprintf("phone_id = $%d", argIdx))
		args = append(args, *req.PhoneID)
		argIdx++
	}
	if req.WabaID != nil {
		updates = append(updates, fmt.Sprintf("waba_id = $%d", argIdx))
		args = append(args, *req.WabaID)
		argIdx++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Tambahkan ID sebagai argument terakhir
	args = append(args, id)
	query := fmt.Sprintf("UPDATE inboxes SET %s WHERE id = $%d RETURNING id, name, platform, phone_number, waba_id, status, created_at",
		strings.Join(updates, ", "), argIdx)

	var inbox models.Inbox
	err := h.DB.QueryRow(ctx, query, args...).Scan(
		&inbox.ID, &inbox.Name, &inbox.Platform, &inbox.PhoneNumber,
		&inbox.WabaID, &inbox.Status, &inbox.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inbox: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"inbox": inbox, "message": "Inbox updated"})
}

// VerifyInbox — POST /api/inboxes/:id/verify
// Verifikasi apakah access token + phone number ID valid dengan memanggil Meta API
// Ini digunakan saat setup nomor baru atau migrasi nomor
func (h *InboxHandler) VerifyInbox(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	// 1. Ambil credentials dari DB
	var accessToken, phoneID string
	err := h.DB.QueryRow(ctx,
		`SELECT access_token, phone_id FROM inboxes WHERE id = $1`, id,
	).Scan(&accessToken, &phoneID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inbox not found"})
		return
	}

	if accessToken == "" || phoneID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Access token or Phone ID not configured"})
		return
	}

	// 2. Call Meta API untuk verifikasi
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s", phoneID)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"verified": false,
			"error":    "Failed to connect to Meta API: " + err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		// Update status inbox ke "error"
		_, _ = h.DB.Exec(ctx, `UPDATE inboxes SET status = 'error' WHERE id = $1`, id)
		c.JSON(http.StatusOK, gin.H{
			"verified": false,
			"error":    "Meta API returned " + resp.Status,
			"details":  string(body),
		})
		return
	}

	// 3. Parse response — ambil verified_name dan display_phone_number
	var metaResp struct {
		VerifiedName  string `json:"verified_name"`
		DisplayPhone  string `json:"display_phone_number"`
		QualityRating string `json:"quality_rating"`
		ID            string `json:"id"`
	}
	if err := json.Unmarshal(body, &metaResp); err == nil && metaResp.VerifiedName != "" {
		// Update inbox dengan verified info
		_, _ = h.DB.Exec(ctx,
			`UPDATE inboxes SET status = 'active', phone_number = COALESCE(NULLIF(phone_number, ''), $1) WHERE id = $2`,
			metaResp.DisplayPhone, id,
		)
	} else {
		_, _ = h.DB.Exec(ctx, `UPDATE inboxes SET status = 'active' WHERE id = $1`, id)
	}

	c.JSON(http.StatusOK, gin.H{
		"verified":       true,
		"verified_name":  metaResp.VerifiedName,
		"display_phone":  metaResp.DisplayPhone,
		"quality_rating": metaResp.QualityRating,
		"phone_id":       metaResp.ID,
	})
}
