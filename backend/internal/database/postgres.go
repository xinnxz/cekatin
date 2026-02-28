package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

/*
═══════════════════════════════════════════════════════
Database — PostgreSQL connection pool + auto-migration

Penjelasan:
- pgxpool.Pool = connection pool (banyak koneksi yg di-reuse)
- Pool lebih efisien daripada single connection karena:
  - Goroutine bisa pakai koneksi berbeda secara paralel
  - Koneksi tidak perlu dibuat/ditutup setiap query
  - Default max 4 koneksi (bisa ditingkatkan)

- Connect() → buat pool + jalankan migrasi
- Migrate() → buat tabel jika belum ada (idempotent)
═══════════════════════════════════════════════════════
*/

// Connect membuat connection pool ke PostgreSQL
// connString format: postgres://user:pass@host:port/dbname?sslmode=disable
func Connect(connString string) (*pgxpool.Pool, error) {
	// Parse config dari connection string
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("gagal parse DB config: %w", err)
	}

	// Buat connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("gagal connect ke PostgreSQL: %w", err)
	}

	// Test koneksi — pastikan DB bisa dijangkau
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("gagal ping PostgreSQL: %w", err)
	}

	log.Println("✅ Connected to PostgreSQL")

	// Jalankan migration — buat tabel jika belum ada
	if err := Migrate(pool); err != nil {
		return nil, fmt.Errorf("gagal migrasi database: %w", err)
	}

	return pool, nil
}

// Migrate membuat tabel-tabel yang diperlukan jika belum ada
// Menggunakan "CREATE TABLE IF NOT EXISTS" agar aman dijalankan berkali-kali
func Migrate(pool *pgxpool.Pool) error {
	queries := []string{
		// Tabel inboxes — menyimpan koneksi platform
		`CREATE TABLE IF NOT EXISTS inboxes (
			id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name          VARCHAR(255) NOT NULL,
			platform      VARCHAR(50) NOT NULL,
			phone_number  VARCHAR(20) DEFAULT '',
			access_token  TEXT DEFAULT '',
			phone_id      VARCHAR(50) DEFAULT '',
			waba_id       VARCHAR(50) DEFAULT '',
			webhook_secret VARCHAR(100) DEFAULT '',
			status        VARCHAR(20) DEFAULT 'active',
			created_at    TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Tabel conversations — satu thread per customer per inbox
		`CREATE TABLE IF NOT EXISTS conversations (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			inbox_id        UUID REFERENCES inboxes(id) ON DELETE CASCADE,
			customer_phone  VARCHAR(20) NOT NULL,
			customer_name   VARCHAR(255) DEFAULT '',
			platform        VARCHAR(50) NOT NULL,
			status          VARCHAR(20) DEFAULT 'open',
			last_message    TEXT DEFAULT '',
			last_message_at TIMESTAMPTZ,
			created_at      TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Tabel messages — pesan individual dalam conversation
		`CREATE TABLE IF NOT EXISTS messages (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
			direction       VARCHAR(10) NOT NULL,
			content         TEXT NOT NULL,
			message_type    VARCHAR(20) DEFAULT 'text',
			wa_message_id   VARCHAR(100) DEFAULT '',
			status          VARCHAR(20) DEFAULT 'sent',
			created_at      TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Index untuk mempercepat query conversation berdasarkan inbox
		`CREATE INDEX IF NOT EXISTS idx_conversations_inbox ON conversations(inbox_id)`,

		// Index untuk mempercepat query messages berdasarkan conversation
		`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`,

		// Index untuk cari conversation berdasarkan customer phone
		`CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(customer_phone)`,
	}

	for _, q := range queries {
		if _, err := pool.Exec(context.Background(), q); err != nil {
			return fmt.Errorf("migration error: %w", err)
		}
	}

	log.Println("✅ Database migration complete")
	return nil
}
