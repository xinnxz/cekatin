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
Conversation Handler — List & manage conversations

Endpoints:
- GET /api/conversations → List semua conversations (untuk sidebar chat)
- GET /api/conversations/:id → Detail satu conversation
- PATCH /api/conversations/:id → Update status (open/resolved/pending)
═══════════════════════════════════════════════════════
*/

// ConversationHandler mengelola conversations
type ConversationHandler struct {
	DB *pgxpool.Pool
}

// ListConversations — GET /api/conversations
// Mengembalikan semua conversations, urut dari terbaru
func (h *ConversationHandler) ListConversations(c *gin.Context) {
	ctx := context.Background()

	// Optional filter by status
	status := c.Query("status") // ?status=open

	var query string
	var args []interface{}

	if status != "" {
		query = `SELECT id, inbox_id, customer_phone, customer_name, platform, status, 
				 last_message, last_message_at, created_at
				 FROM conversations WHERE status = $1 ORDER BY last_message_at DESC NULLS LAST`
		args = append(args, status)
	} else {
		query = `SELECT id, inbox_id, customer_phone, customer_name, platform, status, 
				 last_message, last_message_at, created_at
				 FROM conversations ORDER BY last_message_at DESC NULLS LAST`
	}

	rows, err := h.DB.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query conversations"})
		return
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var conv models.Conversation
		if err := rows.Scan(&conv.ID, &conv.InboxID, &conv.CustomerPhone, &conv.CustomerName,
			&conv.Platform, &conv.Status, &conv.LastMessage, &conv.LastMessageAt, &conv.CreatedAt); err != nil {
			continue
		}
		conversations = append(conversations, conv)
	}

	if conversations == nil {
		conversations = []models.Conversation{}
	}

	c.JSON(http.StatusOK, gin.H{"conversations": conversations})
}

// GetConversation — GET /api/conversations/:id
func (h *ConversationHandler) GetConversation(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	var conv models.Conversation
	err := h.DB.QueryRow(ctx,
		`SELECT id, inbox_id, customer_phone, customer_name, platform, status, 
		 last_message, last_message_at, created_at
		 FROM conversations WHERE id = $1`,
		id,
	).Scan(&conv.ID, &conv.InboxID, &conv.CustomerPhone, &conv.CustomerName,
		&conv.Platform, &conv.Status, &conv.LastMessage, &conv.LastMessageAt, &conv.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversation": conv})
}

// UpdateConversation — PATCH /api/conversations/:id
// Body: { status: "resolved" }
func (h *ConversationHandler) UpdateConversation(c *gin.Context) {
	id := c.Param("id")

	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	result, err := h.DB.Exec(ctx,
		`UPDATE conversations SET status = $1 WHERE id = $2`,
		body.Status, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Conversation updated", "status": body.Status})
}
