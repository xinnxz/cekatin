package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cekatin-backend/internal/models"
	"github.com/xinnxz/cekatin-backend/internal/services"
)

/*
═══════════════════════════════════════════════════════
Message Handler — Kirim pesan dari dashboard ke WhatsApp

Alur kirim pesan:
1. User ketik pesan di dashboard → POST /api/messages/send
2. Handler validasi request → cari conversation
3. Simpan pesan (direction: outbound) ke database
4. Panggil WhatsApp Service → kirim ke Meta Cloud API
5. Meta kirim ke customer via WhatsApp
6. Broadcast via WebSocket ke dashboard
═══════════════════════════════════════════════════════
*/

// MessageHandler mengelola pengiriman & listing pesan
type MessageHandler struct {
	DB  *pgxpool.Pool
	WA  *services.WhatsAppService
	Hub *services.Hub
}

// SendMessage — POST /api/messages/send
// Body: { conversation_id: "...", content: "Hello!", message_type: "text" }
func (h *MessageHandler) SendMessage(c *gin.Context) {
	var req models.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Default message type = text
	if req.MessageType == "" {
		req.MessageType = "text"
	}

	ctx := context.Background()

	// 1. Ambil data conversation (untuk dapat nomor customer)
	var customerPhone string
	err := h.DB.QueryRow(ctx,
		`SELECT customer_phone FROM conversations WHERE id = $1`,
		req.ConversationID,
	).Scan(&customerPhone)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	// 2. Kirim via WhatsApp API
	waMessageID, err := h.WA.SendTextMessage(customerPhone, req.Content)
	if err != nil {
		log.Printf("❌ Gagal kirim WA: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send: " + err.Error()})
		return
	}

	// 3. Simpan pesan ke database
	var messageID string
	now := time.Now()
	err = h.DB.QueryRow(ctx,
		`INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id, status)
		 VALUES ($1, 'outbound', $2, $3, $4, 'sent')
		 RETURNING id`,
		req.ConversationID, req.Content, req.MessageType, waMessageID,
	).Scan(&messageID)

	if err != nil {
		log.Printf("❌ Gagal simpan pesan outbound: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Message sent but failed to save"})
		return
	}

	// 4. Update last_message di conversation
	_, _ = h.DB.Exec(ctx,
		`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
		req.Content, now, req.ConversationID,
	)

	// 5. Broadcast ke dashboard
	msg := &models.Message{
		ID:             messageID,
		ConversationID: req.ConversationID,
		Direction:      "outbound",
		Content:        req.Content,
		MessageType:    req.MessageType,
		WAMessageID:    waMessageID,
		Status:         "sent",
		CreatedAt:      now,
	}

	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type:    "new_message",
		Message: msg,
	})

	log.Printf("📤 Pesan terkirim ke %s: %s", customerPhone, req.Content)

	c.JSON(http.StatusOK, gin.H{
		"status":  "sent",
		"message": msg,
	})
}

// GetMessages — GET /api/conversations/:id/messages
// Mengembalikan semua pesan dalam satu conversation, urut dari terlama
func (h *MessageHandler) GetMessages(c *gin.Context) {
	conversationID := c.Param("id")
	ctx := context.Background()

	rows, err := h.DB.Query(ctx,
		`SELECT id, conversation_id, direction, content, message_type, wa_message_id, status, created_at
		 FROM messages
		 WHERE conversation_id = $1
		 ORDER BY created_at ASC`,
		conversationID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query messages"})
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.Direction, &m.Content,
			&m.MessageType, &m.WAMessageID, &m.Status, &m.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, m)
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
