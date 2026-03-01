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
- GET    /api/conversations     → List semua conversations
- GET    /api/conversations/:id → Detail satu conversation
- PATCH  /api/conversations/:id → Update status / toggle AI
═══════════════════════════════════════════════════════
*/

// ConversationHandler mengelola conversations
type ConversationHandler struct {
	DB *pgxpool.Pool
}

// conversationColumns — kolom SELECT untuk conversations (DRY principle)
const conversationColumns = `id, inbox_id, customer_phone, customer_name, platform, 
	status, ai_enabled, assigned_agent, last_message, last_message_at, created_at`

// scanConversation — scan satu row conversation ke struct
func scanConversation(scan func(dest ...any) error) (models.Conversation, error) {
	var conv models.Conversation
	err := scan(&conv.ID, &conv.InboxID, &conv.CustomerPhone, &conv.CustomerName,
		&conv.Platform, &conv.Status, &conv.AIEnabled, &conv.AssignedAgent,
		&conv.LastMessage, &conv.LastMessageAt, &conv.CreatedAt)
	return conv, err
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
		query = `SELECT ` + conversationColumns + ` 
				 FROM conversations WHERE status = $1 ORDER BY last_message_at DESC NULLS LAST`
		args = append(args, status)
	} else {
		query = `SELECT ` + conversationColumns + ` 
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
		conv, err := scanConversation(rows.Scan)
		if err != nil {
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

	row := h.DB.QueryRow(ctx,
		`SELECT `+conversationColumns+` FROM conversations WHERE id = $1`, id)
	conv, err := scanConversation(row.Scan)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversation": conv})
}

// UpdateConversation — PATCH /api/conversations/:id
// Body: { "status": "resolved" } dan/atau { "ai_enabled": false }
func (h *ConversationHandler) UpdateConversation(c *gin.Context) {
	id := c.Param("id")

	var body struct {
		Status    *string `json:"status"`
		AIEnabled *bool   `json:"ai_enabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()

	// Update status jika dikirim
	if body.Status != nil {
		_, err := h.DB.Exec(ctx,
			`UPDATE conversations SET status = $1 WHERE id = $2`,
			*body.Status, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
			return
		}
	}

	// Toggle AI jika dikirim
	if body.AIEnabled != nil {
		_, err := h.DB.Exec(ctx,
			`UPDATE conversations SET ai_enabled = $1 WHERE id = $2`,
			*body.AIEnabled, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle AI"})
			return
		}
	}

	// Ambil conversation terbaru untuk response
	row := h.DB.QueryRow(ctx,
		`SELECT `+conversationColumns+` FROM conversations WHERE id = $1`, id)
	conv, err := scanConversation(row.Scan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated", "conversation": conv})
}
