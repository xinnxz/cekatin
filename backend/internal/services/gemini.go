package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

/*
═══════════════════════════════════════════════════════
Cika AI Service — Auto-reply menggunakan Gemini API

Penjelasan:
- Cika adalah AI customer service assistant untuk Cepat Chat
- Menggunakan Gemini API (Google) untuk generate respons pintar
- Mendukung rotasi API key (multiple keys) untuk menghindari rate limit
- Context-aware: mengambil 10 pesan terakhir sebagai conversation history

Alur kerja:
  1. Pesan masuk dari customer via WhatsApp webhook
  2. WebhookHandler panggil gemini.GenerateReply()
  3. GeminiService kirim request ke Gemini API dengan system prompt + history
  4. Gemini response dikembalikan → dikirim balik ke WhatsApp
  5. Reply disimpan di database sebagai message outbound (type: "ai")

Rotasi API Key:
  - Setiap request pakai key berikutnya (round-robin)
  - Jika punya 5 key → kapasitas: 5 × 15 RPM = 75 RPM
═══════════════════════════════════════════════════════
*/

// GeminiService mengelola komunikasi dengan Google Gemini API
type GeminiService struct {
	apiKeys    []string     // Daftar API keys untuk rotasi
	keyIndex   uint64       // Index key saat ini (atomic untuk thread-safety)
	enabled    bool         // On/off toggle
	httpClient *http.Client // HTTP client dengan timeout
}

// NewGeminiService membuat instance baru GeminiService
//
// Parameter:
//   - apiKeys: satu atau lebih Gemini API key (comma-separated di .env)
//   - enabled: apakah AI auto-reply aktif
func NewGeminiService(apiKeys []string, enabled bool) *GeminiService {
	return &GeminiService{
		apiKeys: apiKeys,
		enabled: enabled,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// IsEnabled mengembalikan apakah AI service aktif
func (g *GeminiService) IsEnabled() bool {
	return g.enabled && len(g.apiKeys) > 0
}

// getNextKey mengambil API key berikutnya secara round-robin (thread-safe)
func (g *GeminiService) getNextKey() string {
	idx := atomic.AddUint64(&g.keyIndex, 1) - 1
	return g.apiKeys[idx%uint64(len(g.apiKeys))]
}

// ── System Prompt untuk Cika ──
const cikaSystemPrompt = `Kamu adalah "Cika", asisten AI customer service yang cerdas, ramah, dan natural.

ATURAN:
1. Jawab SELALU dalam Bahasa Indonesia yang natural dan ramah
2. Gunakan emoji secukupnya agar terasa friendly
3. Jawab dengan lengkap dan jelas, tapi jangan bertele-tele
4. Jika tidak tahu jawabannya, arahkan ke agent manusia dengan sopan
5. Jangan pernah bilang kamu adalah AI/robot — kamu adalah CS bernama Cika
6. Bersikap profesional tapi tetap hangat, seperti teman yang helpful
7. Jika customer bertanya soal harga/stok/pengiriman, jawab sewajarnya dan tanyakan detail
8. Jika customer marah/komplain, respons dengan empati dulu baru tawarkan solusi
9. Boleh bercanda ringan jika suasana santai
10. Selalu akhiri dengan pertanyaan follow-up agar percakapan tetap mengalir

CONTOH GAYA JAWABAN:
- "Halo kak! 👋 Selamat datang! Perkenalkan, aku Cika. Ada yang bisa Cika bantu hari ini?"
- "Wah, pesanannya sudah dalam proses pengiriman ya kak! Estimasi sampai 2-3 hari kerja. Kakak mau Cika bantu tracking-nya? 📦"
- "Mohon maaf ya kak atas ketidaknyamanannya 🙏 Cika paham pasti frustrasi. Boleh ceritakan detail masalahnya supaya Cika bisa bantu selesaikan?"
- "Untuk produk itu harganya Rp150.000 kak. Lagi ada promo free ongkir juga lho! Mau Cika buatkan pesanannya? 😊"
`

// ── Struct untuk Gemini API request/response ──

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiRequest struct {
	Contents          []geminiContent  `json:"contents"`
	SystemInstruction *geminiContent   `json:"systemInstruction,omitempty"`
	GenerationConfig  *geminiGenConfig `json:"generationConfig,omitempty"`
}

type geminiGenConfig struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
	TopP            float64 `json:"topP"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error"`
}

// GenerateReply menghasilkan respons AI untuk pesan customer
//
// Parameter:
//   - ctx: context untuk database query
//   - db: database pool untuk mengambil conversation history
//   - conversationID: ID conversation untuk mengambil history
//   - customerMessage: pesan terbaru dari customer
//
// Return:
//   - reply: respons yang dihasilkan Gemini
//   - error: jika gagal generate
func (g *GeminiService) GenerateReply(ctx context.Context, db *pgxpool.Pool, conversationID, customerMessage string) (string, error) {
	if !g.IsEnabled() {
		return "", fmt.Errorf("AI service tidak aktif")
	}

	// 1. Ambil 10 pesan terakhir dari conversation sebagai history
	history := g.getConversationHistory(ctx, db, conversationID)

	// 2. Build contents array untuk Gemini API
	contents := []geminiContent{}
	for _, h := range history {
		contents = append(contents, h)
	}
	contents = append(contents, geminiContent{
		Role:  "user",
		Parts: []geminiPart{{Text: customerMessage}},
	})

	// 3. Buat request body
	reqBody := geminiRequest{
		Contents: contents,
		SystemInstruction: &geminiContent{
			Role:  "user",
			Parts: []geminiPart{{Text: cikaSystemPrompt}},
		},
		GenerationConfig: &geminiGenConfig{
			Temperature:     0.7,
			MaxOutputTokens: 1024,
			TopP:            0.9,
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("gagal marshal request: %w", err)
	}

	// 4. Retry loop — coba semua key jika kena rate limit (429)
	maxRetries := len(g.apiKeys)
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		apiKey := g.getNextKey()
		url := fmt.Sprintf(
			"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s",
			apiKey,
		)

		req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
		if err != nil {
			return "", fmt.Errorf("gagal buat request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := g.httpClient.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("gagal kirim request ke Gemini: %w", err)
			continue
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = fmt.Errorf("gagal baca response: %w", err)
			continue
		}

		var result geminiResponse
		if err := json.Unmarshal(respBody, &result); err != nil {
			return "", fmt.Errorf("gagal parse response: %w", err)
		}

		// Jika 429 (rate limit) → coba key berikutnya
		if result.Error != nil && result.Error.Code == 429 {
			log.Printf("⚠️ Key #%d rate limited, coba key berikutnya... (attempt %d/%d)",
				(atomic.LoadUint64(&g.keyIndex)-1)%uint64(len(g.apiKeys))+1, attempt+1, maxRetries)
			lastErr = fmt.Errorf("rate limited")
			time.Sleep(500 * time.Millisecond) // Brief pause
			continue
		}

		// Error lain → langsung return error
		if result.Error != nil {
			return "", fmt.Errorf("Gemini API error [%d]: %s", result.Error.Code, result.Error.Message)
		}

		// Sukses → extract text
		if len(result.Candidates) > 0 && len(result.Candidates[0].Content.Parts) > 0 {
			reply := result.Candidates[0].Content.Parts[0].Text
			log.Printf("🤖 Cika reply: %s", reply)
			return reply, nil
		}

		return "", fmt.Errorf("Gemini response kosong")
	}

	return "", fmt.Errorf("semua %d API key rate limited: %v", maxRetries, lastErr)
}

// getConversationHistory mengambil 10 pesan terakhir dari database
// untuk diberikan sebagai context ke Gemini API
func (g *GeminiService) getConversationHistory(ctx context.Context, db *pgxpool.Pool, conversationID string) []geminiContent {
	rows, err := db.Query(ctx,
		`SELECT direction, content FROM messages 
		 WHERE conversation_id = $1 
		 ORDER BY created_at DESC LIMIT 10`,
		conversationID,
	)
	if err != nil {
		log.Printf("⚠️ Gagal ambil history: %v", err)
		return nil
	}
	defer rows.Close()

	// Kumpulkan dalam reverse order (oldest first)
	var messages []geminiContent
	for rows.Next() {
		var direction, content string
		if err := rows.Scan(&direction, &content); err != nil {
			continue
		}

		role := "user" // inbound = customer = user
		if direction == "outbound" {
			role = "model" // outbound = Cika/agent = model
		}

		messages = append([]geminiContent{{
			Role:  role,
			Parts: []geminiPart{{Text: content}},
		}}, messages...)
	}

	return messages
}
