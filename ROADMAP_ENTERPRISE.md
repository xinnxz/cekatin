# 🚀 CekatIn — Enterprise Development Roadmap

> **Dokumen ini berisi alur pengembangan lengkap CekatIn**
> dari prototype (jurnal) menuju platform SaaS enterprise.
>
> Dibuat: 24 Februari 2026
> Author: CekatIn Team

---

## 📋 Daftar Isi

1. [Arsitektur Saat Ini (Prototype)](#1-arsitektur-saat-ini-prototype)
2. [Phase 1: SaaS MVP (3-6 Bulan)](#2-phase-1-saas-mvp-3-6-bulan)
3. [Phase 2: Full Platform (6-12 Bulan)](#3-phase-2-full-platform-6-12-bulan)
4. [Estimasi Biaya & Revenue](#4-estimasi-biaya--revenue)
5. [Tech Stack Evolution](#5-tech-stack-evolution)
6. [Checklist Progress](#6-checklist-progress)

---

## 1. Arsitektur Saat Ini (Prototype)

### 1.1 Gambaran Sistem

```
┌──────────────────────────────────────┐
│           BROWSER (Client)           │
│  ┌──────────────────────────────┐    │
│  │   Chat UI (HTML/CSS/JS)      │    │
│  │   - index.html               │    │
│  │   - style.css                │    │
│  │   - app.js                   │    │
│  └──────────┬───────────────────┘    │
└─────────────┼────────────────────────┘
              │ HTTP (REST API)
              ▼
┌──────────────────────────────────────┐
│        FLASK SERVER (app.py)         │
│  ┌──────────┐   ┌────────────────┐   │
│  │ NLP Engine│   │  Gemini/Groq   │   │
│  │(nlp_engine│   │  AI Backend    │   │
│  │   .py)    │   │(gemini_backend │   │
│  │           │   │   .py)         │   │
│  └─────┬────┘   └────────────────┘   │
│        │                             │
│  ┌─────┴──────────────────────┐      │
│  │  Static Files (JSON)       │      │
│  │  - intents.json            │      │
│  │  - learning_log.json       │      │
│  │  - chatbot_pipeline.pkl    │      │
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
```

### 1.2 Kelemahan Prototype

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Data disimpan di file JSON | Hilang saat redeploy |
| 2 | Single tenant (1 toko saja) | Tidak bisa dijual ke banyak client |
| 3 | Tidak ada autentikasi | Siapa saja bisa akses admin endpoint |
| 4 | Training manual | Developer harus edit file + restart |
| 5 | Tidak ada analytics | Tidak tahu performa chatbot |
| 6 | Tidak ada dashboard admin | Client tidak bisa kelola sendiri |

---

## 2. Phase 1: SaaS MVP (3-6 Bulan)

### 2.1 Tujuan Phase 1

> Mengubah CekatIn dari **single-tenant prototype** menjadi **multi-tenant SaaS MVP**
> dimana setiap toko/UMKM bisa punya chatbot sendiri yang bisa dikelola via dashboard admin.

### 2.2 Arsitektur Target Phase 1

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                     │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Chat Widget │  │ Admin Panel  │  │ Landing Page│  │
│  │  (Embeddable)│  │ (Dashboard)  │  │ (Marketing) │  │
│  │  React/Next  │  │  React/Next  │  │  Next.js    │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────────┘  │
└─────────┼────────────────┼───────────────────────────┘
          │                │
          ▼                ▼
┌──────────────────────────────────────────────────────┐
│                    API LAYER (Backend)                 │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │         Flask / FastAPI (Python)                │   │
│  │                                                │   │
│  │  /api/chat        → Handle percakapan          │   │
│  │  /api/auth        → Login, register, JWT       │   │
│  │  /api/intents     → CRUD intent & pattern      │   │
│  │  /api/analytics   → Data statistik chat        │   │
│  │  /api/tenants     → Manage toko/client         │   │
│  │  /api/training    → Retrain model per tenant   │   │
│  │  /api/billing     → Subscription & payment     │   │
│  └────────────────────────────────────────────────┘   │
└───────────┬──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────┐
│                    DATA LAYER                         │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ PostgreSQL │  │   Redis    │  │ Object Storage │  │
│  │            │  │            │  │ (S3/Cloudflare)│  │
│  │ - Users    │  │ - Session  │  │ - Model files  │  │
│  │ - Tenants  │  │ - Cache    │  │ - Exports      │  │
│  │ - Intents  │  │ - Rate     │  │ - Logs         │  │
│  │ - Chats    │  │   Limit    │  │                │  │
│  │ - Analytics│  │            │  │                │  │
│  └────────────┘  └────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 2.3 Detail Fitur Phase 1

---

#### 2.3.1 🗄️ Database Migration (Minggu 1-2)

**Tujuan:** Pindahkan semua data dari file JSON ke PostgreSQL.

**Database Schema:**

```sql
-- ═══════════════════════════════════════
-- TABEL TENANTS (Data Toko/Client)
-- ═══════════════════════════════════════
CREATE TABLE tenants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,          -- "Toko ReonShop"
    slug          VARCHAR(50) UNIQUE NOT NULL,     -- "reonshop"
    tagline       VARCHAR(255),                    -- "Gadget Terlengkap"
    description   TEXT,
    logo_url      VARCHAR(500),
    whatsapp      VARCHAR(20),
    email         VARCHAR(100),
    address       TEXT,
    operating_hours JSONB,                         -- {"senin": "09:00-21:00", ...}
    plan          VARCHAR(20) DEFAULT 'starter',   -- starter, business, enterprise
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABEL USERS (Admin per Toko)
-- ═══════════════════════════════════════
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100),
    role          VARCHAR(20) DEFAULT 'admin',     -- superadmin, admin, viewer
    is_active     BOOLEAN DEFAULT true,
    last_login    TIMESTAMP,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABEL INTENTS (Data Training per Toko)
-- ═══════════════════════════════════════
CREATE TABLE intents (
    id            SERIAL PRIMARY KEY,
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tag           VARCHAR(100) NOT NULL,            -- "greeting", "tanya_harga"
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, tag)
);

-- ═══════════════════════════════════════
-- TABEL PATTERNS (Variasi Pertanyaan)
-- ═══════════════════════════════════════
CREATE TABLE patterns (
    id            SERIAL PRIMARY KEY,
    intent_id     INTEGER REFERENCES intents(id) ON DELETE CASCADE,
    text          TEXT NOT NULL,                     -- "berapa harga hp"
    source        VARCHAR(20) DEFAULT 'manual',     -- manual, auto_learn
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABEL RESPONSES (Jawaban Bot)
-- ═══════════════════════════════════════
CREATE TABLE responses (
    id            SERIAL PRIMARY KEY,
    intent_id     INTEGER REFERENCES intents(id) ON DELETE CASCADE,
    text          TEXT NOT NULL,                     -- "Halo kak! Ada yang bisa dibantu?"
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABEL CONVERSATIONS (Log Percakapan)
-- ═══════════════════════════════════════
CREATE TABLE conversations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id    VARCHAR(100) NOT NULL,             -- session visitor
    visitor_name  VARCHAR(100),
    visitor_ip    VARCHAR(45),
    started_at    TIMESTAMP DEFAULT NOW(),
    ended_at      TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    satisfaction  INTEGER                            -- 1-5 rating (optional)
);

-- ═══════════════════════════════════════
-- TABEL MESSAGES (Isi Percakapan)
-- ═══════════════════════════════════════
CREATE TABLE messages (
    id            SERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender        VARCHAR(10) NOT NULL,              -- 'user' atau 'bot'
    text          TEXT NOT NULL,
    intent_tag    VARCHAR(100),                      -- intent yang terdeteksi
    confidence    FLOAT,                             -- confidence score
    source        VARCHAR(20),                       -- 'nlp', 'gemini', 'groq'
    response_time_ms INTEGER,                        -- waktu respon (ms)
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABEL LEARNING_LOG (Auto-Learn Queue)
-- ═══════════════════════════════════════
CREATE TABLE learning_log (
    id            SERIAL PRIMARY KEY,
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_message  TEXT NOT NULL,
    bot_response  TEXT,
    detected_intent VARCHAR(100),
    confidence    FLOAT,
    status        VARCHAR(20) DEFAULT 'pending',     -- pending, approved, rejected
    reviewed_by   UUID REFERENCES users(id),
    reviewed_at   TIMESTAMP,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- TABEL MODELS (Trained Model per Toko)
-- ═══════════════════════════════════════
CREATE TABLE models (
    id            SERIAL PRIMARY KEY,
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    version       INTEGER NOT NULL,
    file_path     VARCHAR(500),                      -- path di object storage
    accuracy      FLOAT,
    training_count INTEGER,                          -- jumlah data training
    is_active     BOOLEAN DEFAULT true,
    trained_at    TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- INDEX untuk performa query
-- ═══════════════════════════════════════
CREATE INDEX idx_intents_tenant ON intents(tenant_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_learning_log_tenant ON learning_log(tenant_id);
CREATE INDEX idx_learning_log_status ON learning_log(status);
```

**Langkah implementasi:**
1. Setup PostgreSQL di Railway (Add-on gratis)
2. Install SQLAlchemy + Alembic untuk ORM dan migrasi
3. Buat file `models.py` berisi semua model SQLAlchemy
4. Buat migration script untuk generate tabel
5. Buat script `migrate_json_to_db.py` untuk migrasi data lama
6. Update `nlp_engine.py` agar baca dari database bukan file JSON
7. Update `app.py` agar simpan chat log ke database
8. Test semua endpoint masih berfungsi

---

#### 2.3.2 🔐 Authentication & Authorization (Minggu 2-3)

**Tujuan:** Setiap toko punya admin yang bisa login dan kelola chatbot mereka.

**Teknologi:** JWT (JSON Web Token) + bcrypt

**Alur Autentikasi:**

```
┌──────────┐    POST /api/auth/register     ┌──────────┐
│  Admin   │ ──────────────────────────────▶ │  Server  │
│  (Client)│                                 │          │
│          │    ◀────── 201 Created ──────── │          │
└──────────┘                                 └──────────┘

┌──────────┐    POST /api/auth/login         ┌──────────┐
│  Admin   │ ──────────────────────────────▶ │  Server  │
│          │    { email, password }           │          │
│          │                                 │          │
│          │    ◀── 200 { access_token } ─── │          │
└──────────┘                                 └──────────┘

┌──────────┐    GET /api/intents             ┌──────────┐
│  Admin   │ ──────────────────────────────▶ │  Server  │
│          │    Header: Bearer <token>       │          │
│          │                                 │          │
│          │    ◀── 200 [intent data] ────── │          │
└──────────┘                                 └──────────┘
```

**Endpoint Auth:**

```
POST   /api/auth/register    → Daftar admin baru
POST   /api/auth/login       → Login, dapat JWT token
POST   /api/auth/refresh     → Refresh expired token
POST   /api/auth/logout      → Invalidate token
GET    /api/auth/me           → Get current user info
PUT    /api/auth/password     → Ganti password
```

**File yang perlu dibuat:**
1. `auth.py` — Logic autentikasi (hash password, generate JWT)
2. `middleware.py` — Decorator `@require_auth` untuk protect endpoint
3. `auth_routes.py` — Blueprint Flask untuk endpoint auth

---

#### 2.3.3 🏢 Multi-Tenant System (Minggu 3-4)

**Tujuan:** Satu server CekatIn bisa melayani banyak toko sekaligus.

**Konsep Multi-Tenant:**

```
CekatIn Platform
│
├── Tenant: "Toko ReonShop" (slug: reonshop)
│   ├── Admin: lutfi@reonshop.com
│   ├── Intents: 25 intent, 200 patterns
│   ├── Model: chatbot_reonshop_v3.pkl
│   └── Chats: 1,500 conversations
│
├── Tenant: "Warung Makan Sederhana" (slug: warung-sederhana)
│   ├── Admin: budi@warung.com
│   ├── Intents: 15 intent, 80 patterns
│   ├── Model: chatbot_warung_v1.pkl
│   └── Chats: 500 conversations
│
└── Tenant: "Toko Baju Murah" (slug: toko-baju)
    ├── Admin: sari@tokobaju.com
    ├── Intents: 20 intent, 150 patterns
    ├── Model: chatbot_baju_v2.pkl
    └── Chats: 800 conversations
```

**Cara kerja:**

```
Chat Widget di website toko
     │
     │  POST /api/chat
     │  Header: X-Tenant-ID: reonshop
     │  Body: { "message": "harga hp berapa?" }
     │
     ▼
Flask Server
     │
     ├── 1. Identifikasi tenant dari header/slug
     ├── 2. Load model NLP milik tenant tersebut
     ├── 3. Proses pesan dengan NLP + AI
     ├── 4. Simpan log ke database (tenant-specific)
     └── 5. Return response
```

**File yang perlu dibuat/update:**
1. `tenant_manager.py` — Logic load/cache model per tenant
2. Update `nlp_engine.py` — Support multiple model instances
3. Update `app.py` — Tambah tenant middleware
4. Buat embeddable chat widget (`widget.js`)

---

#### 2.3.4 📊 Admin Dashboard (Minggu 4-6)

**Tujuan:** Web panel untuk client kelola chatbot mereka sendiri.

**Halaman Dashboard:**

```
┌─────────────────────────────────────────────────┐
│  CekatIn Admin Dashboard                         │
├─────────┬───────────────────────────────────────┤
│         │                                        │
│  📊     │   OVERVIEW                             │
│ Overview│   ┌────────┐ ┌────────┐ ┌────────┐    │
│         │   │ 1,523  │ │ 91.2%  │ │  4.5s  │    │
│  💬     │   │ Chats  │ │Accuracy│ │Avg Resp│    │
│ Intents │   │ today  │ │  NLP   │ │  Time  │    │
│         │   └────────┘ └────────┘ └────────┘    │
│  📝     │                                        │
│ Training│   📈 Chat Volume (7 hari terakhir)     │
│         │   ┌──────────────────────────────┐     │
│  🧠     │   │  ▂ ▃ ▇ ▅ ▆ █ ▄             │     │
│ Learning│   │  S S R K J S M              │     │
│         │   └──────────────────────────────┘     │
│  ⚙️     │                                        │
│ Settings│   🏷️ Top Intents                       │
│         │   1. tanya_harga    (35%)              │
│  💳     │   2. greeting       (20%)              │
│ Billing │   3. tanya_stok     (15%)              │
│         │   4. tanya_promo    (12%)              │
│         │   5. lainnya        (18%)              │
└─────────┴───────────────────────────────────────┘
```

**Fitur Dashboard:**

| Halaman | Fungsi | API Endpoint |
|---------|--------|-------------|
| **Overview** | Statistik chat, accuracy, response time | `GET /api/analytics/overview` |
| **Intents** | CRUD intent, patterns, responses | `GET/POST/PUT/DELETE /api/intents` |
| **Training** | Lihat data training, tambah pattern | `GET /api/training/data` |
| **Learning** | Review auto-learn, approve/reject | `GET /api/learning/pending` |
| **Conversations** | Lihat history chat visitor | `GET /api/conversations` |
| **Settings** | Config toko, persona bot, jam operasi | `GET/PUT /api/settings` |
| **Billing** | Lihat plan, upgrade, payment history | `GET /api/billing` |

**Tech stack dashboard:**
- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts atau Chart.js
- **State management:** Zustand atau React Query
- **Deploy:** Vercel (free tier)

---

#### 2.3.5 📦 Embeddable Chat Widget (Minggu 5-6)

**Tujuan:** Client cukup paste 1 script tag di website mereka untuk menampilkan chatbot.

**Cara pakai (dari sisi client):**

```html
<!-- Paste di website toko sebelum </body> -->
<script
  src="https://cdn.cekatin.id/widget.js"
  data-tenant="reonshop"
  data-position="bottom-right"
  data-theme="dark"
  data-primary-color="#06b6d4"
></script>
```

**Fitur widget:**
- Bubble chat di pojok kanan bawah
- Customizable warna dan posisi
- Responsive (desktop + mobile)
- Lazy loaded (tidak menambah load time website client)
- Session persistence (chat tidak hilang saat pindah halaman)

**File yang perlu dibuat:**
1. `widget/widget.js` — Script utama (vanilla JS, no framework)
2. `widget/widget.css` — Styling widget
3. CDN setup untuk serve file widget

---

#### 2.3.6 💳 Billing & Subscription (Minggu 6)

**Tujuan:** Sistem pembayaran otomatis untuk subscription bulanan.

**Payment gateway:** Midtrans (gratis setup, potongan 2.9% per transaksi)

**Paket Harga:**

```
┌───────────────────────────────────────────────────────────┐
│                    PRICING PLANS                           │
├──────────────┬──────────────────┬─────────────────────────┤
│   STARTER    │    BUSINESS      │     ENTERPRISE          │
│  Rp 99.000   │  Rp 299.000      │    Rp 999.000           │
│  /bulan      │  /bulan          │    /bulan               │
├──────────────┼──────────────────┼─────────────────────────┤
│ 500 chat/bln │ 5.000 chat/bln   │ Unlimited chat          │
│ 1 AI model   │ 3 AI model       │ Unlimited model         │
│ 10 intent    │ 50 intent        │ Unlimited intent        │
│ Basic NLP    │ NLP + Gemini AI  │ NLP + Gemini + GPT4     │
│ ❌ Analytics │ ✅ Analytics     │ ✅ Advanced Analytics   │
│ ❌ Widget    │ ✅ Widget        │ ✅ Custom Widget        │
│ Email support│ Priority support │ Dedicated support       │
│ ❌ API access│ ❌ API access    │ ✅ Full API access      │
│ ❌ WhatsApp  │ ❌ WhatsApp      │ ✅ WhatsApp integration │
└──────────────┴──────────────────┴─────────────────────────┘
```

**Alur Pembayaran:**

```
Client pilih plan → Midtrans Snap (popup) → Bayar → Webhook callback
                                                         │
                                              Update plan di database
                                                         │
                                              Aktifkan fitur sesuai plan
```

---

### 2.4 Timeline Phase 1

```
Minggu 1-2  : 🗄️ Database Migration
                ├── Setup PostgreSQL
                ├── Buat models (SQLAlchemy)
                ├── Migrasi intents.json → database
                └── Update NLP engine baca dari DB

Minggu 2-3  : 🔐 Authentication
                ├── JWT auth system
                ├── Register/login endpoint
                ├── Middleware protect endpoint
                └── Role-based access

Minggu 3-4  : 🏢 Multi-Tenant
                ├── Tenant manager
                ├── Per-tenant model loading
                ├── Tenant isolation (data terpisah)
                └── Tenant onboarding flow

Minggu 4-6  : 📊 Admin Dashboard
                ├── Setup Next.js project
                ├── Overview, Intents, Training pages
                ├── Learning review page
                ├── Settings page
                └── Basic analytics

Minggu 5-6  : 📦 Chat Widget
                ├── Embeddable widget script
                ├── Customization options
                ├── CDN deployment
                └── Widget documentation

Minggu 6    : 💳 Billing
                ├── Midtrans integration
                ├── Subscription management
                ├── Usage tracking
                └── Invoice generation
```

---

## 3. Phase 2: Full Platform (6-12 Bulan)

### 3.1 Tujuan Phase 2

> Tambahkan integrasi channel (WhatsApp, Instagram), advanced AI (RAG, fine-tuning),
> analytics mendalam, dan fitur-fitur enterprise-grade.

### 3.2 Arsitektur Target Phase 2

```
┌──────────────────────────────────────────────────────────────┐
│                      CHANNEL LAYER                            │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Web Chat │  │ WhatsApp │  │Instagram │  │   Telegram   │   │
│  │ Widget   │  │ Business │  │  DM Bot  │  │     Bot      │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
└───────┼──────────────┼────────────┼────────────────┼──────────┘
        │              │            │                │
        ▼              ▼            ▼                ▼
┌──────────────────────────────────────────────────────────────┐
│                    MESSAGE ROUTER                             │
│              (Normalize semua channel ke format yang sama)    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    AI PROCESSING ENGINE                       │
│                                                               │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  NLP Classifier│  │  RAG Engine  │  │  LLM Orchestrator│  │
│  │  (TF-IDF + NB) │  │  (Vector DB) │  │  (Gemini/GPT)    │  │
│  │                │  │              │  │                  │  │
│  │  Intent match  │  │  Cari konteks│  │  Generate jawaban│  │
│  │  ≥ 70%?        │  │  dari dokumen│  │  dengan konteks  │  │
│  └───────┬────────┘  └──────┬───────┘  └────────┬─────────┘  │
│          │                  │                    │            │
│          ▼                  ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              RESPONSE SELECTOR                       │    │
│  │  Pilih jawaban terbaik berdasarkan confidence        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                       │
│                                                               │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│  │PostgreSQL│  │  Redis  │  │ Pinecone│  │ S3/Cloudflare│   │
│  │          │  │         │  │(Vector) │  │   R2         │   │
│  │ Users    │  │ Session │  │         │  │              │   │
│  │ Tenants  │  │ Cache   │  │ Dokumen │  │ Model files  │   │
│  │ Chats    │  │ Queue   │  │ Katalog │  │ Media files  │   │
│  │ Analytics│  │         │  │ FAQ     │  │ Exports      │   │
│  └──────────┘  └─────────┘  └─────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Detail Fitur Phase 2

---

#### 3.3.1 📱 WhatsApp Business Integration (Bulan 7-8)

**Tujuan:** Chatbot bisa menjawab otomatis di WhatsApp.

**Provider:** WhatsApp Business API via Twilio atau 360dialog

**Alur:**

```
Customer kirim WA → WhatsApp Cloud API → Webhook CekatIn
                                              │
                                    ┌─────────▼──────────┐
                                    │  Process message    │
                                    │  (NLP + AI)         │
                                    └─────────┬──────────┘
                                              │
                                    Send reply via WA API
                                              │
Customer terima jawaban ◀─── WhatsApp Cloud API
```

**Fitur WhatsApp:**
- Auto-reply 24/7
- Template messages (untuk broadcast promo)
- Quick reply buttons
- Media support (kirim gambar produk)
- Handover ke human agent jika bot tidak bisa jawab

**Estimasi biaya:**
- Twilio: ~$0.005/pesan (≈ Rp 80/pesan)
- 360dialog: €49/bulan flat

---

#### 3.3.2 🧠 RAG (Retrieval Augmented Generation) (Bulan 8-9)

**Tujuan:** Bot bisa menjawab berdasarkan dokumen yang diupload client (PDF katalog, FAQ, dsb).

**Cara kerja RAG:**

```
SETUP (sekali saja):
┌─────────────────────────────────────────────────────┐
│ 1. Client upload PDF katalog produk                  │
│ 2. PDF di-extract → teks                            │
│ 3. Teks di-chunk (potongan ~500 kata)               │
│ 4. Setiap chunk dikonversi ke VECTOR (embedding)    │
│ 5. Vector disimpan di Vector Database (Pinecone)    │
└─────────────────────────────────────────────────────┘

SAAT USER BERTANYA:
┌─────────────────────────────────────────────────────┐
│ 1. User: "Berapa harga iPhone 15 Pro?"              │
│ 2. Pertanyaan dikonversi ke vector                  │
│ 3. Cari vector yang paling mirip di database        │
│ 4. Dapat chunk: "iPhone 15 Pro - Rp 18.999.000..." │
│ 5. Kirim chunk + pertanyaan ke Gemini AI            │
│ 6. Gemini jawab berdasarkan konteks:                │
│    "iPhone 15 Pro tersedia di toko kami dengan       │
│     harga Rp 18.999.000, tersedia warna..."         │
└─────────────────────────────────────────────────────┘
```

**Keuntungan RAG vs Training Manual:**

| Aspek | Training Manual | RAG |
|-------|----------------|-----|
| Tambah data | Edit intents.json → retrain | Upload PDF → selesai |
| Update harga | Edit semua response manual | Upload katalog baru |
| Skalabilitas | Terbatas jumlah intent | Bisa ratusan dokumen |
| Akurasi jawaban | Template fix | Dinamis sesuai dokumen |

**Tech stack RAG:**
- **Embedding:** Google Gemini Embedding API (gratis)
- **Vector DB:** Pinecone (free tier 100K vectors) atau ChromaDB (self-hosted)
- **Chunking:** LangChain text splitter

---

#### 3.3.3 📈 Advanced Analytics (Bulan 9-10)

**Tujuan:** Dashboard analytics mendalam untuk insight bisnis.

**Metrik yang tersedia:**

```
┌───────────────────────────────────────────┐
│          ANALYTICS DASHBOARD               │
├───────────────────────────────────────────┤
│                                           │
│  📊 OVERVIEW METRICS                      │
│  ┌─────────┬──────────┬────────────────┐  │
│  │ Total   │ Resolved │ Avg Response   │  │
│  │ Chats   │ Rate     │ Time           │  │
│  │ 15,230  │ 87.3%    │ 2.1s           │  │
│  └─────────┴──────────┴────────────────┘  │
│                                           │
│  🏷️ INTENT ANALYTICS                      │
│  • Top intents (apa yang paling ditanya)  │
│  • Unresolved queries (bot nggak paham)   │
│  • Confidence distribution                │
│  • Intent trend over time                 │
│                                           │
│  👤 VISITOR ANALYTICS                      │
│  • Chat volume per jam/hari/minggu        │
│  • Peak hours (jam sibuk)                 │
│  • Returning visitors                     │
│  • Geographic distribution                │
│                                           │
│  🤖 AI PERFORMANCE                         │
│  • NLP vs Gemini usage ratio              │
│  • Model accuracy trend                   │
│  • Fallback rate                          │
│  • Average confidence score               │
│                                           │
│  💰 BUSINESS INSIGHTS                      │
│  • Produk paling ditanyakan               │
│  • Conversion dari chat ke beli           │
│  • Customer satisfaction score            │
│  • Cost per conversation                  │
└───────────────────────────────────────────┘
```

---

#### 3.3.4 🔄 Auto-Training Pipeline (Bulan 10-11)

**Tujuan:** Model NLP bisa improve otomatis tanpa intervensi developer.

**Pipeline:**

```
┌────────────────────────────────────────────────────────┐
│                AUTO-TRAINING PIPELINE                    │
│                                                          │
│  1. COLLECT                                              │
│     User bertanya → log ke database                     │
│                    │                                     │
│  2. FILTER                                               │
│     Ambil pesan dengan confidence < 70%                 │
│     (tanda bot kurang yakin)                            │
│                    │                                     │
│  3. CLUSTER                                              │
│     Kelompokkan pesan mirip menggunakan similarity      │
│                    │                                     │
│  4. SUGGEST                                              │
│     Admin dapat notifikasi:                             │
│     "Ada 15 pertanyaan baru soal 'retur barang',        │
│      mau buat intent baru?"                             │
│                    │                                     │
│  5. APPROVE                                              │
│     Admin review → Approve/Reject di dashboard          │
│                    │                                     │
│  6. RETRAIN                                              │
│     Model otomatis retrain dengan data baru             │
│     (background job, tanpa downtime)                    │
│                    │                                     │
│  7. DEPLOY                                               │
│     Model baru otomatis di-deploy                       │
│     (blue-green deployment)                             │
└────────────────────────────────────────────────────────┘
```

---

#### 3.3.5 🤝 Human Handover (Bulan 11-12)

**Tujuan:** Jika bot tidak bisa jawab, transfer ke human agent.

**Alur:**

```
User bertanya → Bot jawab (confidence rendah)
                    │
                    ▼
              Bot: "Maaf, Cika belum bisa jawab ini.
                    Mau dihubungkan ke CS kami?"
                    │
            ┌───────┴───────┐
            ▼               ▼
        [Ya, hubungkan]  [Tidak, coba lagi]
            │
            ▼
     Notifikasi ke admin WhatsApp/Dashboard
            │
            ▼
     Admin chat langsung dengan user
     (di dashboard CekatIn)
```

---

### 3.4 Timeline Phase 2

```
Bulan 7-8   : 📱 WhatsApp Integration
                ├── Setup WhatsApp Business API
                ├── Webhook handler
                ├── Message router
                └── Template messages

Bulan 8-9   : 🧠 RAG System
                ├── Document upload & processing
                ├── Vector database setup
                ├── Embedding pipeline
                └── Context-aware responses

Bulan 9-10  : 📈 Advanced Analytics
                ├── Analytics data pipeline
                ├── Dashboard visualizations
                ├── Business insights
                └── Export & reporting

Bulan 10-11 : 🔄 Auto-Training Pipeline
                ├── Learning queue system
                ├── Smart suggestion engine
                ├── Background retrain job
                └── Auto-deploy pipeline

Bulan 11-12 : 🤝 Human Handover + Polish
                ├── Live chat system
                ├── Agent assignment
                ├── Notification system
                └── Final polish & documentation
```

---

## 4. Estimasi Biaya & Revenue

### 4.1 Biaya Development

| Item | Phase 1 | Phase 2 | Total |
|------|---------|---------|-------|
| Developer (full-stack) | Self/freelance | Self/freelance | Self/freelance |
| Server (Railway Pro) | Rp 80rb/bulan | Rp 300rb/bulan | Rp 380rb/bulan |
| Database (PostgreSQL) | Rp 0 (included) | Rp 0 (included) | Rp 0 |
| Domain (.id) | Rp 150rb/tahun | - | Rp 150rb/tahun |
| Gemini API | Rp 0 (free tier) | Rp 200rb/bulan | Rp 200rb/bulan |
| WhatsApp API | - | Rp 750rb/bulan | Rp 750rb/bulan |
| Vector DB (Pinecone) | - | Rp 0 (free tier) | Rp 0 |
| **Total/bulan** | **~Rp 90rb** | **~Rp 1.3jt** | **~Rp 1.4jt** |

### 4.2 Proyeksi Revenue

```
BULAN KE-6 (Launch MVP):
  10 client × Rp 99.000  = Rp    990.000
  5 client  × Rp 299.000 = Rp  1.495.000
                           ────────────────
  Revenue:                  Rp  2.485.000
  Biaya:                   -Rp    400.000
  Profit:                   Rp  2.085.000 ✅

BULAN KE-12 (Full Platform):
  50 client  × Rp 99.000  = Rp  4.950.000
  30 client  × Rp 299.000 = Rp  8.970.000
  5 client   × Rp 999.000 = Rp  4.995.000
                              ────────────────
  Revenue:                    Rp 18.915.000
  Biaya:                     -Rp  3.000.000
  Profit:                     Rp 15.915.000 ✅

BULAN KE-24 (Scale):
  200 client × Rp 99.000  = Rp 19.800.000
  100 client × Rp 299.000 = Rp 29.900.000
  20 client  × Rp 999.000 = Rp 19.980.000
                              ────────────────
  Revenue:                    Rp 69.680.000
  Biaya:                     -Rp 10.000.000
  Profit:                     Rp 59.680.000 ✅ 🚀
```

---

## 5. Tech Stack Evolution

### 5.1 Perbandingan Tech Stack

| Layer | Sekarang (Prototype) | Phase 1 (MVP) | Phase 2 (Enterprise) |
|-------|---------------------|---------------|---------------------|
| **Frontend** | Vanilla HTML/CSS/JS | Next.js + shadcn/ui | Next.js + custom design system |
| **Backend** | Flask (Python) | Flask/FastAPI | FastAPI + Celery workers |
| **Database** | JSON files | PostgreSQL | PostgreSQL + Redis + Pinecone |
| **AI/NLP** | TF-IDF + NB | TF-IDF + NB + Gemini | NLP + RAG + Multi-LLM |
| **Auth** | None | JWT + bcrypt | JWT + OAuth2 + RBAC |
| **Deploy** | Railway (1 service) | Railway (2 services) | AWS/GCP (auto-scaling) |
| **CDN** | None | Cloudflare (free) | Cloudflare Pro |
| **Monitoring** | print() logs | Sentry + basic logs | Grafana + Prometheus |
| **CI/CD** | Manual push | GitHub Actions | GitHub Actions + staging |

---

## 6. Checklist Progress

### Phase 0: Prototype (SELESAI ✅)
- [x] NLP Engine (TF-IDF + Naive Bayes)
- [x] Slang normalization
- [x] Gemini AI integration
- [x] Chat UI (premium dark theme)
- [x] Suggested replies
- [x] Auto-learn logging
- [x] Railway deployment
- [x] Journal paper

### Phase 1: SaaS MVP
- [x] Database migration (PostgreSQL) — SQLite lokal, siap PostgreSQL
- [x] SQLAlchemy models & migration
- [x] JWT authentication system
- [x] Multi-tenant architecture
  - [x] TenantManager (per-tenant NLP model cache)
  - [x] Tenant CRUD API (/api/tenants)
  - [x] Tenant identification di chat (X-Tenant-Slug header)
  - [x] Per-tenant model directories (models/{slug}/)
- [ ] Admin dashboard (Next.js)
  - [ ] Overview page
  - [ ] Intent management (CRUD)
  - [ ] Training data management
  - [ ] Learning review page
  - [ ] Settings page
  - [ ] Analytics overview
- [ ] Embeddable chat widget
- [ ] Billing & subscription (Midtrans)
- [ ] Documentation & API docs
- [ ] Landing page (marketing)

### Phase 2: Full Platform
- [ ] WhatsApp Business integration
- [ ] Instagram DM integration
- [ ] RAG system (document upload → AI)
- [ ] Advanced analytics dashboard
- [ ] Auto-training pipeline
- [ ] Human handover system
- [ ] Multi-LLM support (GPT-4, Claude)
- [ ] Fine-tuning per tenant
- [ ] Webhook system
- [ ] Public API (for enterprise)
- [ ] Mobile app (admin)
- [ ] Multi-language support

---

> **Catatan:** Roadmap ini adalah panduan fleksibel. Prioritas dan timeline
> bisa disesuaikan berdasarkan feedback pasar dan kebutuhan client.
> Yang terpenting adalah **validasi pasar terlebih dahulu** dengan MVP
> sebelum invest banyak di fitur advanced.

---

*Dokumen ini akan di-update seiring perkembangan project.*
*Last updated: 27 Februari 2026*
