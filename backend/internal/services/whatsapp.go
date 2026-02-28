package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

/*
═══════════════════════════════════════════════════════
WhatsApp Service — Client untuk Meta Cloud API

Penjelasan alur kirim pesan:
1. Dashboard user klik "Send" → API /api/messages/send
2. Handler panggil whatsapp.SendTextMessage()
3. Service buat HTTP POST ke Meta Cloud API
4. Meta kirim pesan ke nomor WhatsApp customer

Meta Cloud API endpoint:
  POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
  Headers: Authorization: Bearer {ACCESS_TOKEN}
  Body: { messaging_product: "whatsapp", to: "62xxx", type: "text", text: { body: "Hello!" } }
═══════════════════════════════════════════════════════
*/

// WhatsAppService mengelola komunikasi dengan Meta Cloud API
type WhatsAppService struct {
	AccessToken   string // Bearer token dari Meta
	PhoneNumberID string // Phone Number ID dari WhatsApp Business
}

// NewWhatsAppService membuat instance baru WhatsAppService
func NewWhatsAppService(accessToken, phoneNumberID string) *WhatsAppService {
	return &WhatsAppService{
		AccessToken:   accessToken,
		PhoneNumberID: phoneNumberID,
	}
}

// ── Struct untuk request body ke Meta API ──

// waTextBody adalah body pesan text
type waTextBody struct {
	Body string `json:"body"`
}

// waSendRequest adalah format request ke Meta Cloud API
type waSendRequest struct {
	MessagingProduct string      `json:"messaging_product"` // Selalu "whatsapp"
	To               string      `json:"to"`                // Nomor tujuan (format internasional, tanpa +)
	Type             string      `json:"type"`              // "text", "image", dll
	Text             *waTextBody `json:"text,omitempty"`
}

// waSendResponse adalah response dari Meta setelah kirim pesan
type waSendResponse struct {
	Messages []struct {
		ID string `json:"id"` // WhatsApp message ID
	} `json:"messages"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error"`
}

// SendTextMessage mengirim pesan text ke nomor WhatsApp
//
// Parameter:
//   - to: nomor tujuan format internasional tanpa "+" (contoh: "628123456789")
//   - message: isi pesan text
//
// Return:
//   - waMessageID: ID pesan dari WhatsApp (untuk tracking status)
//   - error: jika gagal kirim
func (s *WhatsAppService) SendTextMessage(to, message string) (string, error) {
	// 1. Buat request body sesuai format Meta API
	payload := waSendRequest{
		MessagingProduct: "whatsapp",
		To:               to,
		Type:             "text",
		Text:             &waTextBody{Body: message},
	}

	// 2. Marshal ke JSON
	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("gagal marshal request: %w", err)
	}

	// 3. Buat HTTP request ke Meta Cloud API
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", s.PhoneNumberID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("gagal buat HTTP request: %w", err)
	}

	// 4. Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.AccessToken)

	// 5. Kirim request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal kirim request ke Meta: %w", err)
	}
	defer resp.Body.Close()

	// 6. Baca response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal baca response: %w", err)
	}

	// 7. Parse response
	var result waSendResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("gagal parse response: %w", err)
	}

	// 8. Cek error dari Meta
	if result.Error != nil {
		return "", fmt.Errorf("Meta API error [%d]: %s", result.Error.Code, result.Error.Message)
	}

	// 9. Ambil message ID
	if len(result.Messages) > 0 {
		waID := result.Messages[0].ID
		log.Printf("📤 Pesan terkirim ke %s (wa_id: %s)", to, waID)
		return waID, nil
	}

	return "", fmt.Errorf("response tidak mengandung message ID")
}
