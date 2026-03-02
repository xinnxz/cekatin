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

		// Tabel contacts — profil customer
		`CREATE TABLE IF NOT EXISTS contacts (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name        VARCHAR(255) DEFAULT '',
			email       VARCHAR(255) DEFAULT '',
			phone       VARCHAR(20) NOT NULL UNIQUE,
			notes       TEXT DEFAULT '',
			tags        TEXT DEFAULT '',
			avatar_url  VARCHAR(500) DEFAULT '',
			created_at  TIMESTAMPTZ DEFAULT NOW(),
			updated_at  TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Tabel conversations — satu thread per customer per inbox
		`CREATE TABLE IF NOT EXISTS conversations (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			inbox_id        UUID REFERENCES inboxes(id) ON DELETE CASCADE,
			contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
			customer_phone  VARCHAR(20) NOT NULL,
			customer_name   VARCHAR(255) DEFAULT '',
			platform        VARCHAR(50) NOT NULL,
			status          VARCHAR(20) DEFAULT 'open',
			ai_enabled      BOOLEAN DEFAULT true,
			assigned_agent  VARCHAR(100) DEFAULT '',
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

		// Migration: tambah kolom ai_enabled jika belum ada (untuk DB lama)
		`DO $$ BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='conversations' AND column_name='ai_enabled') THEN
				ALTER TABLE conversations ADD COLUMN ai_enabled BOOLEAN DEFAULT true;
			END IF;
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='conversations' AND column_name='assigned_agent') THEN
				ALTER TABLE conversations ADD COLUMN assigned_agent VARCHAR(100) DEFAULT '';
			END IF;
		END $$`,

		// Migration: tambah contact_id ke conversations
		`DO $$ BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='conversations' AND column_name='contact_id') THEN
				ALTER TABLE conversations ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
			END IF;
		END $$`,

		// Migration: tambah media_url dan media_mime_type ke messages (untuk gambar, video, dokumen, audio)
		`DO $$ BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='messages' AND column_name='media_url') THEN
				ALTER TABLE messages ADD COLUMN media_url TEXT DEFAULT '';
			END IF;
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='messages' AND column_name='media_mime_type') THEN
				ALTER TABLE messages ADD COLUMN media_mime_type VARCHAR(100) DEFAULT '';
			END IF;
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='messages' AND column_name='media_filename') THEN
				ALTER TABLE messages ADD COLUMN media_filename VARCHAR(500) DEFAULT '';
			END IF;
		END $$`,

		// Tabel calls — log panggilan WhatsApp
		`CREATE TABLE IF NOT EXISTS calls (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
			contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
			caller_phone    VARCHAR(20) NOT NULL,
			callee_phone    VARCHAR(20) NOT NULL,
			direction       VARCHAR(10) NOT NULL,
			call_type       VARCHAR(10) DEFAULT 'voice',
			status          VARCHAR(20) DEFAULT 'ringing',
			duration_seconds INTEGER DEFAULT 0,
			assigned_agent  VARCHAR(100) DEFAULT '',
			recording_url   TEXT DEFAULT '',
			wa_call_id      VARCHAR(100) DEFAULT '',
			started_at      TIMESTAMPTZ,
			answered_at     TIMESTAMPTZ,
			ended_at        TIMESTAMPTZ,
			created_at      TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Index untuk calls
		`CREATE INDEX IF NOT EXISTS idx_calls_conversation ON calls(conversation_id)`,
		`CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status)`,

		// Tabel widget_configs — konfigurasi widget per tenant
		`CREATE TABLE IF NOT EXISTS widget_configs (
			id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_slug      VARCHAR(100) UNIQUE NOT NULL,
			bot_name         VARCHAR(100) DEFAULT 'Cika',
			primary_color    VARCHAR(20) DEFAULT '#4F46E5',
			greeting_message TEXT DEFAULT 'Halo! 👋 Ada yang bisa kami bantu?',
			logo_url         TEXT DEFAULT '',
			prechat_enabled  BOOLEAN DEFAULT false,
			prechat_fields   JSONB DEFAULT '["name"]',
			offline_enabled  BOOLEAN DEFAULT false,
			offline_message  TEXT DEFAULT 'Kami sedang offline. Silakan tinggalkan pesan.',
			working_hours    JSONB DEFAULT '{"start":"08:00","end":"22:00","timezone":"Asia/Jakarta"}',
			created_at       TIMESTAMPTZ DEFAULT NOW(),
			updated_at       TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Tabel widget_ip_blacklist — blokir IP spam
		`CREATE TABLE IF NOT EXISTS widget_ip_blacklist (
			id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			ip_address VARCHAR(50) NOT NULL,
			reason     VARCHAR(255) DEFAULT '',
			expires_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_widget_ip ON widget_ip_blacklist(ip_address)`,

		// Tambah kolom visitor_info ke conversations (untuk web)
		`DO $$ BEGIN
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
				WHERE table_name='conversations' AND column_name='visitor_info') THEN
				ALTER TABLE conversations ADD COLUMN visitor_info JSONB DEFAULT '{}';
			END IF;
		END $$`,
	}

	for _, q := range queries {
		if _, err := pool.Exec(context.Background(), q); err != nil {
			return fmt.Errorf("migration error: %w", err)
		}
	}

	log.Println("✅ Database migration complete")
	return nil
}
