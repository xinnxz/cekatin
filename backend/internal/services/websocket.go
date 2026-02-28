package services

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/xinnxz/cekatin-backend/internal/models"
)

/*
═══════════════════════════════════════════════════════
WebSocket Hub — Real-time message broadcast ke dashboard

Penjelasan arsitektur:
- Hub = pusat yang mengelola semua koneksi WebSocket
- Client = satu koneksi browser dashboard
- Broadcast = kirim pesan ke SEMUA client yang terhubung

Alur real-time:
1. Dashboard buka WebSocket ke ws://localhost:8080/ws
2. Hub mendaftarkan client baru
3. Saat ada pesan masuk WhatsApp → webhook handler → Hub.Broadcast()
4. Hub kirim ke semua client → dashboard update chat real-time

Goroutine per client:
- readPump: baca pesan dari client (untuk heartbeat/close detection)
- writePump: kirim pesan ke client dari channel

Thread-safety:
- sync.RWMutex melindungi map clients dari race condition
═══════════════════════════════════════════════════════
*/

// Hub mengelola semua WebSocket connections
type Hub struct {
	clients map[*Client]bool
	mu      sync.RWMutex
}

// Client merepresentasikan satu koneksi WebSocket
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

// NewHub membuat Hub baru
func NewHub() *Hub {
	return &Hub{
		clients: make(map[*Client]bool),
	}
}

// Register mendaftarkan client baru ke hub
func (h *Hub) Register(conn *websocket.Conn) *Client {
	client := &Client{
		hub:  h,
		conn: conn,
		send: make(chan []byte, 256),
	}

	h.mu.Lock()
	h.clients[client] = true
	h.mu.Unlock()

	log.Printf("🔗 WebSocket client connected (total: %d)", len(h.clients))

	go client.readPump()
	go client.writePump()

	return client
}

// Unregister menghapus client dari hub
func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
	h.mu.Unlock()
	log.Printf("🔌 WebSocket client disconnected (total: %d)", len(h.clients))
}

// BroadcastMessage mengirim WebSocketMessage ke semua client
func (h *Hub) BroadcastMessage(msg *models.WebSocketMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("❌ Gagal marshal WebSocket message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		select {
		case client.send <- data:
		default:
			go h.Unregister(client)
		}
	}
}

// readPump mendeteksi saat client disconnect
func (c *Client) readPump() {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			break
		}
	}
}

// writePump mengirim pesan ke client dari channel
func (c *Client) writePump() {
	defer c.conn.Close()

	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
}
