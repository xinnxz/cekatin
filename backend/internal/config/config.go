package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

/*
═══════════════════════════════════════════════════════
Config — Load environment variables dari .env file

Penjelasan:
- Menggunakan godotenv untuk membaca .env file
- Semua config diakses via struct Config
- Default values disediakan jika env var kosong
- Func getEnv(key, fallback) → helper untuk default value
═══════════════════════════════════════════════════════
*/

// Config menyimpan semua konfigurasi aplikasi
type Config struct {
	Port         string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBConnString string

	// WhatsApp
	WAVerifyToken  string
	WAAccessToken  string
	WAPhoneNumberID string
	WABusinessAccID string

	// CORS
	DashboardURL string
}

// Load membaca .env file dan mengembalikan Config struct
//
// Cara kerja:
// 1. godotenv.Load() membaca file .env di root directory
// 2. os.Getenv() mengambil value dari environment  
// 3. getEnv() memberikan fallback jika env var kosong
// 4. DBConnString dibangun dari komponen DB_*
func Load() *Config {
	// Load .env file (abaikan error jika file tidak ada, misal di production)
	_ = godotenv.Load()

	cfg := &Config{
		Port:       getEnv("PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "cekatin"),

		WAVerifyToken:   getEnv("WA_VERIFY_TOKEN", "cekatin_webhook_verify_2026"),
		WAAccessToken:   getEnv("WA_ACCESS_TOKEN", ""),
		WAPhoneNumberID: getEnv("WA_PHONE_NUMBER_ID", ""),
		WABusinessAccID: getEnv("WA_BUSINESS_ACCOUNT_ID", ""),

		DashboardURL: getEnv("DASHBOARD_URL", "http://localhost:3000"),
	}

	// Build PostgreSQL connection string
	// Format: postgres://user:password@host:port/dbname?sslmode=disable
	cfg.DBConnString = fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName,
	)

	return cfg
}

// getEnv mengambil env var, return fallback jika kosong
func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
