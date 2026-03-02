package models

import "time"

/*
═══════════════════════════════════════════════════════
Models — Struct definitions untuk database tables

Penjelasan setiap struct:

1. Inbox    = Platform connection (WhatsApp, IG, dll)
2. Conversation = Thread percakapan dengan 1 customer
3. Message  = Satu pesan dalam conversation

Relasi:
  Inbox (1) ──→ (*) Conversation ──→ (*) Message

Tag `json:"..."` menentukan nama field di JSON response
Tag `db:"..."` menentukan nama kolom di PostgreSQL
═══════════════════════════════════════════════════════
*/

// Inbox merepresentasikan satu koneksi platform (WhatsApp, Instagram, dll)
// Setiap inbox punya access token sendiri untuk berkomunikasi dengan API platform
type Inbox struct {
	ID            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Platform      string    `json:"platform" db:"platform"` // whatsapp, instagram, messenger, web
	PhoneNumber   string    `json:"phone_number" db:"phone_number"`
	AccessToken   string    `json:"-" db:"access_token"` // json:"-" → JANGAN expose di API response (rahasia!)
	PhoneID       string    `json:"-" db:"phone_id"`     // WhatsApp Phone Number ID dari Meta
	WabaID        string    `json:"waba_id" db:"waba_id"`
	WebhookSecret string    `json:"-" db:"webhook_secret"`
	Status        string    `json:"status" db:"status"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// Conversation merepresentasikan satu thread percakapan dengan customer
type Conversation struct {
	ID            string     `json:"id" db:"id"`
	InboxID       *string    `json:"inbox_id" db:"inbox_id"`
	ContactID     *string    `json:"contact_id" db:"contact_id"`
	CustomerPhone string     `json:"customer_phone" db:"customer_phone"`
	CustomerName  string     `json:"customer_name" db:"customer_name"`
	Platform      string     `json:"platform" db:"platform"`
	Status        string     `json:"status" db:"status"`
	AIEnabled     bool       `json:"ai_enabled" db:"ai_enabled"`
	AssignedAgent *string    `json:"assigned_agent" db:"assigned_agent"`
	LastMessage   string     `json:"last_message" db:"last_message"`
	LastMessageAt *time.Time `json:"last_message_at" db:"last_message_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
}

// Contact merepresentasikan profil customer
type Contact struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Email     string    `json:"email" db:"email"`
	Phone     string    `json:"phone" db:"phone"`
	Notes     string    `json:"notes" db:"notes"`
	Tags      string    `json:"tags" db:"tags"` // comma-separated: "VIP,Order"
	AvatarURL string    `json:"avatar_url" db:"avatar_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Message merepresentasikan satu pesan dalam conversation
type Message struct {
	ID             string    `json:"id" db:"id"`
	ConversationID string    `json:"conversation_id" db:"conversation_id"`
	Direction      string    `json:"direction" db:"direction"` // inbound (masuk), outbound (keluar)
	Content        string    `json:"content" db:"content"`
	MessageType    string    `json:"message_type" db:"message_type"`       // text, image, video, document, audio, sticker
	WAMessageID    string    `json:"wa_message_id" db:"wa_message_id"`     // ID pesan dari WhatsApp
	Status         string    `json:"status" db:"status"`                   // sent, delivered, read, failed
	MediaURL       string    `json:"media_url" db:"media_url"`             // URL media (gambar, video, dokumen, audio)
	MediaMimeType  string    `json:"media_mime_type" db:"media_mime_type"` // MIME type (image/jpeg, video/mp4, dll)
	MediaFilename  string    `json:"media_filename" db:"media_filename"`   // Nama file asli
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// ── Request/Response structs ──

// SendMessageRequest — body JSON saat kirim pesan dari dashboard
type SendMessageRequest struct {
	ConversationID string `json:"conversation_id" binding:"required"`
	Content        string `json:"content"`
	MessageType    string `json:"message_type"`   // text, image, video, document, audio
	MediaURL       string `json:"media_url"`      // URL media untuk dikirim
	MediaFilename  string `json:"media_filename"` // Nama file (untuk document)
}

// CreateInboxRequest — body JSON saat tambah inbox baru
type CreateInboxRequest struct {
	Name        string `json:"name" binding:"required"`
	Platform    string `json:"platform" binding:"required"`
	PhoneNumber string `json:"phone_number"`
	AccessToken string `json:"access_token"`
	PhoneID     string `json:"phone_id"`
	WabaID      string `json:"waba_id"`
}

// UpdateInboxRequest — body JSON saat update inbox (semua field optional, pointer-based)
type UpdateInboxRequest struct {
	Name        *string `json:"name"`
	PhoneNumber *string `json:"phone_number"`
	AccessToken *string `json:"access_token"`
	PhoneID     *string `json:"phone_id"`
	WabaID      *string `json:"waba_id"`
	Status      *string `json:"status"`
}

// WebSocketMessage — format pesan yang dikirim via WebSocket ke dashboard
// Digunakan untuk real-time notification saat ada pesan masuk baru
type WebSocketMessage struct {
	Type         string        `json:"type"` // "new_message", "status_update"
	Conversation *Conversation `json:"conversation,omitempty"`
	Message      *Message      `json:"message,omitempty"`
}
