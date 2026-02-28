package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cekatin-backend/internal/models"
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
