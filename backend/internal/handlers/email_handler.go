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
Email Handler — Kirim & terima email sebagai conversation

Penjelasan:
Email masuk dikonversi menjadi conversation di CekatIn,
mirip seperti pesan WhatsApp. Agent bisa reply email
langsung dari dashboard.

Endpoints:
- POST /api/email/send         → Kirim email baru (atau reply)
- POST /api/email/inbound      → Webhook untuk email masuk (dari email forwarding service)
- GET  /api/email/threads       → List email threads (conversations platform=email)
- GET  /api/email/threads/:id   → Detail thread + semua messages

Alur email masuk:
1. Customer kirim email ke support@cekatin.id
2. Email forwarding service (Mailgun/SendGrid/custom) POST ke /api/email/inbound
3. Handler buat conversation + simpan sebagai message
4. Cika AI reply (jika enabled)
5. AI reply dikirim via SMTP ke customer

Alur email keluar (dari dashboard):
1. Agent klik "Reply" di dashboard
2. POST /api/email/send → { to, subject, body, conversation_id }
3. Handler kirim via SMTP + simpan ke DB + broadcast ke WS
═══════════════════════════════════════════════════════
*/

// EmailHandler mengelola email conversations
type EmailHandler struct {
	DB    *pgxpool.Pool
	Email *services.EmailService
	AI    *services.GeminiService
	Hub   *services.Hub
}

// SendEmail — POST /api/email/send
// Kirim email baru atau reply dari dashboard
// Body: { to, cc?, subject, body, html?, conversation_id?, reply_to? }
func (h *EmailHandler) SendEmail(c *gin.Context) {
	var req struct {
		To             string   `json:"to" binding:"required"`
		CC             []string `json:"cc"`
		Subject        string   `json:"subject" binding:"required"`
		Body           string   `json:"body"`
		HTML           string   `json:"html"`
		ConversationID string   `json:"conversation_id"` // Opsional — link ke conversation existing
		ReplyTo        string   `json:"reply_to"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to and subject required"})
		return
	}

	if !h.Email.IsConfigured {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Email service not configured"})
		return
	}

	// 1. Kirim email via SMTP
	emailMsg := &services.EmailMessage{
		To:      []string{req.To},
		CC:      req.CC,
		Subject: req.Subject,
		Body:    req.Body,
		HTML:    req.HTML,
		ReplyTo: req.ReplyTo,
	}

	if err := h.Email.SendEmail(emailMsg); err != nil {
		log.Printf("❌ Gagal kirim email: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email: " + err.Error()})
		return
	}

	ctx := context.Background()
	now := time.Now()
	content := req.Body
	if req.HTML != "" {
		content = req.HTML
	}

	// 2. Cari atau buat conversation
	convID := req.ConversationID
	if convID == "" {
		// Buat conversation baru untuk email ini
		err := h.DB.QueryRow(ctx,
			`INSERT INTO conversations (customer_phone, customer_name, platform, status, ai_enabled, last_message, last_message_at)
			 VALUES ($1, $2, 'email', 'open', true, $3, $4) RETURNING id`,
			req.To, req.To, "📧 "+req.Subject, now,
		).Scan(&convID)
		if err != nil {
			log.Printf("⚠️ Gagal buat email conversation: %v", err)
		}
	}

	// 3. Simpan pesan ke DB
	var msgID string
	if convID != "" {
		h.DB.QueryRow(ctx,
			`INSERT INTO messages (conversation_id, direction, content, message_type, status)
			 VALUES ($1, 'outbound', $2, 'text', 'sent') RETURNING id`,
			convID, content,
		).Scan(&msgID)

		// Update last message
		h.DB.Exec(ctx,
			`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
			"📧 "+req.Subject, now, convID)

		// Broadcast ke dashboard
		h.Hub.BroadcastMessage(&models.WebSocketMessage{
			Type: "new_message",
			Conversation: &models.Conversation{
				ID:            convID,
				CustomerPhone: req.To,
				CustomerName:  req.To,
				Platform:      "email",
				LastMessage:   "📧 " + req.Subject,
				LastMessageAt: &now,
			},
			Message: &models.Message{
				ID:             msgID,
				ConversationID: convID,
				Direction:      "outbound",
				Content:        content,
				MessageType:    "text",
				CreatedAt:      now,
			},
		})
	}

	log.Printf("📧 Email terkirim ke %s: %s", req.To, req.Subject)
	c.JSON(http.StatusOK, gin.H{
		"message":         "Email sent",
		"conversation_id": convID,
	})
}

// InboundEmail — POST /api/email/inbound
// Webhook untuk email masuk (dari Mailgun, SendGrid, atau custom forwarder)
// Body: { from, to, subject, body, html?, headers? }
func (h *EmailHandler) InboundEmail(c *gin.Context) {
	var req struct {
		From    string `json:"from" binding:"required"`
		To      string `json:"to"`
		Subject string `json:"subject"`
		Body    string `json:"body"`
		HTML    string `json:"html"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from required"})
		return
	}

	ctx := context.Background()
	now := time.Now()

	content := req.Body
	if content == "" && req.HTML != "" {
		content = req.HTML
	}

	// 1. Cari conversation existing untuk email ini
	var convID string
	err := h.DB.QueryRow(ctx,
		`SELECT id FROM conversations WHERE customer_phone = $1 AND platform = 'email' AND status = 'open'
		 ORDER BY created_at DESC LIMIT 1`,
		req.From,
	).Scan(&convID)

	if err != nil {
		// 2. Buat conversation baru
		err = h.DB.QueryRow(ctx,
			`INSERT INTO conversations (customer_phone, customer_name, platform, status, ai_enabled, last_message, last_message_at)
			 VALUES ($1, $2, 'email', 'open', true, $3, $4) RETURNING id`,
			req.From, req.From, "📧 "+req.Subject, now,
		).Scan(&convID)
		if err != nil {
			log.Printf("❌ Gagal buat email conversation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed"})
			return
		}
		log.Printf("📧 Email conversation baru dari: %s", req.From)
	}

	// 3. Simpan email sebagai message inbound
	var msgID string
	h.DB.QueryRow(ctx,
		`INSERT INTO messages (conversation_id, direction, content, message_type, status)
		 VALUES ($1, 'inbound', $2, 'text', 'received') RETURNING id`,
		convID, content,
	).Scan(&msgID)

	// Update last message
	h.DB.Exec(ctx,
		`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
		"📧 "+req.Subject, now, convID)

	// 4. Auto-create contact
	h.DB.Exec(ctx,
		`INSERT INTO contacts (name, email, phone) VALUES ($1, $2, '')
		 ON CONFLICT DO NOTHING`,
		req.From, req.From)

	// 5. Broadcast ke dashboard
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "new_message",
		Conversation: &models.Conversation{
			ID:            convID,
			CustomerPhone: req.From,
			CustomerName:  req.From,
			Platform:      "email",
			LastMessage:   "📧 " + req.Subject,
			LastMessageAt: &now,
		},
		Message: &models.Message{
			ID:             msgID,
			ConversationID: convID,
			Direction:      "inbound",
			Content:        content,
			MessageType:    "text",
			CreatedAt:      now,
		},
	})

	// 6. Cika AI auto-reply (jika enabled)
	var aiEnabled bool
	h.DB.QueryRow(ctx, `SELECT ai_enabled FROM conversations WHERE id = $1`, convID).Scan(&aiEnabled)

	if aiEnabled && h.AI != nil && h.AI.IsEnabled() {
		go func() {
			bgCtx := context.Background()
			aiReply, err := h.AI.GenerateReply(bgCtx, h.DB, convID, content)
			if err != nil || aiReply == "" {
				return
			}

			// Simpan AI reply
			var replyMsgID string
			h.DB.QueryRow(bgCtx,
				`INSERT INTO messages (conversation_id, direction, content, message_type, status)
				 VALUES ($1, 'outbound', $2, 'ai', 'sent') RETURNING id`,
				convID, aiReply,
			).Scan(&replyMsgID)

			replyTime := time.Now()
			h.DB.Exec(bgCtx,
				`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
				aiReply, replyTime, convID)

			// Kirim email reply via SMTP
			if h.Email.IsConfigured {
				h.Email.SendReplyEmail(req.From, "Re: "+req.Subject, aiReply, req.To)
			}

			// Broadcast ke dashboard
			h.Hub.BroadcastMessage(&models.WebSocketMessage{
				Type: "new_message",
				Message: &models.Message{
					ID:             replyMsgID,
					ConversationID: convID,
					Direction:      "outbound",
					Content:        aiReply,
					MessageType:    "ai",
					CreatedAt:      replyTime,
				},
			})

			log.Printf("📧 AI reply email ke %s: %s", req.From, aiReply[:min(50, len(aiReply))])
		}()
	}

	c.JSON(http.StatusOK, gin.H{"status": "received", "conversation_id": convID})
}

// ListEmailThreads — GET /api/email/threads
// List semua email conversations
func (h *EmailHandler) ListEmailThreads(c *gin.Context) {
	ctx := context.Background()
	rows, err := h.DB.Query(ctx,
		`SELECT id, customer_phone, customer_name, status, ai_enabled, last_message, last_message_at, created_at
		 FROM conversations WHERE platform = 'email' ORDER BY last_message_at DESC NULLS LAST LIMIT 100`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query"})
		return
	}
	defer rows.Close()

	var threads []models.Conversation
	for rows.Next() {
		var conv models.Conversation
		conv.Platform = "email"
		if err := rows.Scan(&conv.ID, &conv.CustomerPhone, &conv.CustomerName,
			&conv.Status, &conv.AIEnabled, &conv.LastMessage, &conv.LastMessageAt, &conv.CreatedAt); err == nil {
			threads = append(threads, conv)
		}
	}
	if threads == nil {
		threads = []models.Conversation{}
	}

	c.JSON(http.StatusOK, gin.H{"threads": threads, "total": len(threads)})
}

// GetEmailThread — GET /api/email/threads/:id
// Detail satu email thread + semua messages
func (h *EmailHandler) GetEmailThread(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	// Get conversation
	var conv models.Conversation
	err := h.DB.QueryRow(ctx,
		`SELECT id, customer_phone, customer_name, status, ai_enabled, last_message, last_message_at, created_at
		 FROM conversations WHERE id = $1 AND platform = 'email'`, id,
	).Scan(&conv.ID, &conv.CustomerPhone, &conv.CustomerName,
		&conv.Status, &conv.AIEnabled, &conv.LastMessage, &conv.LastMessageAt, &conv.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}
	conv.Platform = "email"

	// Get messages
	rows, err := h.DB.Query(ctx,
		`SELECT id, direction, content, message_type, status, created_at
		 FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query messages"})
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		msg.ConversationID = id
		if err := rows.Scan(&msg.ID, &msg.Direction, &msg.Content,
			&msg.MessageType, &msg.Status, &msg.CreatedAt); err == nil {
			messages = append(messages, msg)
		}
	}
	if messages == nil {
		messages = []models.Message{}
	}

	c.JSON(http.StatusOK, gin.H{"thread": conv, "messages": messages})
}

// min helper
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
