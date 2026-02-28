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
- Cika adalah AI customer service assistant untuk CekatIn
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
const cikaSystemPrompt = `Kamu adalah "Cika", asisten AI customer service yang cerdas dan ramah.

ATURAN PENTING:
1. Jawab SELALU dalam Bahasa Indonesia yang natural dan ramah
2. Gunakan emoji secukupnya untuk terasa friendly (tidak berlebihan)
3. Jawab SINGKAT dan TO THE POINT (maksimal 2-3 kalimat)
4. Jika tidak tahu jawabannya, arahkan ke agent manusia
5. Jangan pernah bilang kamu adalah AI — kamu adalah customer service Cika
6. Bersikap profesional tapi tetap hangat dan personal
7. Jika customer bertanya soal harga/stok/pengiriman, jawab sewajarnya
8. Jika customer marah/komplain, respons dengan empati dulu baru solusi

CONTOH GAYA JAWABAN:
- "Halo kak! 👋 Terima kasih sudah menghubungi kami. Ada yang bisa Cika bantu?"
- "Siap kak, pesanannya sedang diproses ya! Estimasi pengiriman 2-3 hari kerja 📦"
- "Mohon maaf ya kak atas ketidaknyamanannya 🙏 Cika bantu cek dulu ya"
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
	//    Ini memberikan context ke Gemini agar jawaban lebih relevan
	history := g.getConversationHistory(ctx, db, conversationID)

	// 2. Build contents array untuk Gemini API
	contents := []geminiContent{}

	// Tambahkan history sebagai context
	for _, h := range history {
		contents = append(contents, h)
	}

	// Tambahkan pesan terbaru dari customer
	contents = append(contents, geminiContent{
		Role:  "user",
		Parts: []geminiPart{{Text: customerMessage}},
	})

	// 3. Buat request ke Gemini API
	reqBody := geminiRequest{
		Contents: contents,
		SystemInstruction: &geminiContent{
			Role:  "user",
			Parts: []geminiPart{{Text: cikaSystemPrompt}},
		},
		GenerationConfig: &geminiGenConfig{
			Temperature:     0.7, // Cukup kreatif tapi tetap konsisten
			MaxOutputTokens: 256, // Dibatasi agar jawaban singkat
			TopP:            0.9,
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("gagal marshal request: %w", err)
	}

	// 4. Pilih API key (rotasi round-robin)
	apiKey := g.getNextKey()
	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=%s",
		apiKey,
	)

	// 5. Kirim HTTP request ke Gemini
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("gagal buat request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal kirim request ke Gemini: %w", err)
	}
	defer resp.Body.Close()

	// 6. Baca dan parse response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal baca response: %w", err)
	}

	var result geminiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("gagal parse response: %w", err)
	}

	// 7. Cek error
	if result.Error != nil {
		return "", fmt.Errorf("Gemini API error [%d]: %s", result.Error.Code, result.Error.Message)
	}

	// 8. Extract text dari response
	if len(result.Candidates) > 0 && len(result.Candidates[0].Content.Parts) > 0 {
		reply := result.Candidates[0].Content.Parts[0].Text
		log.Printf("🤖 Cika reply: %s", reply)
		return reply, nil
	}

	return "", fmt.Errorf("Gemini response kosong")
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
