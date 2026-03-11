# CekatIn - AI Chatbot & WhatsApp Integration Engine 🚀

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)
![Go](https://img.shields.io/badge/Go-1.20+-cyan.svg)

**CekatIn** adalah mesin backend cerdas yang menggabungkan kemampuan pemrosesan bahasa alami (NLP) dengan model AI generatif generasi terbaru (seperti Google Gemini dan Groq/Llama). Sistem ini dirancang untuk menangani obrolan Customer Service (CS) secara otomatis, responsif, dan sangat manusiawi, terhubung langsung dengan integrasi WhatsApp Cloud API.

---

## 🌟 Fitur Utama

- 🧠 **Multi-Provider AI Architecture**: Menggunakan pendekatan _Key Rotation_ yang memastikan _uptime_ tinggi.
  - **Gemini 2.5 Flash** (Primary): Memberikan kualitas respon terbaik, ramah, dan solutif.
  - **Groq Llama 3.3** (Fallback): Mengamankan operasional dengan kapasitas _rate-limit_ super besar saat provider utama sedang sibuk atau cooldown.
- 🔄 **Auto-Rotation API Keys**: Mencegah kegagalan _rate limit_ (429 Request Timeout) dengan merotasi kunci API terdaftar secara otomatis di _background_.
- 🚦 **Offline Fallback Engine**: Jika semua layanan AI External (Google/Groq) berhalangan, modul NLP built-in langsung mengambil alih (menggunakan Levenshtein Distance dan Rule-Based regex) agar CS tetap bisa membalas.
- 📱 **WhatsApp Meta API Integration**: Backend Go secara real-time tersambung ke WhatsApp Business untuk merespons pesan pelanggan.
- 📧 **SMTP Email Service**: Dukungan pengiriman email transaksional dengan antrean (_queueing_).

## 🏗️ Arsitektur Proyek

Proyek ini terbagi dalam dua subsistem yang bekerja sama secara asinkron:

1. **AI Engine (Python/Flask)**: `app.py`, `gemini_backend.py`, `nlp_engine.py`
   - Menangani otak kecerdasan chatbot, memproses input pelanggan, mengekstrak _intent_, mencocokkan _knowledge base_, dan mengkomunikasikannya dengan API Generatif.
2. **Integration Backend (Go)**: `/backend`
   - Bertanggung jawab sebagai _Gateway_ WhatsApp (_Webhooks_), email handler, sistem JWT Authentication, serta akses yang kencang pada _database_ PostgreSQL.

## ⚙️ Persyaratan Sistem (Prerequisites)

- **Python** (v3.9 atau yang lebih baru)
- **Go** (v1.20 atau yang lebih baru)
- **PostgreSQL** (Jika tidak disetup, backend Python akan _fallback_ ke SQLite lokal)
- **Git**

## 🚀 Instalasi & Persiapan Lingkungan

### 1. Kloning Repositori
```bash
git clone https://github.com/username-anda/cepatchat.git
cd cepatchat
```

### 2. Konfigurasi Variabel Lingkungan (`.env`)
Salin file tempate konfigurasi ke env Anda dan isikan variabel rahasia:
```bash
cp .env.example .env
```
_Edit file `.env` dan pastikan Anda mengisi spesifikasi kredensial seperti API Keys (GEMINI_API_KEY, GROQ_API_KEY) dan Koneksi DB (DATABASE_URL)._
> **Catatan Keamanan:** File `.env` sudah dimasukkan ke dalam `.gitignore` sehingga tidak akan terunggah secara tidak sengaja. Jangan pernah melakukan commit file asli ini ke respositori!

### 3. Setup Python AI Engine
Disarankan menggunakan _Virtual Environment_.
```bash
# Membuat environment
python -m venv venv

# Aktivasi
# (Windows)
.\venv\Scripts\activate
# (Mac/Linux)
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### 4. Setup Go Backend
```bash
cd backend
go mod tidy
cd ..
```

## 🛠️ Cara Menjalankan Server

Untuk proses pengembangan (development), jalankan kedua server (Python dan Go) di terminal yang terpisah.

**💻 Menjalankan Python Server:**
```bash
# Pastikan (venv) aktif
python app.py
# Modul AI Endpoint akan mendengarkan port default (misal 5000)
```

**💻 Menjalankan Go Backend:**
```bash
cd backend
go run main.go
# Server Integrasi akan mendengarkan port (misal 8080)
```

## 🤝 Berkontribusi
Karena kami baru membuka inisiasi repositori ini ke publik, jika Anda ingin berkontribusi, harap buat "Issues" atau "Pull Requests".
Semua usulan ide pengembangan perbaikan _bug_ sangat kami apresiasi!

## 📜 Lisensi
Proses pendistribusian dan modifikasi dibebaskan. Silakan periksa file [LICENSE](LICENSE) yang menggunakan jenis lisensi **MIT License** untuk informasi perlindungan hak cipta seutuhnya.

---
_CekatIn — "Cepat, Akurat, dan Solutif"_
