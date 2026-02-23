"""
CekatIn — Configuration Module
================================
Semua konfigurasi aplikasi dikumpulkan di sini.

Penjelasan:
- Menggunakan environment variables untuk keamanan
- Fallback ke SQLite jika DATABASE_URL tidak diset (development)
- Semua sensitive data (API key, DB password) TIDAK di-hardcode

Environment Variables yang dibutuhkan:
  DATABASE_URL     → Connection string PostgreSQL
  SECRET_KEY       → JWT secret key
  GEMINI_API_KEY   → Google Gemini API key
  GROQ_API_KEY     → Groq API key (optional)
"""

import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Config:
    """Base configuration."""

    # ── Database ──
    # Format PostgreSQL: postgresql://user:password@host:port/dbname
    # Fallback ke SQLite untuk development lokal
    DATABASE_URL = os.getenv(
        'DATABASE_URL',
        'sqlite:///cekatin.db'  # Default: SQLite lokal
    )

    # Railway memberikan DATABASE_URL dengan prefix "postgres://"
    # SQLAlchemy butuh "postgresql://"
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

    # ── Security ──
    SECRET_KEY = os.getenv('SECRET_KEY', 'cekatin-dev-secret-key-change-in-production')
    JWT_EXPIRY_HOURS = int(os.getenv('JWT_EXPIRY_HOURS', '24'))

    # ── AI API Keys ──
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')

    # ── App Settings ──
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    AGENT_NAME = os.getenv('AGENT_NAME', 'Cika')

    # ── Rate Limiting ──
    MAX_CHATS_PER_MINUTE = int(os.getenv('MAX_CHATS_PER_MINUTE', '20'))

    # ── Model Settings ──
    MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
    DATASET_DIR = os.path.join(os.path.dirname(__file__), 'dataset')
