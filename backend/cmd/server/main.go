package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/xinnxz/cekatin-backend/internal/config"
	"github.com/xinnxz/cekatin-backend/internal/database"
	"github.com/xinnxz/cekatin-backend/internal/handlers"
	"github.com/xinnxz/cekatin-backend/internal/middleware"
	"github.com/xinnxz/cekatin-backend/internal/services"
)

/*
═══════════════════════════════════════════════════════
CekatIn Go Backend — Entry Point

Urutan startup:
1. Load config dari .env
2. Connect ke PostgreSQL + auto-migrate tabel
3. Init services (WhatsApp, WebSocket Hub)
4. Init handlers (webhook, message, inbox, conversation)
5. Setup Gin router + middleware
6. Register routes
7. Start server di port 8080

Cara menjalankan:
  cd backend
  go run cmd/server/main.go

Hasil:
  🚀 CekatIn Backend running on :8080
  ✅ Connected to PostgreSQL
  ✅ Database migration complete
═══════════════════════════════════════════════════════
*/

// upgrader untuk upgrade HTTP → WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow semua origin (dev mode)
	},
}

func main() {
	// ─── 1. Load Config ───
	cfg := config.Load()
	log.Println("📋 Config loaded")

	// ─── 2. Connect PostgreSQL ───
	db, err := database.Connect(cfg.DBConnString)
	if err != nil {
		log.Fatalf("❌ Database error: %v", err)
	}
	defer db.Close()

	// ─── 3. Init Services ───
	waService := services.NewWhatsAppService(cfg.WAAccessToken, cfg.WAPhoneNumberID)
	wsHub := services.NewHub()

	// ─── 4. Init Handlers ───
	webhookHandler := &handlers.WebhookHandler{
		DB:          db,
		Hub:         wsHub,
		VerifyToken: cfg.WAVerifyToken,
	}

	messageHandler := &handlers.MessageHandler{
		DB:  db,
		WA:  waService,
		Hub: wsHub,
	}

	inboxHandler := &handlers.InboxHandler{DB: db}
	convHandler := &handlers.ConversationHandler{DB: db}

	// ─── 5. Setup Gin Router ───
	router := gin.Default()

	// CORS middleware — izinkan dashboard Next.js akses API
	router.Use(middleware.CORSMiddleware(cfg.DashboardURL))

	// ─── 6. Register Routes ───

	// Health check — untuk monitoring
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "CekatIn Backend",
			"version": "1.0.0",
		})
	})

	// WhatsApp Webhook
	router.GET("/webhook", webhookHandler.VerifyWebhook)
	router.POST("/webhook", webhookHandler.ReceiveWebhook)

	// API Routes
	api := router.Group("/api")
	{
		// Inboxes
		api.GET("/inboxes", inboxHandler.ListInboxes)
		api.POST("/inboxes", inboxHandler.CreateInbox)
		api.GET("/inboxes/:id", inboxHandler.GetInbox)
		api.DELETE("/inboxes/:id", inboxHandler.DeleteInbox)

		// Conversations
		api.GET("/conversations", convHandler.ListConversations)
		api.GET("/conversations/:id", convHandler.GetConversation)
		api.PATCH("/conversations/:id", convHandler.UpdateConversation)

		// Messages
		api.GET("/conversations/:id/messages", messageHandler.GetMessages)
		api.POST("/messages/send", messageHandler.SendMessage)
	}

	// WebSocket endpoint — dashboard connects here for real-time updates
	router.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("❌ WebSocket upgrade failed: %v", err)
			return
		}
		wsHub.Register(conn)
	})

	// ─── 7. Start Server ───
	port := ":" + cfg.Port
	log.Printf("🚀 CekatIn Backend running on %s", port)
	log.Printf("📡 Webhook: http://localhost%s/webhook", port)
	log.Printf("🌐 API:     http://localhost%s/api", port)
	log.Printf("🔌 WS:      ws://localhost%s/ws", port)

	if err := router.Run(port); err != nil {
		log.Fatalf("❌ Server error: %v", err)
	}
}
