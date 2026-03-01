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
Widget Handler — Serve the embeddable chat widget

Endpoints (compatible with widget.js):
- GET  /api/widget/config  → Widget configuration (bot name, color, greeting)
- GET  /api/widget/history → Chat history for session
- POST /api/chat           → Receive message from widget, call Cika AI, return reply

Alur:
1. Customer buka website → widget.js load
2. Widget fetch config + history
3. Customer kirim pesan via POST /api/chat
4. Handler buat/cari conversation (platform: "web")
5. Simpan pesan ke DB + panggil Cika AI
6. Kirim AI reply + broadcast ke dashboard via WebSocket
7. Return reply ke widget
═══════════════════════════════════════════════════════
*/

type WidgetHandler struct {
	DB  *pgxpool.Pool
	AI  *services.GeminiService
	Hub *services.Hub
}

// WidgetConfig — GET /api/widget/config
// Mengembalikan konfigurasi widget (bot name, warna, greeting)
func (h *WidgetHandler) WidgetConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"botName":         "Cika",
		"primaryColor":    "#4F46E5",
		"greetingMessage": "Halo! 👋 Saya Cika, asisten virtual CekatIn. Ada yang bisa saya bantu?",
	})
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

	// Cari conversation berdasarkan session_id (disimpan di customer_phone untuk web)
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

	// Ambil semua pesan
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
		Sender string `json:"sender"` // "user" or "bot"
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
// Body: { message: "...", session_id: "...", tenant: "..." }
func (h *WidgetHandler) WidgetChat(c *gin.Context) {
	var req struct {
		Message   string `json:"message" binding:"required"`
		SessionID string `json:"session_id" binding:"required"`
		Tenant    string `json:"tenant"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message and session_id required"})
		return
	}

	ctx := context.Background()
	now := time.Now()

	// 1. Cari atau buat conversation untuk session ini
	var convID string
	err := h.DB.QueryRow(ctx,
		`SELECT id FROM conversations WHERE customer_phone = $1 AND platform = 'web' AND status = 'open'
		 ORDER BY created_at DESC LIMIT 1`,
		req.SessionID,
	).Scan(&convID)

	if err != nil {
		// Buat conversation baru
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

	// 2. Simpan pesan customer ke DB
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

	// 3. Broadcast pesan masuk ke dashboard
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

	// 4. Cek apakah AI enabled
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

	// 5. Panggil Cika AI
	aiReply, err := h.AI.GenerateReply(ctx, h.DB, convID, req.Message)
	if err != nil || aiReply == "" {
		aiReply = "Maaf, saya sedang tidak bisa memproses pesan. Tim kami akan membalas segera. 🙏"
	}

	// 6. Simpan AI reply ke DB
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

	// 7. Broadcast AI reply ke dashboard
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

	// 8. Return response ke widget
	c.JSON(http.StatusOK, gin.H{
		"response":          aiReply,
		"suggested_replies": []string{},
	})
}
