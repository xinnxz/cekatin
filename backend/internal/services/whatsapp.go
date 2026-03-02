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
	MessagingProduct string             `json:"messaging_product"` // Selalu "whatsapp"
	RecipientType    string             `json:"recipient_type,omitempty"`
	To               string             `json:"to"`   // Nomor tujuan (format internasional, tanpa +)
	Type             string             `json:"type"` // "text", "image", "video", "document", "audio", "interactive", "template", "reaction"
	Text             *waTextBody        `json:"text,omitempty"`
	Image            *waMediaBody       `json:"image,omitempty"`
	Video            *waMediaBody       `json:"video,omitempty"`
	Document         *waDocumentBody    `json:"document,omitempty"`
	Audio            *waMediaBody       `json:"audio,omitempty"`
	Interactive      *waInteractiveBody `json:"interactive,omitempty"`
	Template         *waTemplateBody    `json:"template,omitempty"`
	Reaction         *waReactionBody    `json:"reaction,omitempty"`
}

// waMediaBody — body untuk image/video/audio
type waMediaBody struct {
	Link    string `json:"link"`              // URL publik media
	Caption string `json:"caption,omitempty"` // Opsional
}

// waDocumentBody — body untuk dokumen
type waDocumentBody struct {
	Link     string `json:"link"`
	Caption  string `json:"caption,omitempty"`
	Filename string `json:"filename,omitempty"`
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

// waMediaResponse — response dari Meta saat retrieve media URL
type waMediaResponse struct {
	URL      string `json:"url"`
	MimeType string `json:"mime_type"`
	Error    *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error"`
}

// ═══════════════════════════════════════════════════════
// Interactive Message structs (buttons & lists)
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-messages
// ═══════════════════════════════════════════════════════

// waInteractiveBody — body untuk interactive messages (button/list)
type waInteractiveBody struct {
	Type   string               `json:"type"` // "button" atau "list"
	Header *waInteractiveHeader `json:"header,omitempty"`
	Body   waInteractiveText    `json:"body"`
	Footer *waInteractiveText   `json:"footer,omitempty"`
	Action waInteractiveAction  `json:"action"`
}

type waInteractiveHeader struct {
	Type     string       `json:"type"` // "text", "image", "video", "document"
	Text     string       `json:"text,omitempty"`
	Image    *waMediaBody `json:"image,omitempty"`
	Video    *waMediaBody `json:"video,omitempty"`
	Document *waMediaBody `json:"document,omitempty"`
}

type waInteractiveText struct {
	Text string `json:"text"`
}

type waInteractiveAction struct {
	// Untuk type "button"
	Buttons []waInteractiveButton `json:"buttons,omitempty"`
	// Untuk type "list"
	ButtonText string                 `json:"button,omitempty"` // Text tombol menu (maks 20 char)
	Sections   []waInteractiveSection `json:"sections,omitempty"`
}

type waInteractiveButton struct {
	Type  string                `json:"type"` // selalu "reply"
	Reply waInteractiveReplyBtn `json:"reply"`
}

type waInteractiveReplyBtn struct {
	ID    string `json:"id"`    // Unique button ID
	Title string `json:"title"` // Button text (maks 20 char)
}

type waInteractiveSection struct {
	Title string             `json:"title,omitempty"`
	Rows  []waInteractiveRow `json:"rows"`
}

type waInteractiveRow struct {
	ID          string `json:"id"`                    // Unique row ID
	Title       string `json:"title"`                 // Row title (maks 24 char)
	Description string `json:"description,omitempty"` // Row description (maks 72 char)
}

// ═══════════════════════════════════════════════════════
// Template Message structs (HSM — approved by Meta)
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/template-messages
// ═══════════════════════════════════════════════════════

type waTemplateBody struct {
	Name       string                `json:"name"` // Nama template yang sudah approved Meta
	Language   waTemplateLanguage    `json:"language"`
	Components []waTemplateComponent `json:"components,omitempty"`
}

type waTemplateLanguage struct {
	Code string `json:"code"` // "id" (Indonesia), "en_US" (English)
}

type waTemplateComponent struct {
	Type       string            `json:"type"`               // "header", "body", "button"
	SubType    string            `json:"sub_type,omitempty"` // untuk button: "quick_reply", "url"
	Index      string            `json:"index,omitempty"`    // index button (0, 1, 2)
	Parameters []waTemplateParam `json:"parameters,omitempty"`
}

type waTemplateParam struct {
	Type     string       `json:"type"` // "text", "currency", "date_time", "image", "video", "document"
	Text     string       `json:"text,omitempty"`
	Image    *waMediaBody `json:"image,omitempty"`
	Video    *waMediaBody `json:"video,omitempty"`
	Document *waMediaBody `json:"document,omitempty"`
}

// ═══════════════════════════════════════════════════════
// Reaction struct (emoji react)
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/reaction-messages
// ═══════════════════════════════════════════════════════

type waReactionBody struct {
	MessageID string `json:"message_id"` // WA message ID yang di-react
	Emoji     string `json:"emoji"`      // Emoji karakter, misal "👍" — kosong untuk unreact
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

	return s.sendWARequest(payload, to)
}

// SendMediaMessage mengirim media (image, video, document, audio) ke nomor WhatsApp
//
// Parameter:
//   - to: nomor tujuan
//   - mediaType: "image", "video", "document", "audio"
//   - mediaURL: URL publik file media
//   - caption: keterangan (opsional)
//   - filename: nama file (untuk document)
func (s *WhatsAppService) SendMediaMessage(to, mediaType, mediaURL, caption, filename string) (string, error) {
	payload := waSendRequest{
		MessagingProduct: "whatsapp",
		To:               to,
		Type:             mediaType,
	}

	switch mediaType {
	case "image":
		payload.Image = &waMediaBody{Link: mediaURL, Caption: caption}
	case "video":
		payload.Video = &waMediaBody{Link: mediaURL, Caption: caption}
	case "audio":
		payload.Audio = &waMediaBody{Link: mediaURL}
	case "document":
		payload.Document = &waDocumentBody{Link: mediaURL, Caption: caption, Filename: filename}
	default:
		return "", fmt.Errorf("unsupported media type: %s", mediaType)
	}

	return s.sendWARequest(payload, to)
}

// SendInteractiveMessage mengirim pesan interaktif (button/list) ke nomor WhatsApp
//
// Parameter:
//   - to: nomor tujuan
//   - interactive: body interaktif (button/list) yang sudah dikomposisi
//
// Contoh penggunaan buttons:
//
//	wa.SendInteractiveMessage("628xxx", &waInteractiveBody{
//	    Type: "button",
//	    Body: waInteractiveText{Text: "Pilih opsi:"},
//	    Action: waInteractiveAction{
//	        Buttons: []waInteractiveButton{
//	            {Type: "reply", Reply: waInteractiveReplyBtn{ID: "btn_1", Title: "Opsi 1"}},
//	            {Type: "reply", Reply: waInteractiveReplyBtn{ID: "btn_2", Title: "Opsi 2"}},
//	        },
//	    },
//	})
func (s *WhatsAppService) SendInteractiveMessage(to string, interactive *waInteractiveBody) (string, error) {
	payload := waSendRequest{
		MessagingProduct: "whatsapp",
		To:               to,
		Type:             "interactive",
		Interactive:      interactive,
	}
	return s.sendWARequest(payload, to)
}

// SendReaction mengirim reaksi emoji ke pesan WhatsApp tertentu
//
// Parameter:
//   - to: nomor tujuan
//   - waMessageID: ID pesan WA yang di-react
//   - emoji: karakter emoji (misal "👍", "❤️", "😂") — kosong "" untuk unreact
func (s *WhatsAppService) SendReaction(to, waMessageID, emoji string) (string, error) {
	payload := waSendRequest{
		MessagingProduct: "whatsapp",
		To:               to,
		Type:             "reaction",
		Reaction:         &waReactionBody{MessageID: waMessageID, Emoji: emoji},
	}
	return s.sendWARequest(payload, to)
}

// SendTemplateMessage mengirim pesan template (HSM) yang sudah di-approve oleh Meta
// Digunakan untuk: broadcast, OTP, notifikasi, dll
//
// Parameter:
//   - to: nomor tujuan
//   - templateName: nama template yang sudah approved
//   - languageCode: kode bahasa ("id", "en_US")
//   - components: parameter dinamis untuk template (header, body, buttons)
func (s *WhatsAppService) SendTemplateMessage(to, templateName, languageCode string, components []waTemplateComponent) (string, error) {
	payload := waSendRequest{
		MessagingProduct: "whatsapp",
		To:               to,
		Type:             "template",
		Template: &waTemplateBody{
			Name:       templateName,
			Language:   waTemplateLanguage{Code: languageCode},
			Components: components,
		},
	}
	return s.sendWARequest(payload, to)
}

// GetMediaURL mengambil download URL untuk media dari WhatsApp
// WhatsApp webhook mengirim media ID, bukan URL langsung.
// Kita perlu call GET https://graph.facebook.com/v18.0/{MEDIA_ID} untuk dapat URL-nya.
func (s *WhatsAppService) GetMediaURL(mediaID string) (string, error) {
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s", mediaID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("gagal buat request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal request media URL: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal baca response: %w", err)
	}

	var result waMediaResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("gagal parse response: %w", err)
	}

	if result.Error != nil {
		return "", fmt.Errorf("Meta API error [%d]: %s", result.Error.Code, result.Error.Message)
	}

	log.Printf("📎 Media URL retrieved: %s", result.URL)
	return result.URL, nil
}

// sendWARequest — internal helper untuk kirim request ke Meta Cloud API
func (s *WhatsAppService) sendWARequest(payload waSendRequest, to string) (string, error) {
	// 1. Marshal ke JSON
	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("gagal marshal request: %w", err)
	}

	// 2. Buat HTTP request ke Meta Cloud API
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", s.PhoneNumberID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("gagal buat HTTP request: %w", err)
	}

	// 3. Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.AccessToken)

	// 4. Kirim request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal kirim request ke Meta: %w", err)
	}
	defer resp.Body.Close()

	// 5. Baca response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal baca response: %w", err)
	}

	// 6. Parse response
	var result waSendResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("gagal parse response: %w", err)
	}

	// 7. Cek error dari Meta
	if result.Error != nil {
		return "", fmt.Errorf("Meta API error [%d]: %s", result.Error.Code, result.Error.Message)
	}

	// 8. Ambil message ID
	if len(result.Messages) > 0 {
		waID := result.Messages[0].ID
		log.Printf("📤 Pesan terkirim ke %s (wa_id: %s)", to, waID)
		return waID, nil
	}

	return "", fmt.Errorf("response tidak mengandung message ID")
}

// ═══════════════════════════════════════════════════════
// WhatsApp Business Profile API
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/business-profiles
// ═══════════════════════════════════════════════════════

// WABusinessProfile — profil bisnis WhatsApp
type WABusinessProfile struct {
	About             string   `json:"about"`
	Address           string   `json:"address"`
	Description       string   `json:"description"`
	Email             string   `json:"email"`
	ProfilePictureURL string   `json:"profile_picture_url"`
	Websites          []string `json:"websites"`
	Vertical          string   `json:"vertical"` // industry category
}

// GetBusinessProfile mengambil WhatsApp Business Profile
func (s *WhatsAppService) GetBusinessProfile() (*WABusinessProfile, error) {
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical", s.PhoneNumberID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("gagal buat request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gagal request business profile: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var result struct {
		Data []WABusinessProfile `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("gagal parse response: %w", err)
	}

	if len(result.Data) > 0 {
		return &result.Data[0], nil
	}
	return nil, fmt.Errorf("business profile not found")
}

// UpdateBusinessProfile mengupdate WhatsApp Business Profile
func (s *WhatsAppService) UpdateBusinessProfile(profile *WABusinessProfile) error {
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/whatsapp_business_profile", s.PhoneNumberID)

	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
	}
	if profile.About != "" {
		payload["about"] = profile.About
	}
	if profile.Address != "" {
		payload["address"] = profile.Address
	}
	if profile.Description != "" {
		payload["description"] = profile.Description
	}
	if profile.Email != "" {
		payload["email"] = profile.Email
	}
	if len(profile.Websites) > 0 {
		payload["websites"] = profile.Websites
	}
	if profile.Vertical != "" {
		payload["vertical"] = profile.Vertical
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("gagal buat request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("gagal update business profile: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Meta API error: %s", string(respBody))
	}

	log.Println("✅ Business profile updated")
	return nil
}

// ═══════════════════════════════════════════════════════
// WhatsApp Catalog API
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services
// ═══════════════════════════════════════════════════════

// WACatalogProduct — produk dalam WhatsApp Catalog
type WACatalogProduct struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Price        string `json:"price"`
	Currency     string `json:"currency"`
	ImageURL     string `json:"image_url"`
	URL          string `json:"url"`
	RetailerID   string `json:"retailer_id"`
	Availability string `json:"availability"`
}

// GetCatalogProducts mengambil daftar produk dari WhatsApp Catalog
func (s *WhatsAppService) GetCatalogProducts(catalogID string) ([]WACatalogProduct, error) {
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/products?fields=id,name,description,price,currency,image_url,url,retailer_id,availability", catalogID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("gagal buat request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gagal request catalog: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var result struct {
		Data []WACatalogProduct `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("gagal parse catalog: %w", err)
	}

	log.Printf("📦 Loaded %d products from catalog %s", len(result.Data), catalogID)
	return result.Data, nil
}
