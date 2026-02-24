"""
CekatIn - Flask API Server (Hybrid NLP + AI Architecture)
============================================================
Server web untuk chatbot CekatIn dengan arsitektur hybrid.

Hybrid Architecture (NLP-First + AI Enhancement):
──────────────────────────────────────────────────
  Layer 1: NLP Engine (NB/SVM) → Klasifikasi intent
  Layer 2: Response Selection  → Berdasarkan intent + confidence
  Layer 3: AI Enhancement      → Gemini/Groq untuk jawaban natural
  Layer 4: Self-Learning        → Belajar dari interaksi user

Alur Respon:
────────────
  User mengirim pesan
    ↓
  NLP Engine mengklasifikasi intent + confidence
    ↓
  Confidence TINGGI (≥70%)?
    → NLP-driven: jawab dari knowledge base + AI enhance
    ↓
  Confidence RENDAH (<70%)?
    → AI-driven: Gemini/Groq generate dengan context dari NLP
    → LOG: simpan pattern + intent untuk pembelajaran
    ↓
  AI tidak tersedia?
    → NLP fallback: jawab dari response template

Self-Learning System:
─────────────────────
  Setiap user chat → interaksi di-log (message, intent, confidence)
  Pattern NLP-driven yang berhasil → auto-promoted ke training data
  Endpoint /api/auto-learn → promote & retrain secara otomatis
  Semakin banyak user chat → semakin pintar bot-nya!

Endpoint:
- GET  /              → Serve halaman chat UI
- POST /api/chat      → Kirim pesan ke chatbot (Hybrid)
- POST /api/clear     → Hapus riwayat chat sesi tertentu
- POST /api/retrain   → Retrain model NLP
- POST /api/auto-learn → Auto-learn dari interaction log
- GET  /api/learning-stats → Statistik self-learning
- GET  /api/health    → Health check server

Author: CekatIn Team
"""

import json
import os
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
from nlp_engine import NLPEngine
from gemini_backend import GeminiBackend

# ── Database (Phase 1 SaaS) ──
try:
    from database import init_db
    from db_service import (
        get_or_create_conversation,
        save_chat_message,
        log_learning_to_db,
        get_chat_stats
    )
    DB_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Database tidak tersedia: {e}")
    DB_AVAILABLE = False

# ============================================================
# Inisialisasi Flask App
# ============================================================

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

print("\n🚀 Memulai CekatIn Server (Hybrid NLP + AI)...")

# ── Inisialisasi Database ──
if DB_AVAILABLE:
    try:
        init_db()
        print("✅ Database connected & tables ready")
    except Exception as e:
        print(f"⚠️ Database init error: {e}")
        DB_AVAILABLE = False

engine = NLPEngine()       # Layer 1: Klasifikasi intent (NB/SVM)
gemini = GeminiBackend()   # Layer 3: AI enhancement (Gemini/Groq)

# ── Threshold confidence untuk menentukan routing ──
# Jika NLP confidence >= threshold → NLP-driven response
# Jika NLP confidence <  threshold → AI-driven response
NLP_CONFIDENCE_THRESHOLD = 0.50


# ============================================================
# Self-Learning System (Active Learning)
# ============================================================
# Sistem ini mencatat SETIAP interaksi user dan belajar darinya.
# 
# Cara kerjanya:
# 1. SETIAP kali user chat → log interaksi (pesan, intent, confidence)
# 2. Jika NLP confidence tinggi (≥70%) → pattern sudah dikenali ✅
# 3. Jika NLP confidence rendah (<70%) tapi AI menjawab dengan intent → 
#    pattern BARU yang perlu dipelajari 📝
# 4. Endpoint /api/auto-learn → promosikan pattern baru ke intents.json
#    dan retrain model secara otomatis
# 
# Hasilnya: semakin banyak orang chatting → semakin pintar bot-nya! 🧠
# ============================================================

LEARNING_LOG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    'dataset', 'learning_log.json'
)

def load_learning_log():
    """Muat log pembelajaran dari file."""
    if os.path.exists(LEARNING_LOG_PATH):
        try:
            with open(LEARNING_LOG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {'interactions': [], 'stats': {'total': 0, 'nlp_driven': 0, 'ai_driven': 0, 'patterns_learned': 0}}
    return {'interactions': [], 'stats': {'total': 0, 'nlp_driven': 0, 'ai_driven': 0, 'patterns_learned': 0}}

def save_learning_log(log_data):
    """Simpan log pembelajaran ke file."""
    with open(LEARNING_LOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)

def log_interaction(user_message, intent, confidence, routing, preprocessed):
    """
    Catat setiap interaksi user untuk pembelajaran.
    
    Kenapa penting?
    - Pattern dengan confidence rendah = peluang belajar
    - Setelah cukup banyak data, kita bisa auto-promote pattern baru
    - Statistik routing membantu evaluasi kinerja NLP
    """
    log = load_learning_log()
    
    # Tambah interaksi
    log['interactions'].append({
        'message': user_message,
        'preprocessed': preprocessed,
        'intent': intent,
        'confidence': round(confidence, 4),
        'routing': routing,
        'timestamp': datetime.now().isoformat()
    })
    
    # Update statistik
    log['stats']['total'] += 1
    if routing == 'nlp_driven':
        log['stats']['nlp_driven'] += 1
    else:
        log['stats']['ai_driven'] += 1
    
    # Batasi log agar tidak terlalu besar (simpan 1000 terakhir)
    if len(log['interactions']) > 1000:
        log['interactions'] = log['interactions'][-1000:]
    
    save_learning_log(log)


# ============================================================
# Suggested Replies Generator
# ============================================================
# Setelah bot menjawab, berikan saran pertanyaan lanjutan.
# Saran disesuaikan berdasarkan intent yang baru saja dibahas.
# Contoh: setelah tanya harga → suggest lihat spek, promo, bayar
# ============================================================

# Mapping intent → saran follow-up yang relevan
SUGGESTED_REPLIES_MAP = {
    'greeting': [
        {'text': '📦 Lihat Produk', 'message': 'produk apa saja yang dijual'},
        {'text': '💰 Cek Harga', 'message': 'daftar harga hp'},
        {'text': '🎉 Promo', 'message': 'ada promo apa aja'},
        {'text': '📍 Lokasi Toko', 'message': 'dimana alamat toko'},
        {'text': '🕐 Jam Buka', 'message': 'jam buka toko'},
    ],
    'tanya_harga': [
        {'text': '📋 Lihat Spesifikasi', 'message': 'spesifikasi lengkapnya gimana'},
        {'text': '🎉 Ada Promo?', 'message': 'ada promo atau diskon gak'},
        {'text': '💳 Cara Bayar', 'message': 'bisa bayar pakai apa aja'},
        {'text': '🚚 Ongkir Berapa?', 'message': 'berapa ongkos kirimnya'},
        {'text': '📦 Produk Lain', 'message': 'ada produk lain yang mirip'},
    ],
    'tanya_produk': [
        {'text': '💰 Cek Harga', 'message': 'berapa harganya'},
        {'text': '📋 Spesifikasi', 'message': 'spesifikasi lengkapnya apa'},
        {'text': '🎉 Promo', 'message': 'ada promo gak'},
        {'text': '📦 Stok Ready?', 'message': 'stoknya masih ada gak'},
        {'text': '🛡️ Garansi', 'message': 'garansinya berapa lama'},
    ],
    'tanya_spesifikasi': [
        {'text': '💰 Berapa Harga?', 'message': 'harganya berapa'},
        {'text': '🔄 Bandingkan', 'message': 'ada alternatif yang lebih bagus'},
        {'text': '🎉 Ada Promo?', 'message': 'ada promo atau diskon'},
        {'text': '🛒 Cara Beli', 'message': 'gimana cara belinya'},
        {'text': '🛡️ Garansi', 'message': 'garansinya gimana'},
    ],
    'tanya_promo': [
        {'text': '📦 Lihat Produk', 'message': 'produk apa saja yang dijual'},
        {'text': '💰 Cek Harga', 'message': 'harga setelah diskon berapa'},
        {'text': '💳 Cara Bayar', 'message': 'metode pembayaran apa saja'},
        {'text': '🚚 Pengiriman', 'message': 'bisa dikirim ke mana aja'},
        {'text': '⏰ Sampai Kapan?', 'message': 'promonya sampai kapan'},
    ],
    'tanya_pengiriman': [
        {'text': '💳 Cara Bayar', 'message': 'bisa bayar pakai apa aja'},
        {'text': '📦 COD Bisa?', 'message': 'bisa bayar di tempat gak'},
        {'text': '📍 Lokasi Toko', 'message': 'alamat tokonya dimana'},
        {'text': '🛡️ Garansi', 'message': 'garansi berapa lama'},
        {'text': '📦 Lihat Produk', 'message': 'mau lihat produk dulu'},
    ],
    'tanya_pembayaran': [
        {'text': '🚚 Pengiriman', 'message': 'bisa kirim ke mana aja'},
        {'text': '💰 Cicilan 0%', 'message': 'ada cicilan 0 persen gak'},
        {'text': '📦 COD Bisa?', 'message': 'bisa cod bayar di tempat'},
        {'text': '🎉 Promo', 'message': 'ada promo apa aja'},
        {'text': '📦 Lihat Produk', 'message': 'mau lihat produk dulu'},
    ],
    'tanya_garansi': [
        {'text': '🔧 Cara Klaim', 'message': 'gimana cara klaim garansi'},
        {'text': '📦 Retur Barang', 'message': 'bisa retur barang gak'},
        {'text': '💰 Cek Harga', 'message': 'berapa harga produknya'},
        {'text': '📦 Lihat Produk', 'message': 'mau lihat produk lain'},
        {'text': '📞 Hubungi CS', 'message': 'bagaimana cara hubungi cs'},
    ],
    'tanya_jam_buka': [
        {'text': '📍 Lokasi Toko', 'message': 'dimana alamat lengkap toko'},
        {'text': '📞 Kontak', 'message': 'nomor telepon atau whatsapp'},
        {'text': '📦 Lihat Produk', 'message': 'produk apa saja yang dijual'},
        {'text': '🎉 Promo', 'message': 'ada promo apa aja sekarang'},
    ],
    'tanya_lokasi': [
        {'text': '🕐 Jam Buka', 'message': 'jam buka toko kapan'},
        {'text': '📞 Kontak', 'message': 'nomor whatsapp berapa'},
        {'text': '🚚 Bisa Kirim?', 'message': 'bisa kirim ke alamat saya gak'},
        {'text': '📦 Lihat Produk', 'message': 'produk apa saja yang dijual'},
    ],
    'keluhan': [
        {'text': '🛡️ Garansi', 'message': 'bagaimana cara klaim garansi'},
        {'text': '📦 Retur', 'message': 'bagaimana prosedur retur barang'},
        {'text': '📞 Hubungi CS', 'message': 'mau bicara dengan customer service'},
        {'text': '📍 Lokasi Toko', 'message': 'dimana alamat toko untuk datang langsung'},
    ],
    'terima_kasih': [
        {'text': '📦 Lihat Produk', 'message': 'mau lihat produk lain'},
        {'text': '❓ Tanya Lagi', 'message': 'saya mau tanya lagi'},
        {'text': '🎉 Promo', 'message': 'ada promo apa aja'},
    ],
}

# Default suggestions jika intent tidak dikenal
DEFAULT_SUGGESTIONS = [
    {'text': '📦 Lihat Produk', 'message': 'produk apa saja yang dijual'},
    {'text': '💰 Cek Harga', 'message': 'daftar harga hp'},
    {'text': '🎉 Promo', 'message': 'ada promo apa aja'},
    {'text': '📍 Lokasi Toko', 'message': 'dimana alamat toko'},
    {'text': '💳 Pembayaran', 'message': 'metode pembayaran apa saja'},
]

def get_suggested_replies(intent: str) -> list:
    """
    Ambil saran follow-up berdasarkan intent saat ini.
    
    Args:
        intent: Intent yang terdeteksi dari pesan user
    
    Returns:
        List of {text, message} untuk ditampilkan sebagai tombol
    """
    return SUGGESTED_REPLIES_MAP.get(intent, DEFAULT_SUGGESTIONS)


# ============================================================
# Route: Serve Frontend
# ============================================================

@app.route('/')
def serve_index():
    """Serve halaman utama."""
    return send_from_directory('static', 'index.html')


# ============================================================
# Route: Chat API (Hybrid NLP + AI)
# ============================================================

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint chatbot Hybrid NLP + AI.

    Alur:
    ─────
    1. Terima pesan user
    2. NLP Engine mengklasifikasi intent & confidence
    3. Routing berdasarkan confidence:
       - Tinggi (≥70%) → NLP-driven + AI-enhanced response
       - Rendah (<70%) → AI-driven response dengan NLP context
    4. Fallback ke NLP template jika AI gagal
    5. Return respon + metadata lengkap

    Response (JSON):
        {
            "response": "...",
            "intent": "tanya_harga",
            "confidence": 0.85,
            "source": "nlp_enhanced" | "ai_driven" | "nlp_fallback",
            "classification_method": "naive_bayes" | "svm",
            "routing": "nlp_driven" | "ai_driven",
            "timestamp": "..."
        }
    """
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({
            'error': 'Field "message" diperlukan',
            'example': {'message': 'halo, mau tanya harga'}
        }), 400

    user_message = data['message'].strip()
    if not user_message:
        return jsonify({'error': 'Pesan tidak boleh kosong'}), 400

    session_id = data.get('session_id', 'default')

    # ══════════════════════════════════════════════════════════
    # STEP 1: NLP Classification (SELALU dijalankan)
    # ──────────────────────────────────────────────────────────
    # NLP Engine mengklasifikasi intent dari pesan user
    # menggunakan model NB/SVM yang sudah ditraining
    # ══════════════════════════════════════════════════════════
    
    nlp_result = engine.get_response(user_message)
    nlp_confidence = nlp_result.get('confidence', 0)
    nlp_intent = nlp_result.get('intent', 'unknown')
    nlp_response = nlp_result.get('response', '')
    preprocessed = nlp_result.get('preprocessed', '')
    all_intents = nlp_result.get('all_intents', [])

    # ══════════════════════════════════════════════════════════
    # STEP 1.5: Extract KB Context (Data Relevan per Intent)
    # ──────────────────────────────────────────────────────────
    # Ambil data KB yang relevan berdasarkan intent + message.
    # Data ini akan dikirim ke Gemini agar jawaban AKURAT
    # tapi tetap NATURAL dan BERVARIASI.
    # ══════════════════════════════════════════════════════════
    
    kb_context = engine.get_kb_context(nlp_intent, user_message)

    # ══════════════════════════════════════════════════════════
    # STEP 2: Response Routing berdasarkan confidence
    # ══════════════════════════════════════════════════════════

    result = {}

    if nlp_confidence >= NLP_CONFIDENCE_THRESHOLD:
        # ── RUTE A: NLP-Driven + AI Enhanced ─────────────────
        # Confidence TINGGI → NLP berhasil mengenali intent
        # Kirim ke AI DENGAN DATA KB agar jawaban natural & akurat
        # Jika AI gagal → pakai NLP response langsung (template)
        # ─────────────────────────────────────────────────────
        
        if gemini.available:
            gemini_result = gemini.get_response(
                message=user_message,
                session_id=session_id,
                nlp_intent=nlp_intent,
                nlp_confidence=nlp_confidence,
                kb_context=kb_context
            )
            
            if gemini_result.get('response'):
                result = {
                    'response': gemini_result['response'],
                    'intent': nlp_intent,
                    'confidence': nlp_confidence,
                    'preprocessed': preprocessed,
                    'all_intents': all_intents,
                    'source': f"nlp_enhanced_{gemini_result.get('source', 'ai')}",
                    'routing': 'nlp_driven',
                    'nlp_intent_used': True
                }
            else:
                # AI gagal → pakai NLP response langsung
                result = {
                    'response': nlp_response,
                    'intent': nlp_intent,
                    'confidence': nlp_confidence,
                    'preprocessed': preprocessed,
                    'all_intents': all_intents,
                    'source': 'nlp_direct',
                    'routing': 'nlp_driven',
                    'nlp_intent_used': True
                }
        else:
            # AI tidak tersedia → NLP response langsung
            result = {
                'response': nlp_response,
                'intent': nlp_intent,
                'confidence': nlp_confidence,
                'preprocessed': preprocessed,
                'all_intents': all_intents,
                'source': 'nlp_direct',
                'routing': 'nlp_driven',
                'nlp_intent_used': True
            }
    
    else:
        # ── RUTE B: AI-Driven Response ───────────────────────
        # Confidence RENDAH → NLP kurang yakin
        # Kirim ke AI dengan context NLP hint
        # Jika AI gagal → pakai NLP response sebagai fallback
        # ─────────────────────────────────────────────────────

        if gemini.available:
            gemini_result = gemini.get_response(
                message=user_message,
                session_id=session_id,
                nlp_intent=nlp_intent,
                nlp_confidence=nlp_confidence,
                kb_context=kb_context
            )

            if gemini_result.get('response'):
                result = {
                    'response': gemini_result['response'],
                    'intent': nlp_intent,
                    'confidence': nlp_confidence,
                    'preprocessed': preprocessed,
                    'all_intents': all_intents,
                    'source': f"ai_driven_{gemini_result.get('source', 'ai')}",
                    'routing': 'ai_driven',
                    'nlp_intent_used': False
                }
            else:
                # AI gagal → fallback NLP
                result = {
                    'response': nlp_response,
                    'intent': nlp_intent,
                    'confidence': nlp_confidence,
                    'preprocessed': preprocessed,
                    'all_intents': all_intents,
                    'source': 'nlp_fallback',
                    'routing': 'nlp_fallback',
                    'nlp_intent_used': True
                }
        else:
            # Semua AI down → NLP only
            result = {
                'response': nlp_response,
                'intent': nlp_intent,
                'confidence': nlp_confidence,
                'preprocessed': preprocessed,
                'all_intents': all_intents,
                'source': 'nlp_only',
                'routing': 'nlp_only',
                'nlp_intent_used': True
            }

    result['timestamp'] = datetime.now().isoformat()

    # ══════════════════════════════════════════════════════════
    # STEP 3: Suggested Replies (Rekomendasi Chat Lanjutan)
    # ══════════════════════════════════════════════════════════
    result['suggested_replies'] = get_suggested_replies(nlp_intent)

    # ══════════════════════════════════════════════════════════
    # STEP 4: Log interaksi untuk Self-Learning
    # ══════════════════════════════════════════════════════════
    try:
        log_interaction(
            user_message=user_message,
            intent=result.get('intent', 'unknown'),
            confidence=result.get('confidence', 0),
            routing=result.get('routing', 'unknown'),
            preprocessed=preprocessed
        )
    except Exception as e:
        print(f"⚠️ Learning log error: {e}")

    # ══════════════════════════════════════════════════════════
    # STEP 5: Simpan ke Database (Phase 1 SaaS)
    # ══════════════════════════════════════════════════════════
    # Simpan pesan user + bot response ke database.
    # Data ini dipakai untuk analytics dan learning di dashboard.
    # Jika DB tidak tersedia, skip (JSON log tetap jalan di atas).
    # ══════════════════════════════════════════════════════════
    if DB_AVAILABLE:
        try:
            # Get/create conversation untuk session ini
            conv_id = get_or_create_conversation(session_id)

            if conv_id:
                # Simpan pesan user
                save_chat_message(
                    conversation_id=conv_id,
                    sender='user',
                    text=user_message
                )

                # Simpan response bot
                save_chat_message(
                    conversation_id=conv_id,
                    sender='bot',
                    text=result.get('response', ''),
                    intent_tag=result.get('intent'),
                    confidence=result.get('confidence'),
                    source=result.get('source')
                )

                # Simpan ke learning log jika confidence rendah
                if result.get('confidence', 0) < NLP_CONFIDENCE_THRESHOLD:
                    log_learning_to_db(
                        user_message=user_message,
                        bot_response=result.get('response', ''),
                        detected_intent=result.get('intent'),
                        confidence=result.get('confidence')
                    )
        except Exception as e:
            print(f"⚠️ DB logging error (non-fatal): {e}")

    return jsonify(result)


# ============================================================
# Route: Clear Chat History
# ============================================================

@app.route('/api/clear', methods=['POST'])
def clear_chat():
    """Hapus riwayat chat AI untuk sesi tertentu."""
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default')
    gemini.clear_history(session_id)
    return jsonify({'status': 'cleared', 'session_id': session_id})


# ============================================================
# Route: Retrain Model
# ============================================================

@app.route('/api/retrain', methods=['POST'])
def retrain():
    """Retrain model NLP jika dataset diupdate."""
    try:
        engine.retrain()
        return jsonify({
            'status': 'success',
            'message': 'Model berhasil di-retrain!'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# ============================================================
# Route: Auto-Learn (Self-Learning)
# ============================================================

@app.route('/api/auto-learn', methods=['POST'])
def auto_learn():
    """
    Auto-learn: promosikan pattern dari interaction log ke intents.json.
    
    Cara kerja:
    1. Baca learning_log.json
    2. Cari pattern yang sering muncul dengan intent yang sama
    3. Tambahkan ke intents.json sebagai pattern baru
    4. Retrain model otomatis
    
    Ini yang membuat bot semakin pintar seiring waktu!
    Semakin banyak orang chatting → semakin banyak pattern yang dipelajari.
    """
    try:
        log = load_learning_log()
        interactions = log.get('interactions', [])
        
        if not interactions:
            return jsonify({
                'status': 'info',
                'message': 'Belum ada interaksi untuk dipelajari',
                'patterns_added': 0
            })
        
        # Load intents.json saat ini
        intents_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'dataset', 'intents.json'
        )
        with open(intents_path, 'r', encoding='utf-8') as f:
            intents_data = json.load(f)
        
        # Kumpulkan semua pattern yang sudah ada (untuk menghindari duplikat)
        existing_patterns = set()
        intent_map = {}  # tag → index di intents list
        for idx, intent in enumerate(intents_data['intents']):
            intent_map[intent['tag']] = idx
            for p in intent['patterns']:
                existing_patterns.add(p.lower().strip())
        
        # Analisis interaction log:
        # Ambil pattern yang confidence-nya TINGGI (≥70%) → sudah terbukti benar
        # dan BELUM ada di intents.json → perlu ditambahkan
        new_patterns = {}  # intent → [patterns]
        
        for interaction in interactions:
            msg = interaction.get('message', '').strip()
            intent = interaction.get('intent', 'unknown')
            confidence = interaction.get('confidence', 0)
            routing = interaction.get('routing', '')
            
            # Skip jika:
            # - intent unknown
            # - pesan terlalu pendek (< 3 karakter)
            # - pattern sudah ada di training data
            if intent == 'unknown' or len(msg) < 3:
                continue
            if msg.lower() in existing_patterns:
                continue
            # Hanya ambil yang NLP-driven (confidence tinggi) sebagai pattern terpercaya
            # ATAU yang AI-driven tapi intent-nya jelas
            if confidence >= 0.50 and intent in intent_map:
                if intent not in new_patterns:
                    new_patterns[intent] = set()
                new_patterns[intent].add(msg)
        
        # Tambahkan pattern baru ke intents.json
        total_added = 0
        for intent_tag, patterns in new_patterns.items():
            if intent_tag in intent_map:
                idx = intent_map[intent_tag]
                for p in patterns:
                    if p.lower() not in existing_patterns:
                        intents_data['intents'][idx]['patterns'].append(p)
                        existing_patterns.add(p.lower())
                        total_added += 1
        
        if total_added > 0:
            # Simpan intents.json yang sudah diupdate
            with open(intents_path, 'w', encoding='utf-8') as f:
                json.dump(intents_data, f, ensure_ascii=False, indent=2)
            
            # Retrain model dengan pattern baru
            engine.retrain()
            
            # Update stats
            log['stats']['patterns_learned'] = log['stats'].get('patterns_learned', 0) + total_added
            save_learning_log(log)
        
        return jsonify({
            'status': 'success',
            'message': f'{total_added} pattern baru dipelajari dan model di-retrain!',
            'patterns_added': total_added,
            'total_patterns': sum(len(i['patterns']) for i in intents_data['intents']),
            'breakdown': {k: len(v) for k, v in new_patterns.items()}
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# ============================================================
# Route: Learning Statistics
# ============================================================

@app.route('/api/learning-stats', methods=['GET'])
def learning_stats():
    """
    Statistik self-learning: berapa interaksi, berapa yang NLP handle,
    berapa yang AI handle, berapa pattern baru dipelajari.
    """
    log = load_learning_log()
    stats = log.get('stats', {})
    interactions = log.get('interactions', [])
    
    # Hitung distribusi intent
    intent_dist = {}
    for i in interactions:
        intent = i.get('intent', 'unknown')
        intent_dist[intent] = intent_dist.get(intent, 0) + 1
    
    # Hitung rata-rata confidence
    confidences = [i.get('confidence', 0) for i in interactions]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0
    
    # NLP success rate
    nlp_total = stats.get('nlp_driven', 0)
    ai_total = stats.get('ai_driven', 0)
    total = nlp_total + ai_total
    nlp_rate = (nlp_total / total * 100) if total > 0 else 0
    
    return jsonify({
        'total_interactions': stats.get('total', 0),
        'nlp_driven': nlp_total,
        'ai_driven': ai_total,
        'nlp_success_rate': f'{nlp_rate:.1f}%',
        'avg_confidence': round(avg_conf, 4),
        'patterns_learned': stats.get('patterns_learned', 0),
        'intent_distribution': dict(sorted(intent_dist.items(), key=lambda x: -x[1])),
        'recent_interactions': interactions[-5:] if interactions else []
    })


# ============================================================
# Route: Health Check
# ============================================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check — status NLP + AI providers."""
    pool_status = gemini.get_pool_status() if gemini.available else {}
    
    return jsonify({
        'status': 'healthy',
        'service': 'CekatIn Chatbot',
        'architecture': 'hybrid_nlp_ai',
        'nlp_engine': {
            'trained': engine.is_trained,
            'intents_count': len(engine.response_map),
            'confidence_threshold': NLP_CONFIDENCE_THRESHOLD
        },
        'ai_providers': pool_status,
        'mode': 'hybrid' if gemini.available else 'nlp_only',
        'timestamp': datetime.now().isoformat()
    })


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == '__main__':
    if gemini.available:
        mode_str = "� HYBRID (NLP Classification + AI Enhancement)"
    else:
        mode_str = "📊 NLP Only (AI providers tidak tersedia)"
    
    port = int(os.environ.get('PORT', 5000))

    print("\n" + "=" * 55)
    print(f"  🤖 CekatIn Chatbot Server")
    print(f"  📡 Running on http://localhost:{port}")
    print(f"  🔧 Mode: {mode_str}")
    print(f"  📊 NLP Threshold: {NLP_CONFIDENCE_THRESHOLD:.0%}")
    print(f"  📦 Intents: {len(engine.response_map)} categories")
    print("=" * 55 + "\n")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    )
