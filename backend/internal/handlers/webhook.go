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
Webhook Handler — Menerima pesan masuk dari WhatsApp

Penjelasan alur webhook:
1. Meta mengirim HTTP POST ke /webhook setiap ada pesan masuk
2. Handler parse JSON body → extract nomor pengirim + isi pesan
3. Cari/buat conversation di database
4. Simpan pesan ke database
5. Broadcast via WebSocket ke dashboard (real-time)

Meta mengirim 2 jenis request:
- GET /webhook → Verifikasi endpoint (saat setup webhook pertama kali)
- POST /webhook → Pesan masuk dari customer

Format webhook body dari Meta:
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "628xxx",
          "type": "text",
          "text": { "body": "Halo!" },
          "id": "wamid.xxx"
        }],
        "contacts": [{
          "profile": { "name": "Customer Name" },
          "wa_id": "628xxx"
        }]
      }
    }]
  }]
}
═══════════════════════════════════════════════════════
*/

// WebhookHandler mengelola WhatsApp webhook
type WebhookHandler struct {
	DB          *pgxpool.Pool
	Hub         *services.Hub
	VerifyToken string                    // Token verifikasi yang kita tentukan
	AI          *services.GeminiService   // Cika AI untuk auto-reply
	WA          *services.WhatsAppService // Untuk kirim reply ke WhatsApp
}

// VerifyWebhook — GET /webhook
// Dipanggil oleh Meta untuk verifikasi endpoint webhook
// Meta mengirim: hub.mode, hub.verify_token, hub.challenge
// Kita harus return challenge jika token cocok
func (h *WebhookHandler) VerifyWebhook(c *gin.Context) {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode == "subscribe" && token == h.VerifyToken {
		log.Println("✅ Webhook verified!")
		c.String(http.StatusOK, challenge)
		return
	}

	log.Println("❌ Webhook verification failed — token mismatch")
	c.JSON(http.StatusForbidden, gin.H{"error": "verification failed"})
}

// ReceiveWebhook — POST /webhook
// Dipanggil oleh Meta setiap ada pesan masuk, status update, dll
func (h *WebhookHandler) ReceiveWebhook(c *gin.Context) {
	var body webhookBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	// Selalu return 200 OK cepat agar Meta tidak retry
	// (Meta akan retry jika tidak dapat 200 dalam 20 detik)
	c.JSON(http.StatusOK, gin.H{"status": "received"})

	// Proses pesan di goroutine terpisah (non-blocking)
	// Ini penting agar response ke Meta tidak terlambat
	go h.processWebhookAsync(body)
}

// processWebhookAsync memproses webhook body di background
func (h *WebhookHandler) processWebhookAsync(body webhookBody) {
	for _, entry := range body.Entry {
		for _, change := range entry.Changes {
			// Handle pesan masuk
			for _, msg := range change.Value.Messages {
				// Cari nama customer dari contacts
				customerName := ""
				for _, contact := range change.Value.Contacts {
					if contact.WaID == msg.From {
						customerName = contact.Profile.Name
						break
					}
				}

				h.handleIncomingMessage(msg, customerName)
			}

			// Handle status update (delivered, read, dll)
			for _, status := range change.Value.Statuses {
				h.handleStatusUpdate(status)
			}
		}
	}
}

// handleIncomingMessage menyimpan pesan masuk ke database dan broadcast
func (h *WebhookHandler) handleIncomingMessage(msg webhookMessage, customerName string) {
	ctx := context.Background()

	// 1. Cari conversation yang sudah ada untuk customer ini
	var convID string
	var aiEnabled bool
	err := h.DB.QueryRow(ctx,
		`SELECT id, ai_enabled FROM conversations WHERE customer_phone = $1 AND status = 'open' 
		 ORDER BY created_at DESC LIMIT 1`,
		msg.From,
	).Scan(&convID, &aiEnabled)

	// 2. Jika belum ada → buat conversation baru
	if err != nil {
		err = h.DB.QueryRow(ctx,
			`INSERT INTO conversations (customer_phone, customer_name, platform, inbox_id, ai_enabled)
			 VALUES ($1, $2, 'whatsapp', (SELECT id FROM inboxes WHERE platform='whatsapp' LIMIT 1), true)
			 RETURNING id`,
			msg.From, customerName,
		).Scan(&convID)

		if err != nil {
			log.Printf("❌ Gagal buat conversation: %v", err)
			return
		}
		aiEnabled = true // Conversation baru → AI aktif default
		log.Printf("📝 Conversation baru dibuat: %s", convID)
	}

	// 3. Extract isi pesan (text)
	content := ""
	messageType := msg.Type
	if msg.Text != nil {
		content = msg.Text.Body
	}

	// 4. Simpan pesan ke database
	var messageID string
	err = h.DB.QueryRow(ctx,
		`INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id)
		 VALUES ($1, 'inbound', $2, $3, $4)
		 RETURNING id`,
		convID, content, messageType, msg.ID,
	).Scan(&messageID)

	if err != nil {
		log.Printf("❌ Gagal simpan pesan: %v", err)
		return
	}

	// 5. Update last_message di conversation
	now := time.Now()
	_, _ = h.DB.Exec(ctx,
		`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
		content, now, convID,
	)

	log.Printf("📨 Pesan masuk dari %s: %s", msg.From, content)

	// 6. Broadcast ke semua WebSocket clients (dashboard real-time update)
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "new_message",
		Conversation: &models.Conversation{
			ID:            convID,
			CustomerPhone: msg.From,
			CustomerName:  customerName,
			LastMessage:   content,
			LastMessageAt: &now,
		},
		Message: &models.Message{
			ID:             messageID,
			ConversationID: convID,
			Direction:      "inbound",
			Content:        content,
			MessageType:    messageType,
			WAMessageID:    msg.ID,
			CreatedAt:      now,
		},
	})

	// 7. 🤖 Cika AI Auto-Reply
	if h.AI != nil && h.AI.IsEnabled() && content != "" && aiEnabled {
		// Cek apakah customer minta bicara dengan manusia (handoff)
		if isHandoffRequest(content) {
			go h.handleHandoff(ctx, convID, msg.From, customerName)
		} else {
			go h.handleAIReply(ctx, convID, msg.From, customerName, content)
		}
	}
}

// handleStatusUpdate memproses status pesan (delivered, read)
func (h *WebhookHandler) handleStatusUpdate(status webhookStatus) {
	ctx := context.Background()

	// Update status pesan di database
	_, err := h.DB.Exec(ctx,
		`UPDATE messages SET status = $1 WHERE wa_message_id = $2`,
		status.Status, status.ID,
	)
	if err != nil {
		log.Printf("❌ Gagal update status: %v", err)
		return
	}

	log.Printf("📋 Status update: %s → %s", status.ID, status.Status)
}

// handleAIReply — 🤖 Cika AI auto-reply
// Dipanggil async setelah pesan customer disimpan
// Flow: Gemini API → WhatsApp reply → simpan DB → broadcast WS
func (h *WebhookHandler) handleAIReply(ctx context.Context, convID, customerPhone, customerName, customerMessage string) {
	// 1. Generate reply dari Gemini
	reply, err := h.AI.GenerateReply(ctx, h.DB, convID, customerMessage)
	if err != nil {
		log.Printf("⚠️ Cika gagal generate reply: %v", err)
		return
	}

	// 2. Kirim reply ke WhatsApp customer
	waMessageID, err := h.WA.SendTextMessage(customerPhone, reply)
	if err != nil {
		log.Printf("⚠️ Cika gagal kirim reply ke WhatsApp: %v", err)
		return
	}

	// 3. Simpan reply ke database (direction: outbound, message_type: ai)
	var replyMsgID string
	err = h.DB.QueryRow(ctx,
		`INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id)
		 VALUES ($1, 'outbound', $2, 'ai', $3)
		 RETURNING id`,
		convID, reply, waMessageID,
	).Scan(&replyMsgID)

	if err != nil {
		log.Printf("⚠️ Gagal simpan AI reply ke DB: %v", err)
		return
	}

	// 4. Update last_message di conversation
	now := time.Now()
	_, _ = h.DB.Exec(ctx,
		`UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3`,
		reply, now, convID,
	)

	log.Printf("🤖 Cika → %s: %s", customerPhone, reply)

	// 5. Broadcast AI reply ke dashboard via WebSocket
	h.Hub.BroadcastMessage(&models.WebSocketMessage{
		Type: "new_message",
		Conversation: &models.Conversation{
			ID:            convID,
			CustomerPhone: customerPhone,
			CustomerName:  customerName,
			LastMessage:   reply,
			LastMessageAt: &now,
		},
		Message: &models.Message{
			ID:             replyMsgID,
			ConversationID: convID,
			Direction:      "outbound",
			Content:        reply,
			MessageType:    "ai",
			WAMessageID:    waMessageID,
			CreatedAt:      now,
		},
	})
}

// ── Webhook JSON types (format dari Meta) ──

type webhookBody struct {
	Object string         `json:"object"`
	Entry  []webhookEntry `json:"entry"`
}

type webhookEntry struct {
	ID      string          `json:"id"`
	Changes []webhookChange `json:"changes"`
}

type webhookChange struct {
	Value webhookValue `json:"value"`
	Field string       `json:"field"`
}

type webhookValue struct {
	Messages []webhookMessage `json:"messages"`
	Contacts []webhookContact `json:"contacts"`
	Statuses []webhookStatus  `json:"statuses"`
}

type webhookMessage struct {
	From string          `json:"from"`
	ID   string          `json:"id"`
	Type string          `json:"type"`
	Text *webhookMsgText `json:"text"`
}

type webhookMsgText struct {
	Body string `json:"body"`
}

type webhookContact struct {
	Profile struct {
		Name string `json:"name"`
	} `json:"profile"`
	WaID string `json:"wa_id"`
}

type webhookStatus struct {
	ID     string `json:"id"`
	Status string `json:"status"` // sent, delivered, read, failed
}
