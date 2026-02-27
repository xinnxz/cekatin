# 🚀 CekatIn — Enterprise Development Roadmap (v2.0)

> **Versi ini diperbarui** berdasarkan analisis fitur lengkap platform **cekat.ai** sebagai benchmark.
>
> Dibuat: 24 Februari 2026 | Diperbarui: 27 Februari 2026
> Author: CekatIn Team

---

## 📋 Daftar Isi

1. [Arsitektur Saat Ini (Prototype)](#1-arsitektur-saat-ini)
2. [Phase 1 — SaaS MVP Foundation (3-6 Bulan)](#2-phase-1--saas-mvp-foundation)
3. [Phase 2 — AI-Powered CRM Platform (6-12 Bulan)](#3-phase-2--ai-powered-crm-platform)
4. [Phase 3 — Enterprise & Ecosystem (12-18 Bulan)](#4-phase-3--enterprise--ecosystem)
5. [Feature Comparison: CekatIn vs cekat.ai](#5-feature-comparison-cekatin-vs-cekatai)
6. [Tech Stack Evolution](#6-tech-stack-evolution)
7. [Checklist Progress](#7-checklist-progress)

---

## 1. Arsitektur Saat Ini

### ✅ Sudah Selesai (Phase 1 MVP)

| Komponen | Status | File |
|----------|--------|------|
| NLP Engine (Naive Bayes + SVM) | ✅ Done | `nlp_engine.py` |
| Gemini/Groq AI Backend | ✅ Done | `gemini_backend.py` |
| Self-Learning System | ✅ Done | `app.py` |
| Database (SQLAlchemy + SQLite) | ✅ Done | `db_models.py`, `database.py` |
| Auth & JWT | ✅ Done | `auth.py`, `auth_routes.py` |
| Multi-Tenant System | ✅ Done | `tenant_manager.py`, `tenant_routes.py` |
| Dashboard UI (cekat.ai style) | ✅ Done | `dashboard/` (Next.js) |
| Admin Dashboard API | ✅ Done | `dashboard_routes.py` |

---

## 2. Phase 1 — SaaS MVP Foundation

> **Target:** 3-6 Bulan dari sekarang
> **Fokus:** Melengkapi fondasi agar bisa dipakai oleh tenant pertama secara penuh.

### 2.1 Embeddable Chat Widget *(Prioritas Tertinggi)*

Client pasang 1 baris kode di website mereka, chatbot langsung muncul.

```html
<script
  src="https://cdn.cekatin.id/widget.js"
  data-tenant="reonshop"
  data-position="bottom-right"
  data-theme="light"
  data-primary-color="#4F46E5"
></script>
```

**Fitur Widget:**
- Floating Action Button (FAB) animasi smooth
- Jendela chat dengan typing indicator
- Suggested replies (chip buttons)
- Session persistence via `localStorage`
- Responsive (desktop + mobile fullscreen)
- Shadow DOM untuk CSS isolation (tidak rusak style website client)
- Customizable warna, posisi, greeting message dari backend config

**File yang dibuat:**
- `widget/src/widget.js` — Core logic (Vanilla JS, no framework)
- `widget/src/widget.css` — Styling widget (Shadow DOM scoped)
- `widget_routes.py` — Flask API: `/api/widget/config`, `/api/widget/history`

---

### 2.2 Analytics Dashboard (3 Layer)

Berdasarkan arsitektur analytics cekat.ai: **Conversation + AI Agent + Overview**.

#### Layer 1: Overview Dashboard
Dashboard utama dengan KPI cards dan grafik.

| Metric | Visualisasi |
|--------|-------------|
| Total conversations (bulan ini) | KPI Card |
| Total messages | KPI Card |
| AI Auto-resolve rate | KPI Card + donut chart |
| Average response time | KPI Card |
| Chat Volume (7/30 hari) | Line chart (Recharts) |
| Peak hours heatmap | Heatmap chart |
| Top intents | Horizontal bar chart |
| NLP vs AI routing ratio | Pie chart |

#### Layer 2: AI Agent Analytics
| Metric | Keterangan |
|--------|------------|
| Intent accuracy per intent | Tabel + accuracy % |
| Confidence distribution | Histogram |
| Escalation rate (AI → human) | KPI + trend |
| Unrecognized message rate | KPI |

#### Layer 3: Conversation Analytics
| Metric | Keterangan |
|--------|------------|
| Conversation history per visitor | Drill-down detail view |
| Session duration | KPI |
| Return visitor rate | KPI |
| Customer Journey tracking | Timeline view |

**API Endpoints:**
```
GET /api/analytics/overview?tenant=<slug>&period=7d|30d
GET /api/analytics/ai-agent?tenant=<slug>
GET /api/analytics/conversations?tenant=<slug>&page=1
```

---

### 2.3 Connected Platforms (Channel Integration)

Tenant bisa menghubungkan chatbot ke berbagai channel komunikasi.

| Platform | Priority | Approach | Status |
|----------|----------|----------|--------|
| **Web Livechat** | 🔴 P0 | Embeddable widget (2.1) | Phase 1 |
| **WhatsApp** | 🔴 P0 | WhatsApp Business API (Meta) | Phase 1 |
| **Instagram DM** | 🟡 P1 | Instagram Messaging API (Meta) | Phase 2 |
| **Facebook Messenger** | 🟡 P1 | Meta Messenger API | Phase 2 |
| **Telegram** | 🟢 P2 | Telegram Bot API | Phase 2 |
| **Tokopedia** | 🟢 P2 | Tokopedia Partner API | Phase 3 |
| **Shopee** | 🔵 P3 | Shopee Open API | Phase 3 |

**WhatsApp Integration (Phase 1):**
```
Tenant daftar WhatsApp Business API (via Meta direct / provider seperti Wablas/Fonnte)
     ↓
CekatIn terima webhook dari WhatsApp
     ↓
Pesan masuk → NLP Engine → Respon → Kirim balik via API
     ↓
Log ke database (conversations + messages)
```

**File yang dibuat:**
- `platform_routes.py` — Blueprint untuk koneksi platform
- `whatsapp_handler.py` — Logic webhook WhatsApp
- `db_models.py` (update) — Tambah tabel `ConnectedPlatform`

---

### 2.4 AI Agent Management (Multi-Agent per Tenant)

Setiap tenant bisa punya **lebih dari 1 AI Agent** dengan kepribadian, knowledge, dan instruksi berbeda.

**Contoh:**
```
Tenant: "Toko ReonShop"
├── Agent 1: "Cika" — Sales Agent (fokus produk & harga)
├── Agent 2: "Hana" — CS Agent (fokus komplain & retur)
└── Agent 3: "Rizky" — Technical Agent (fokus spesifikasi)
```

**Setiap AI Agent punya 3 konfigurasi utama:**

#### Tab 1: General (Behavior & Persona)
| Setting | Keterangan |
|---------|------------|
| Agent Name | Nama agent (misal: "Cika") |
| Behavior Prompt | Instruksi kepribadian & tugas agent |
| Language Style | Formal / Casual / Hybrid |
| Welcome Message | Pesan pertama ke customer baru |
| Agent Transfer Conditions | Kapan harus handoff ke human |
| Working Hours | Jam aktif agent (senin-jumat 09:00-17:00) |
| Time Delay | Delay antar bubble pesan (biar natural) |
| Multi-bubble Reply | Pecah jawaban panjang jadi beberapa pesan |

#### Tab 2: Knowledge Source (5 Tipe Input)
| Type | Cara Kerja |
|------|-----------|
| **Text/SOP** | Copy-paste FAQ, SOP, deskripsi bisnis |
| **QnA Pairs** | Pasangan pertanyaan-jawaban terstruktur |
| **File Upload** | Upload PDF/Word dokumen (RAG) |
| **Website Crawl** | Input URL → ekstrak konten otomatis |
| **Product Catalog** | Import data produk (nama, harga, stok) |

#### Tab 3: Evaluation
| Metric | Keterangan |
|--------|------------|
| Test Chat | Chat langsung dengan agent untuk testing |
| Accuracy Score | Persentase intent yang terdeteksi benar |
| Unhandled Questions | Pertanyaan yang tidak bisa dijawab |
| Improvement Suggestions | Rekomendasi training tambahan |

**API Endpoints:**
```
GET    /api/agents?tenant=<slug>
POST   /api/agents                        → Buat agent baru
GET    /api/agents/<id>
PUT    /api/agents/<id>                   → Update config
DELETE /api/agents/<id>
POST   /api/agents/<id>/knowledge         → Upload knowledge source
GET    /api/agents/<id>/evaluate          → Evaluasi performa
```

---

### 2.5 Human Agents & Teams

Sistem handoff dari AI ke agen manusia nyata.

| Fitur | Keterangan |
|-------|------------|
| Agent accounts | Buat akun untuk CS/human agent (role: agent) |
| Team management | Kelompokkan agent ke dalam tim |
| Conversation assignment | Assign percakapan ke agent tertentu |
| Agent availability | Status online/offline/busy |
| Handoff trigger | AI otomatis handoff saat kondisi terpenuhi |
| Typing indicator | Indicator saat agent manusia mengetik |

---

### 2.6 Labels & Tagging System

Kategorisasi percakapan untuk filter dan reporting.

| Tipe Label | Cara Kerja |
|------------|-----------|
| **Manual** | Agent pilih label saat review chat |
| **Batch** | Pilih banyak chat → assign label sekaligus |
| **AI Automated** | AI otomatis assign label berdasarkan intent/content |

**Contoh Label:** `hot-lead`, `komplain`, `sudah-bayar`, `butuh-followup`, `vip-customer`

---

### 2.7 Quick Reply Templates

Template jawaban cepat yang bisa digunakan human agent.

```
/harga → "Harga produk kami mulai dari Rp 1.500.000..."
/garansi → "Garansi resmi 1 tahun dari distributor..."
/lokasi → "Kami berlokasi di Jl. Sudirman No. 12..."
```

---

### 2.8 Billing & Subscription

Sistem pembayaran otomatis via Midtrans.

**Paket Harga:**

| | **Starter** | **Business** | **Enterprise** |
|-|-------------|-------------|----------------|
| **Harga** | Rp 99.000/bln | Rp 299.000/bln | Rp 999.000/bln |
| Chat/bulan | 500 | 5.000 | Unlimited |
| AI Agents | 1 | 3 | Unlimited |
| Intents/Agents | 10 | 50 | Unlimited |
| Platform | Web only | Web + WA | All platforms |
| Analytics | Basic | Advanced | Full |
| Human Agents | 1 | 5 | Unlimited |
| Knowledge Source | Text + QnA | + File Upload | + Website Crawl |
| Widget | ✅ | ✅ Custom | ✅ White-label |
| API Access | ❌ | ❌ | ✅ Full |
| Support | Email | Priority | Dedicated |

---

## 3. Phase 2 — AI-Powered CRM Platform

> **Target:** 6-12 Bulan
> **Fokus:** Transformasi dari chatbot tool menjadi platform CRM lengkap.

### 3.1 Broadcasts & Campaign Management

Kirim pesan massal ke daftar kontak.

| Fitur | Keterangan |
|-------|------------|
| Broadcast WhatsApp | Kirim pesan ke ribuan kontak sekaligus |
| Template Message | WhatsApp Business approved templates |
| Segmentasi target | Filter kontak berdasarkan label/tag |
| Penjadwalan | Schedule broadcast: tanggal + jam |
| Analytics broadcast | Open rate, klik rate, reply rate |
| A/B Testing | Tes 2 versi pesan, pilih yang terbaik |

**Tipe Broadcast:**
1. **Promotional** — Promo, diskon, informasi produk baru
2. **Transactional** — Konfirmasi pesanan, notifikasi pengiriman
3. **Re-engagement** — Tembak kontak yang sudah lama tidak aktif

---

### 3.2 CRM (Customer Relationship Management)

Manajemen data kontak pelanggan secara menyeluruh.

#### Contacts Database
| Fitur | Keterangan |
|-------|------------|
| Contact profile | Nama, no HP, email, alamat, catatan |
| Custom fields | Tambah field sesuai kebutuhan bisnis |
| Tags & Labels | Kategorisasi kontak |
| Contact history | Riwayat semua percakapan dengan kontak |
| Import/Export | CSV import & export |
| Duplicate detection | Deteksi kontak duplikat |

#### Board View (Pipeline/Kanban)
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   NEW    │  │ PROSPECT │  │NEGOTIATION│  │  CLOSED  │
│──────────│  │──────────│  │──────────│  │──────────│
│ Andi     │  │ Budi     │  │ Citra    │  │ Dewi ✅  │
│ Rp 2jt   │  │ Rp 5jt   │  │ Rp 15jt  │  │ Rp 3jt   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

#### Customer Journey Analytics
Timeline visual perjalanan pelanggan dari pertama kontak hingga transaksi.

---

### 3.3 Order Management

Manajemen pesanan terintegrasi dengan chat.

| Fitur | Keterangan |
|-------|------------|
| Create order dari chat | Buat pesanan langsung dari dalam chat |
| Product catalog | Database produk (nama, harga, stok, gambar) |
| Order page (link) | Bagikan link halaman order ke pelanggan |
| Status tracking | Tracking status: pending → proses → kirim → selesai |
| Invoice generator | Buat invoice PDF otomatis |
| Payment confirmation | AI verifikasi bukti transfer via image vision |
| Stok management | Update stok real-time saat order masuk |

---

### 3.4 Marketing Suite

Tools marketing terintegrasi dalam satu platform.

#### Marketing Dashboard
- Revenue dari percakapan (conversation-to-revenue)
- Lead source analytics (WA, Instagram, Web, dsb)
- Conversion funnel visualization

#### Ads Integration
- Meta Ads click-to-WhatsApp tracking
- UTM parameter tracking per channel
- ROI per campaign (iklan vs revenue yang dihasilkan)

#### Customer Tracker
- Track customer berdasarkan sumber iklan
- Heatmap waktu interaksi
- Segmentasi: New, Active, At-risk, Churned

---

### 3.5 Workflow Automation

Buat alur otomatisasi tanpa coding (no-code).

**Trigger → Kondisi → Aksi:**
```
[TRIGGER: Pesan baru masuk dari WhatsApp]
    ↓ [KONDISI: Label = "hot-lead"]
    ↓ [AKSI: Assign ke Agent "Sarah"] + [Tag: "priority"]

[TRIGGER: Percakapan idle > 24 jam]
    ↓ [AKSI: Kirim follow-up: "Halo! Ada yang bisa kami bantu lagi?"]

[TRIGGER: Keyword terdeteksi: "mau beli", "order", "pesan"]
    ↓ [AKSI: AI kirim catalog + payment link]

[TRIGGER: Payment konfirmasi diterima]
    ↓ [AKSI: Update status order] + [Notifikasi admin]
```

**Blok yang tersedia:**
| Blok | Jenis | Keterangan |
|------|-------|------------|
| Message received | Trigger | Pesan masuk |
| Time elapsed | Trigger | Setelah X waktu tidak ada balasan |
| Keyword match | Kondisi | Pesan mengandung kata kunci |
| Label check | Kondisi | Kontak punya label tertentu |
| Send message | Aksi | Bot kirim pesan teks/gambar |
| Assign agent | Aksi | Assign ke human agent |
| Add label | Aksi | Tambah label ke kontak/chat |
| Update CRM | Aksi | Update field di CRM |
| Create order | Aksi | Buat order otomatis |
| Send notification | Aksi | Kirim notif ke admin via email/Telegram |

---

### 3.6 Chat Flow Builder (Visual No-Code)

Buat alur percakapan bot secara visual dengan drag-and-drop.

```
[Welcome] → [Pilih Menu]
                ├── "1. Info Produk" → [Kirim Catalog] → [Tanya Mau Beli?]
                │                                             ├── Ya → [Buat Order]
                │                                             └── Tidak → [Akhiri]
                ├── "2. Cek Pesanan" → [Minta No. Order] → [Cek Status] → [Balas Status]
                └── "3. Hubungi CS" → [Handoff ke Human Agent]
```

**Komponen Flow:**
- **Start/End Node** — Awal dan akhir percakapan
- **Message Node** — Bot kirim teks/gambar/button
- **Input Node** — Tunggu balasan user
- **Condition Node** — Branching (if/else)
- **AI Node** — Jalankan AI agent
- **Action Node** — Update DB, assign, notifikasi

---

### 3.7 SLA Management

Service Level Agreement — pastikan tidak ada customer yang terabaikan.

| Aturan | Keterangan |
|--------|------------|
| First response time | Max 5 menit untuk balasan pertama |
| Resolution time | Max 24 jam untuk resolve tiket |
| Breach alert | Notifikasi jika SLA terancam dilanggar |
| Escalation | Auto-escalate ke supervisor jika breach |

---

### 3.8 Ticket Management

Sistem tiket untuk melacak isu pelanggan.

| Status | Keterangan |
|--------|------------|
| **Open** | Tiket baru, belum ditangani |
| **In Progress** | Sedang ditangani oleh agent |
| **Waiting Customer** | Menunggu balasan pelanggan |
| **Resolved** | Selesai, tapi belum di-close |
| **Closed** | Tiket ditutup |

---

### 3.9 CSAT Score (Customer Satisfaction)

Survey kepuasan pelanggan otomatis setelah tiket di-resolve.

```
Bot: "Apakah masalah Anda sudah terselesaikan? 
Berikan rating untuk layanan kami:
⭐ ⭐ ⭐ ⭐ ⭐"
```

---

### 3.10 AI Follow-Up System

Sistem follow-up otomatis berbasis AI.

| Trigger | AI Action |
|---------|-----------|
| User tidak beli setelah tanya harga | Follow-up: testimoni + social proof |
| User lihat produk tapi tidak order | Kirim: diskon eksklusif 24 jam |
| Order belum dibayar > 2 jam | Reminder: "Pesananmu menunggu pembayaran!" |
| Pelanggan tidak aktif > 7 hari | Re-engagement: "Ada produk baru yang cocok untukmu!" |

---

### 3.11 AI Vision (Image Analysis)

AI dapat menganalisis gambar yang dikirim pelanggan.

| Kemampuan | Contoh Penggunaan |
|-----------|-------------------|
| Validasi bukti transfer | "Apakah ini bukti bayar yang valid?" |
| Identifikasi produk rusak | "Foto kerusakan → AI analisa → rekomendasi solusi" |
| Baca nomor resi | Ekstrak no. resi dari foto |
| QR Code scan | Baca QR code / barcode |

---

### 3.12 Voice Note (Transcription)

Proses pesan suara dari customer.

```
Customer kirim voice note → Transkripsi via Whisper API
    → NLP classifikasi → Bot jawab dalam teks
```

---

## 4. Phase 3 — Enterprise & Ecosystem

> **Target:** 12-18 Bulan
> **Fokus:** Skalabilitas enterprise, ekosistem developer, white-label.

### 4.1 Full API & Webhook System

```
GET  /api/v1/conversations      → Ambil semua percakapan
POST /api/v1/messages/send      → Kirim pesan via API
GET  /api/v1/contacts           → Ambil daftar kontak
POST /api/v1/webhooks           → Register webhook URL
```

**Webhook Events:**
- `message.received` — Pesan baru masuk
- `conversation.assigned` — Chat di-assign ke agent
- `conversation.resolved` — Chat diselesaikan
- `order.created` — Order baru dibuat
- `payment.confirmed` — Pembayaran dikonfirmasi

---

### 4.2 WhatsApp Business API (Official)

- Integrasi direct dengan Meta WhatsApp Business API
- Template message management (approval flow)
- Verified business badge
- Broadcast ke 100.000+ kontak
- WhatsApp Call support

---

### 4.3 Multi-Language AI Support

- Deteksi bahasa otomatis (Indonesia, English, Jawa, Sunda, dll)
- Jawab dalam bahasa yang sama dengan pelanggan
- Support logat dan singkatan gaul Indonesia

---

### 4.4 Advanced AI Orchestration

**Multi-Agent Routing:**
```
Pesan masuk → Router AI → Identifikasi topik
    → Sales Agent (jika tanya produk/harga)
    → CS Agent (jika ada komplain)
    → Technical Agent (jika tanya spesifikasi)
    → Human Agent (jika semua agent tidak bisa tangani)
```

---

### 4.5 White-Label Solution

Klien enterprise bisa re-brand CekatIn sebagai produk mereka sendiri:
- Custom domain (chat.merekamereka.com)
- Custom logo & warna
- Remove "Powered by CekatIn"
- Custom email branding

---

### 4.6 Tokopedia & Shopee Integration

- Sinkronisasi katalog produk dari marketplace
- Terima pesan dari seller tools marketplace
- Auto-reply di seller chat marketplace
- Update stok otomatis dari marketplace ke CRM

---

### 4.7 IP Blacklist & Security

- Blacklist IP yang spam
- Rate limiting per session
- Fraud detection (bot detector)
- End-to-end encryption untuk pesan sensitif

---

## 5. Feature Comparison: CekatIn vs cekat.ai

| Fitur | cekat.ai | CekatIn Phase 1 | CekatIn Phase 2 | CekatIn Phase 3 |
|-------|----------|----------------|----------------|----------------|
| Web Livechat Widget | ✅ | 🔜 | ✅ | ✅ |
| WhatsApp Integration | ✅ | 🔜 | ✅ | ✅ Official |
| Instagram DM | ✅ | ❌ | 🔜 | ✅ |
| Messenger | ✅ | ❌ | 🔜 | ✅ |
| Telegram | ✅ | ❌ | 🔜 | ✅ |
| Tokopedia | ✅ | ❌ | ❌ | 🔜 |
| Multi AI Agents | ✅ | 🔜 | ✅ | ✅ |
| Knowledge: Text/QnA | ✅ | ✅ | ✅ | ✅ |
| Knowledge: File/PDF | ✅ | ❌ | 🔜 | ✅ |
| Knowledge: Website Crawl | ✅ | ❌ | 🔜 | ✅ |
| Human Agents | ✅ | 🔜 | ✅ | ✅ |
| Labels & Tagging | ✅ | 🔜 | ✅ | ✅ AI-auto |
| Quick Reply | ✅ | 🔜 | ✅ | ✅ |
| Broadcasts | ✅ | ❌ | 🔜 | ✅ |
| Analytics (3-layer) | ✅ | 🔜 | ✅ | ✅ |
| CRM (Contacts) | ✅ | ❌ | 🔜 | ✅ |
| CRM (Pipeline/Board) | ✅ | ❌ | 🔜 | ✅ |
| Order Management | ✅ | ❌ | 🔜 | ✅ |
| Marketing Suite | ✅ | ❌ | 🔜 | ✅ |
| Workflow Automation | ✅ | ❌ | 🔜 | ✅ |
| Chat Flow Builder | ✅ | ❌ | 🔜 | ✅ |
| SLA Management | ✅ | ❌ | 🔜 | ✅ |
| Ticket System | ✅ | ❌ | 🔜 | ✅ |
| CSAT Score | ✅ | ❌ | 🔜 | ✅ |
| AI Follow-up | ✅ | ❌ | 🔜 | ✅ |
| AI Image Vision | ✅ | ❌ | 🔜 | ✅ |
| Voice Note Transcription | ✅ | ❌ | 🔜 | ✅ |
| IP Blacklist | ✅ | ❌ | ❌ | 🔜 |
| Open API | ✅ | ❌ | ❌ | 🔜 |
| Webhook System | ✅ | ❌ | ❌ | 🔜 |
| White-label | ✅ | ❌ | ❌ | 🔜 |
| Multi-language AI | ✅ | ❌ | 🔜 | ✅ |
| Billing & Subscription | ✅ | 🔜 | ✅ | ✅ |

*✅ = Available | 🔜 = In this phase | ❌ = Not yet*

---

## 6. Tech Stack Evolution

| Layer | Phase 1 | Phase 2 | Phase 3 |
|-------|---------|---------|---------|
| **Database** | SQLite → PostgreSQL | PostgreSQL + Redis (cache) | PostgreSQL + Redis + Elasticsearch |
| **Backend** | Flask (Python) | Flask + Celery (background jobs) | Flask + Celery + gRPC |
| **AI Engine** | NLP (NB/SVM) + Gemini | + RAG (file/website knowledge) | + Fine-tuned models |
| **Frontend** | Next.js 14 | Next.js 14 + SWR | Next.js 14 + WebSocket |
| **Widget** | Vanilla JS | Vanilla JS + CDN | Vanilla JS + CDN (global) |
| **Storage** | Local filesystem | Cloudflare R2 / AWS S3 | Multi-region S3 |
| **Deploy Backend** | Railway | Railway → VPS/Docker | Kubernetes |
| **Deploy Frontend** | Vercel | Vercel | Vercel Enterprise |
| **Queue** | — | Celery + Redis | Celery + RabbitMQ |
| **Cache** | — | Redis | Redis Cluster |
| **CDN** | — | Cloudflare | Cloudflare Enterprise |
| **Monitoring** | — | Sentry + Datadog | Full observability stack |

---

## 7. Checklist Progress

### Phase 1 Foundation
- [x] NLP Engine (Naive Bayes + SVM)
- [x] Gemini/Groq AI Backend
- [x] Self-Learning System
- [x] Database Migration (SQLAlchemy)
- [x] Authentication (JWT)
- [x] Multi-Tenant System
- [x] Admin Dashboard UI (cekat.ai style)
- [x] Dashboard API Routes
- [ ] Embeddable Chat Widget (JS)
- [ ] Analytics Dashboard
- [ ] WhatsApp Integration
- [ ] Multi AI Agent Management
- [ ] Human Agents System
- [ ] Labels & Tagging
- [ ] Quick Reply Templates
- [ ] Billing & Subscription (Midtrans)

### Phase 2 CRM
- [ ] Broadcasts & Campaign
- [ ] CRM - Contacts Database
- [ ] CRM - Pipeline/Board View
- [ ] Order Management
- [ ] Marketing Suite
- [ ] Workflow Automation (No-Code)
- [ ] Chat Flow Builder (Visual)
- [ ] SLA Management
- [ ] Ticket System
- [ ] CSAT Score
- [ ] AI Follow-Up System
- [ ] AI Vision (Image Analysis)
- [ ] Voice Note Transcription
- [ ] Knowledge Source: File Upload (RAG)
- [ ] Knowledge Source: Website Crawl

### Phase 3 Enterprise
- [ ] Open API v1
- [ ] Webhook System
- [ ] WhatsApp Official API
- [ ] Instagram Integration
- [ ] Telegram Integration
- [ ] Multi-Language AI
- [ ] AI Orchestration (Multi-Agent Routing)
- [ ] White-Label Solution
- [ ] Tokopedia Integration
- [ ] IP Blacklist & Security
- [ ] Advanced Analytics
