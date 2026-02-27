"""
CekatIn - NLP Engine (Enhanced with Slang Normalization)
=========================================================
Modul ini berisi seluruh logic untuk Natural Language Processing chatbot:
1. Preprocessing teks Bahasa Indonesia (normalisasi slang, tokenisasi, stemming)
2. Feature extraction menggunakan TF-IDF Vectorizer
3. Intent classification menggunakan Multinomial Naive Bayes
4. Response generation berdasarkan intent yang terdeteksi

Penjelasan Alur Kerja:
----------------------
            User Input
                │
                ▼
        ┌───────────────┐
        │  Preprocessing │  → lowercase, normalisasi slang, hapus tanda baca
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │  Slang Norm.  │  → "brp hrg hp" → "berapa harga handphone"
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   TF-IDF      │  → konversi teks menjadi vektor angka (fitur)
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │  Naive Bayes  │  → klasifikasi intent berdasarkan vektor fitur
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │  Response     │  → pilih respon acak sesuai intent yang terdeteksi
        └───────────────┘

Author: CekatIn Team
"""

import json
import os
import re
import random
import string

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

# ============================================================
# AI AGENT PERSONA
# ============================================================
# Nama dan kepribadian AI Agent chatbot.
# Semua respon akan menggunakan persona ini agar terasa personal.
# ============================================================

AGENT_NAME = "Cika"
AGENT_GREETING = f"Halo kak! 👋 Aku {AGENT_NAME}"
AGENT_INTRO = f"asisten virtual yang siap bantu kamu"

# ============================================================
# SECTION 1: Preprocessing Teks Bahasa Indonesia
# ============================================================
# Penjelasan:
# Preprocessing adalah langkah paling kritikal dalam NLP.
# Teks mentah dari user perlu "dibersihkan" agar model bisa
# memahami makna intinya. Langkahnya:
#   1. Lowercase    → "Halo Kak" → "halo kak"
#   2. Hapus tanda baca → "halo!" → "halo"
#   3. Tokenisasi   → "halo kak" → ["halo", "kak"]
#   4. Hapus stopword → ["halo", "kak"] → ["halo"] (kak = stopword)
#   5. Stemming     → "pembelian" → "beli" (kata dasar)
# ============================================================

# Stopword Bahasa Indonesia (kata-kata yang terlalu umum dan tidak informatif)
# Kita buat manual agar lebih sesuai konteks chatbot Indonesia
STOPWORDS_ID = {
    'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk',
    'pada', 'adalah', 'akan', 'atau', 'juga', 'sudah', 'saya', 'aku',
    'kamu', 'dia', 'mereka', 'kami', 'kita', 'bisa', 'ada', 'tidak',
    'ya', 'dong', 'deh', 'sih', 'nih', 'loh', 'kak', 'min', 'gan',
    'bro', 'sis', 'bang', 'mas', 'mba', 'bu', 'pak', 'om', 'tante',
    'nya', 'kan', 'kok', 'tuh', 'nah', 'lah', 'pun', 'mau', 'minta',
    'tolong', 'coba', 'kalau', 'jika', 'maka', 'jadi', 'karena',
    'sebab', 'oleh', 'atas', 'bawah', 'lagi', 'masih', 'belum',
    'boleh', 'biar', 'aja', 'saja', 'tapi', 'namun', 'sedang',
    'lalu', 'kemudian', 'seperti', 'kayak', 'gitu', 'gini',
    'banget', 'sekali', 'sangat', 'amat', 'paling', 'lebih',
    'kurang', 'agak', 'yg', 'yaa', 'yaaa', 'gak', 'ga', 'apa',
    'gimana', 'bagaimana', 'apakah', 'kapan', 'siapa', 'berapa',
    'iya', 'enggak', 'engga', 'nggak', 'emang', 'emg', 'tau',
    'tahu', 'dong', 'donk'
}


class TextPreprocessor:
    """
    Kelas untuk preprocessing teks Bahasa Indonesia.

    Penjelasan detail:
    - Normalisasi slang/singkatan menggunakan kamus 300+ entri
      Contoh: "brp hrg hp" → "berapa harga handphone"
    - Menggunakan Sastrawi Stemmer untuk mereduksi kata ke bentuk dasar
      Contoh: "pembelian" → "beli", "pengiriman" → "kirim"
    - Sastrawi khusus dibuat untuk Bahasa Indonesia, jadi hasilnya
      lebih akurat dibanding stemmer umum seperti Porter Stemmer
    """

    def __init__(self):
        # ── Load Slang Dictionary ──
        self.slang_dict = self._load_slang_dictionary()
        
        # ── Load Sastrawi Stemmer ──
        try:
            from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
            factory = StemmerFactory()
            if hasattr(factory, 'create_stemmer'):
                self.stemmer = factory.create_stemmer()
            else:
                self.stemmer = factory.createStemmer()
            print("✅ Sastrawi Stemmer berhasil dimuat")
        except ImportError:
            print("⚠️  Sastrawi tidak tersedia, menggunakan fallback sederhana")
            self.stemmer = None
    
    def _load_slang_dictionary(self) -> dict:
        """
        Muat kamus slang/singkatan Bahasa Indonesia.
        
        Kamus ini berisi 300+ mapping singkatan → kata baku:
          "brp"  → "berapa"
          "hp"   → "handphone"
          "gmn"  → "bagaimana"
          "ongkir" → "ongkos kirim"
          dll.
        
        Returns:
            dict: Mapping {slang: kata_baku}
        """
        dict_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'dataset', 'slang_dictionary.json'
        )
        
        try:
            with open(dict_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            slang_dict = data.get('dictionary', {})
            print(f"📚 Kamus slang dimuat: {len(slang_dict)} entri")
            return slang_dict
        except FileNotFoundError:
            print("⚠️  Kamus slang tidak ditemukan, normalisasi dilewati")
            return {}
        except json.JSONDecodeError as e:
            print(f"⚠️  Error parsing slang dictionary: {e}")
            return {}
    
    def _normalize_slang(self, text: str) -> str:
        """
        Normalisasi slang/singkatan menjadi kata baku.
        
        Proses:
        1. Pecah teks menjadi token
        2. Cek setiap token di kamus slang
        3. Jika ditemukan → ganti dengan kata baku
        4. Jika tidak → biarkan apa adanya
        
        Contoh:
            Input:  "brp hrg hp samsung yg murah"
            Output: "berapa harga handphone samsung yang murah"
        """
        if not self.slang_dict:
            return text
        
        tokens = text.split()
        normalized = []
        
        i = 0
        while i < len(tokens):
            # Coba match 2 kata dulu (bigram), contoh: "flash sale" → "promo"
            if i + 1 < len(tokens):
                bigram = tokens[i] + ' ' + tokens[i + 1]
                if bigram in self.slang_dict:
                    normalized.append(self.slang_dict[bigram])
                    i += 2
                    continue
            
            # Match 1 kata (unigram)
            token = tokens[i]
            if token in self.slang_dict:
                normalized.append(self.slang_dict[token])
            else:
                normalized.append(token)
            i += 1
        
        return ' '.join(normalized)
    
    def _normalize_repeated_chars(self, text: str) -> str:
        """
        Normalisasi karakter berulang yang berlebihan.
        
        Contoh:
            "haloo" → "halo"
            "makasiiii" → "makasi"
            "bantuu" → "bantu"
        """
        # Kurangi karakter berulang menjadi max 2
        text = re.sub(r'(.)\1{2,}', r'\1\1', text)
        return text

    def preprocess(self, text: str) -> str:
        """
        Preprocessing pipeline lengkap untuk satu teks.

        Args:
            text: Teks mentah dari user

        Returns:
            Teks yang sudah dibersihkan, dinormalisasi, dan di-stem

        Contoh:
            Input:  "brp hrg hp ASUS yg terbaru??"
            Output: "harga handphone asus baru"
        """
        # Step 1: Lowercase
        text = text.lower().strip()

        # Step 2: Hapus URL (jika ada)
        text = re.sub(r'http\S+|www\.\S+', '', text)

        # Step 3: Hapus emoji dan karakter khusus, tapi pertahankan huruf dan angka
        text = re.sub(r'[^\w\s]', ' ', text)

        # Step 4: Hapus angka yang berdiri sendiri (tapi pertahankan "iphone13")
        text = re.sub(r'\b\d+\b', '', text)

        # Step 5: Normalisasi spasi berlebih
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Step 6: Normalisasi karakter berulang ("halooo" → "haloo")
        text = self._normalize_repeated_chars(text)

        # Step 7: NORMALISASI SLANG/SINGKATAN (langkah baru!)
        # "brp hrg hp" → "berapa harga handphone"
        text = self._normalize_slang(text)

        # Step 8: Tokenisasi (pecah kalimat menjadi kata-kata)
        tokens = text.split()

        # Step 9: Hapus stopword
        tokens = [t for t in tokens if t not in STOPWORDS_ID and len(t) > 1]

        # Step 10: Stemming (jika Sastrawi tersedia)
        if self.stemmer:
            tokens = [self.stemmer.stem(t) for t in tokens]

        return ' '.join(tokens)


# ============================================================
# SECTION 2: NLP Engine (TF-IDF + Naive Bayes)
# ============================================================
# Penjelasan:
#
# TF-IDF (Term Frequency - Inverse Document Frequency):
# ─────────────────────────────────────────────────────
# Teknik untuk mengubah teks menjadi angka (vektor).
# - TF: Seberapa sering kata muncul dalam 1 dokumen
# - IDF: Seberapa jarang kata muncul di seluruh dokumen
# - Kata yang sering di 1 dokumen tapi jarang di dokumen lain
#   → kata tersebut PENTING untuk dokumen itu
#
# Contoh: kata "harga" sering muncul di intent tanya_harga
#          tapi jarang di intent greeting
#          → "harga" punya TF-IDF tinggi untuk tanya_harga
#
# Naive Bayes (Multinomial):
# ─────────────────────────
# Algoritma klasifikasi berdasarkan Teorema Bayes.
# - "Naive" = asumsi setiap fitur (kata) independen satu sama lain
# - "Multinomial" = cocok untuk data frekuensi kata (teks)
# - Sangat cepat dan efisien untuk klasifikasi teks
# - Rumus: P(intent|kata) = P(kata|intent) × P(intent) / P(kata)
# ============================================================


class NLPEngine:
    """
    Engine utama untuk chatbot NLP.

    Komponen:
    1. TextPreprocessor - membersihkan teks input
    2. TfidfVectorizer  - mengubah teks menjadi vektor angka
    3. MultinomialNB     - mengklasifikasikan intent dari vektor
    """

    def __init__(self, dataset_path: str = None, use_database: bool = True,
                 tenant_id: str = None, tenant_slug: str = None):
        """
        Inisialisasi NLP Engine.

        Args:
            dataset_path: Path ke file intents.json (fallback)
            use_database: Jika True, coba muat dari database dulu
            tenant_id: UUID tenant (untuk multi-tenant, load data dari DB)
            tenant_slug: Slug tenant (untuk model path: models/{slug}/)
        """
        self.preprocessor = TextPreprocessor()
        self.use_database = use_database
        self.tenant_id = tenant_id
        self.tenant_slug = tenant_slug

        # Tentukan path default
        base_dir = os.path.dirname(os.path.abspath(__file__))
        if dataset_path is None:
            dataset_path = os.path.join(base_dir, 'dataset', 'intents.json')

        self.dataset_path = dataset_path

        # Model directory: per tenant jika slug ada, global jika tidak
        # Contoh: models/reonshop/chatbot_pipeline.pkl
        if tenant_slug:
            self.model_dir = os.path.join(base_dir, 'models', tenant_slug)
        else:
            self.model_dir = os.path.join(base_dir, 'models')

        # Muat dataset intents (dari DB atau JSON)
        self.intents_data = self._load_dataset()

        # Mapping intent tag → list of responses (template fallback)
        self.response_map = {}
        for intent in self.intents_data['intents']:
            self.response_map[intent['tag']] = intent['responses']

        # ═══════════════════════════════════════════════════
        # KNOWLEDGE BASE INTEGRATION
        # ═══════════════════════════════════════════════════
        # Muat knowledge_base.json agar NLP bisa memberikan
        # respon yang cerdas berdasarkan DATA NYATA toko,
        # bukan hanya template generik dari intents.json.
        # ═══════════════════════════════════════════════════
        kb_path = os.path.join(base_dir, 'dataset', 'knowledge_base.json')
        self.kb = None
        if os.path.exists(kb_path):
            with open(kb_path, 'r', encoding='utf-8') as f:
                self.kb = json.load(f)
            print(f"✅ Knowledge Base dimuat dari: {kb_path}")
        else:
            print(f"⚠️ Knowledge Base tidak ditemukan: {kb_path}")

        # Pipeline ML (TF-IDF + Naive Bayes)
        self.pipeline = None
        self.is_trained = False

        # Coba muat model yang sudah tersimpan, jika tidak ada → train baru
        if not self._load_model():
            self.train()

    def _load_dataset(self) -> dict:
        """
        Muat dataset intent — prioritas dari DATABASE, fallback ke JSON file.
        
        Alur:
        1. Jika use_database=True → coba load dari database
        2. Jika database kosong/error → fallback ke intents.json
        3. Return format yang SAMA persis agar training tidak berubah
        """
        # Coba load dari database dulu
        if self.use_database:
            try:
                from db_service import load_intents_from_db
                # Pass tenant_id agar load data milik tenant tertentu
                db_data = load_intents_from_db(tenant_id=self.tenant_id)
                
                if db_data and len(db_data.get('intents', [])) > 0:
                    tenant_label = f" (tenant: {self.tenant_slug})" if self.tenant_slug else ""
                    print(f"📦 Dataset dimuat dari DATABASE{tenant_label}: {len(db_data['intents'])} intents")
                    return db_data
                else:
                    print("⚠️ Database kosong, fallback ke file JSON...")
            except Exception as e:
                print(f"⚠️ Database tidak tersedia ({e}), fallback ke file JSON...")
        
        # Fallback ke file JSON
        with open(self.dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"📂 Dataset dimuat dari FILE: {len(data['intents'])} intents")
        return data

    def train(self):
        """
        Melatih model NLP dari dataset.

        Proses training:
        1. Ambil semua patterns dari dataset → preprocessing
        2. Buat pipeline TF-IDF + Naive Bayes
        3. Fit pipeline dengan data training
        4. Evaluasi akurasi dengan cross-validation
        5. Simpan model ke file .pkl

        Cross-validation:
        ─────────────────
        Teknik evaluasi dimana data dibagi menjadi k bagian (fold).
        Model dilatih dengan k-1 fold dan diuji dengan 1 fold.
        Ini diulang k kali sehingga setiap fold pernah jadi data uji.
        Hasilnya rata-rata akurasi dari semua fold.
        """
        print("\n🔄 Memulai training model...")
        print("=" * 50)

        # Step 1: Siapkan data training
        X_texts = []  # Teks yang sudah di-preprocess
        y_labels = []  # Label intent

        for intent in self.intents_data['intents']:
            tag = intent['tag']
            for pattern in intent['patterns']:
                processed = self.preprocessor.preprocess(pattern)
                if processed:  # Pastikan teks tidak kosong setelah preprocessing
                    X_texts.append(processed)
                    y_labels.append(tag)

        print(f"📊 Total data training: {len(X_texts)} samples")
        print(f"📊 Total intent classes: {len(set(y_labels))}")

        # Step 2: Buat Pipeline (TF-IDF + Naive Bayes)
        # Pipeline memastikan TF-IDF dan Naive Bayes selalu berurutan
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 2),   # Gunakan unigram dan bigram
                max_features=5000,     # Maksimal 5000 fitur
                sublinear_tf=True,     # Gunakan logarithmic TF
                min_df=1,              # Minimal muncul di 1 dokumen
            )),
            ('classifier', MultinomialNB(
                alpha=0.1,  # Smoothing parameter (Laplace smoothing)
            ))
        ])

        # Step 3: Training
        self.pipeline.fit(X_texts, y_labels)
        self.is_trained = True

        # Step 4: Evaluasi dengan Cross-Validation
        n_splits = min(5, len(set(y_labels)))  # Sesuaikan jumlah fold
        if len(X_texts) >= n_splits * 2:
            cv_scores = cross_val_score(self.pipeline, X_texts, y_labels, cv=n_splits)
            print(f"\n📈 Hasil Cross-Validation ({n_splits}-fold):")
            print(f"   Akurasi rata-rata : {cv_scores.mean():.2%}")
            print(f"   Standar deviasi   : {cv_scores.std():.2%}")
            print(f"   Akurasi per fold  : {[f'{s:.2%}' for s in cv_scores]}")

        # Step 5: Classification Report pada training data
        y_pred = self.pipeline.predict(X_texts)
        print(f"\n📋 Classification Report (Training Data):")
        print(classification_report(y_labels, y_pred, zero_division=0))

        # Step 6: Simpan model
        self._save_model()

        print("=" * 50)
        print("✅ Training selesai!")

    def predict_intent(self, message: str) -> dict:
        """
        Prediksi intent dari pesan user.

        Args:
            message: Pesan mentah dari user

        Returns:
            dict dengan keys:
            - intent: nama intent yang terdeteksi
            - confidence: tingkat keyakinan (0-1)
            - preprocessed: teks setelah preprocessing (untuk debugging)
            - all_intents: probabilitas semua intent (top 3)

        Penjelasan Confidence Score:
        ────────────────────────────
        Confidence score menunjukkan seberapa yakin model dengan prediksinya.
        - > 0.7  → Sangat yakin, respon langsung
        - 0.4-0.7 → Cukup yakin, respon dengan catatan
        - < 0.4  → Kurang yakin, fallback ke respon default
        """
        if not self.is_trained:
            return {
                'intent': 'unknown',
                'confidence': 0.0,
                'preprocessed': message,
                'all_intents': []
            }

        # Preprocessing
        processed = self.preprocessor.preprocess(message)

        if not processed:
            return {
                'intent': 'unknown',
                'confidence': 0.0,
                'preprocessed': '',
                'all_intents': []
            }

        # Prediksi
        predicted_intent = self.pipeline.predict([processed])[0]

        # Ambil probabilitas semua kelas
        proba = self.pipeline.predict_proba([processed])[0]
        classes = self.pipeline.classes_

        # Sort by probability (descending)
        intent_proba = sorted(
            zip(classes, proba),
            key=lambda x: x[1],
            reverse=True
        )

        # Top 3 intents
        top_intents = [
            {'intent': intent, 'confidence': round(float(conf), 4)}
            for intent, conf in intent_proba[:3]
        ]

        confidence = float(max(proba))

        return {
            'intent': predicted_intent,
            'confidence': round(confidence, 4),
            'preprocessed': processed,
            'all_intents': top_intents
        }

    def _search_products(self, message: str, limit: int = 5) -> list:
        """
        Cari produk di knowledge base berdasarkan kata kunci dari pesan user.
        
        Cara kerja:
        1. Pecah pesan jadi kata-kata (keywords)
        2. Cari produk yang nama-nya mengandung keyword tersebut
        3. Return list produk yang cocok (sorted by relevance)
        
        Args:
            message: Pesan user (sudah lowercase)
            limit: Maksimal produk yang dikembalikan
            
        Returns:
            List of dict produk yang cocok
        """
        if not self.kb:
            return []
        
        msg_lower = message.lower()
        results = []
        
        # Kata-kata yang diabaikan saat search (stop words)
        skip_words = {
            'harga', 'berapa', 'spek', 'spesifikasi', 'ada', 'gak', 'gk',
            'yang', 'apa', 'saja', 'aja', 'mau', 'cari', 'lihat', 'dong',
            'kak', 'min', 'ya', 'nih', 'deh', 'sih', 'tuh', 'gimana',
            'bagus', 'murah', 'terbaik', 'ready', 'stok', 'stock',
            'hp', 'handphone', 'smartphone', 'produk', 'beli', 'jual',
            'rekomendasi', 'rekomen', 'suggest', 'saran', 'saranin',
            'di', 'ke', 'dari', 'untuk', 'dengan', 'dan', 'atau',
            'tolong', 'bisa', 'boleh', 'minta', 'kasih', 'tanya',
            'dibawah', 'diatas', 'sekitar', 'kisaran', 'range',
            'jutaan', 'juta', 'ribu', 'rp', 'rupiah', 'budget',
        }
        
        # Extract keywords dari pesan
        keywords = [w for w in msg_lower.split() if w not in skip_words and len(w) > 1]
        
        # Cek apakah ada harga range di pesan
        price_max = None
        for word in msg_lower.split():
            try:
                num = int(''.join(c for c in word if c.isdigit()))
                if num > 0:
                    # Jika angka kecil (1-50), kemungkinan jutaan
                    if num <= 50:
                        price_max = num * 1_000_000
                    else:
                        price_max = num
                    break
            except ValueError:
                continue
        
        for kategori in self.kb.get('produk', []):
            for produk in kategori.get('daftar', []):
                nama = produk.get('nama', '').lower()
                score = 0
                
                # Score berdasarkan keyword match
                for kw in keywords:
                    if kw in nama:
                        score += 2  # exact keyword match di nama
                    elif any(kw in part for part in nama.split()):
                        score += 1  # partial match
                
                # Jika ada price filter
                if price_max and produk.get('harga', 0) <= price_max:
                    if score == 0:
                        score = 0.5  # Masuk budget tapi nama gak match
                    else:
                        score += 1  # Bonus karena masuk budget
                elif price_max and produk.get('harga', 0) > price_max:
                    score = 0  # Over budget, skip
                
                if score > 0:
                    results.append({
                        **produk,
                        'kategori': kategori['kategori'],
                        '_score': score
                    })
        
        # Sort by score (highest first), then by harga (lowest first)
        results.sort(key=lambda x: (-x['_score'], x.get('harga', 0)))
        return results[:limit]

    def _format_harga(self, harga: int) -> str:
        """Format angka harga ke format Rupiah: 12500000 → Rp 12.500.000"""
        return f"Rp {harga:,.0f}".replace(',', '.')

    def get_kb_context(self, intent: str, message: str) -> str:
        """
        Ambil data Knowledge Base yang RELEVAN berdasarkan intent dan pesan user.
        
        Method ini TIDAK menyusun jawaban — hanya mengekstrak data mentah
        dari KB yang relevan. Data ini akan dikirim ke Gemini agar AI bisa
        generate jawaban yang natural, akurat, dan bervariasi.
        
        Penjelasan:
        ──────────
        Berbeda dengan _generate_kb_response() yang return template final,
        method ini return DATA MENTAH dalam format teks terstruktur.
        Gemini akan "menghidupkan" data ini jadi jawaban natural.
        
        Contoh output:
        ──────────────
        Intent tanya_produk, message "hp apa aja":
        → "INTENT: tanya_produk
           PRODUK DITEMUKAN:
           - Samsung Galaxy A25 5G | Rp 3.199.000 | RAM 8GB, 128GB
           - Xiaomi Redmi 13 | Rp 1.999.000 | AMOLED 6.79"
           ..."
           
        Args:
            intent: Intent yang terdeteksi oleh NLP (tanya_harga, tanya_produk, dll)
            message: Pesan asli user untuk pencarian produk spesifik
            
        Returns:
            String berisi data KB yang relevan, atau empty string jika tidak ada
        """
        if not self.kb:
            return ""
        
        parts = [f"INTENT: {intent}"]
        
        # ── TANYA HARGA ──────────────────────────────────
        if intent == 'tanya_harga':
            products = self._search_products(message, limit=5)
            if products:
                parts.append("PRODUK & HARGA DITEMUKAN:")
                for p in products:
                    parts.append(
                        f"  - {p['nama']} | {self._format_harga(p['harga'])} | "
                        f"Spek: {p.get('spesifikasi', '-')} | "
                        f"Stok: {p.get('stok', '-')} | "
                        f"Garansi: {p.get('garansi', '-')}"
                    )
            else:
                parts.append("RANGE HARGA PER KATEGORI:")
                for kat in self.kb.get('produk', []):
                    daftar = kat.get('daftar', [])
                    if daftar:
                        prices = [p['harga'] for p in daftar if p.get('harga')]
                        if prices:
                            parts.append(f"  - {kat['kategori']}: {self._format_harga(min(prices))} — {self._format_harga(max(prices))}")
        
        # ── TANYA PRODUK ─────────────────────────────────
        elif intent == 'tanya_produk':
            products = self._search_products(message, limit=8)
            if products:
                parts.append("PRODUK DITEMUKAN:")
                for p in products:
                    stok = p.get('stok', '-')
                    parts.append(f"  - {p['nama']} | {self._format_harga(p['harga'])} | Stok: {stok}")
            else:
                parts.append("KATEGORI TERSEDIA:")
                for kat in self.kb.get('produk', []):
                    parts.append(f"  - {kat['kategori']} ({len(kat.get('daftar', []))} produk)")
        
        # ── TANYA SPESIFIKASI ────────────────────────────
        elif intent == 'tanya_spesifikasi':
            products = self._search_products(message, limit=3)
            if products:
                parts.append("SPESIFIKASI PRODUK:")
                for p in products:
                    parts.append(f"  - {p['nama']}:")
                    parts.append(f"    Harga: {self._format_harga(p['harga'])}")
                    parts.append(f"    Spek: {p.get('spesifikasi', '-')}")
                    parts.append(f"    Rating: {p.get('rating', '-')}/100")
                    parts.append(f"    Stok: {p.get('stok', '-')}")
                    parts.append(f"    Garansi: {p.get('garansi', '-')}")
                    if p.get('warna'):
                        parts.append(f"    Warna: {', '.join(p['warna'])}")
        
        # ── TANYA GARANSI ────────────────────────────────
        elif intent == 'tanya_garansi':
            products = self._search_products(message, limit=3)
            if products:
                parts.append("GARANSI PRODUK:")
                for p in products:
                    parts.append(f"  - {p['nama']}: {p.get('garansi', '-')}")
            garansi_info = self.kb.get('kebijakan', {}).get('garansi', {})
            if garansi_info:
                parts.append("KEBIJAKAN GARANSI:")
                parts.append(f"  Resmi: {garansi_info.get('durasi_resmi', garansi_info.get('garansi_resmi', '-'))}")
                parts.append(f"  Toko: {garansi_info.get('garansi_toko', '-')}")
                parts.append(f"  Klaim: {garansi_info.get('cara_klaim', '-')}")
        
        # ── TANYA LOKASI ─────────────────────────────────
        elif intent == 'tanya_lokasi':
            toko = self.kb.get('toko', {})
            alamat = toko.get('alamat', {})
            kontak = toko.get('kontak', {})
            parts.append("INFO LOKASI TOKO:")
            parts.append(f"  Nama: {toko.get('nama', '-')}")
            parts.append(f"  Alamat: {alamat.get('jalan', '-')}, {alamat.get('kecamatan', '')}, {alamat.get('kabupaten', '')} {alamat.get('kode_pos', '')}")
            parts.append(f"  Patokan: {alamat.get('patokan', '-')}")
            parts.append(f"  WA: {kontak.get('whatsapp', '-')}")
        
        # ── TANYA JAM BUKA ───────────────────────────────
        elif intent == 'tanya_jam_buka':
            jam = self.kb.get('toko', {}).get('jam_operasional', {})
            parts.append("JAM OPERASIONAL:")
            parts.append(f"  Senin-Sabtu: {jam.get('senin_sabtu', '-')}")
            parts.append(f"  Minggu: {jam.get('minggu', '-')}")
            parts.append(f"  Libur: {jam.get('libur_nasional', '-')}")
            parts.append(f"  Catatan: {jam.get('catatan', '-')}")
        
        # ── TANYA PENGIRIMAN ─────────────────────────────
        elif intent == 'tanya_pengiriman':
            kirim = self.kb.get('kebijakan', {}).get('pengiriman', {})
            if kirim:
                parts.append("INFO PENGIRIMAN:")
                jasa = kirim.get('jasa_pengiriman', kirim.get('kurir', []))
                if isinstance(jasa, list):
                    parts.append(f"  Kurir: {', '.join(jasa)}")
                parts.append(f"  Ongkir: {kirim.get('ongkir', kirim.get('gratis_ongkir', '-'))}")
                parts.append(f"  Estimasi: {kirim.get('estimasi', '-')}")
                parts.append(f"  Area gratis: {kirim.get('area_gratis', kirim.get('gratis_ongkir', '-'))}")
        
        # ── TANYA PEMBAYARAN ─────────────────────────────
        elif intent == 'tanya_pembayaran':
            bayar = self.kb.get('kebijakan', {}).get('pembayaran', {})
            if bayar:
                parts.append("METODE PEMBAYARAN:")
                metode = bayar.get('metode', [])
                if isinstance(metode, list):
                    for m in metode:
                        if isinstance(m, dict):
                            parts.append(f"  - {m.get('nama', m)}")
                        else:
                            parts.append(f"  - {m}")
                parts.append(f"  Catatan: {bayar.get('catatan', '-')}")
        
        # ── TANYA PROMO ──────────────────────────────────
        elif intent == 'tanya_promo':
            promo = self.kb.get('kebijakan', {}).get('promo_saat_ini', [])
            if promo:
                parts.append("PROMO AKTIF:")
                if isinstance(promo, list):
                    for p in promo:
                        if isinstance(p, dict):
                            parts.append(f"  - {p.get('nama', '')}: {p.get('deskripsi', '')}")
                        else:
                            parts.append(f"  - {p}")
                elif isinstance(promo, str):
                    parts.append(f"  {promo}")
            else:
                parts.append("PROMO: Tidak ada promo saat ini")
        
        # ── GREETING ─────────────────────────────────────
        elif intent == 'greeting':
            toko = self.kb.get('toko', {})
            parts.append(f"TOKO: {toko.get('nama', '-')}")
            parts.append(f"TAGLINE: {toko.get('tagline', '-')}")
        
        return '\n'.join(parts) if len(parts) > 1 else ""

    def _generate_kb_response(self, intent: str, message: str) -> str:
        """
        Generate respon cerdas menggunakan data dari Knowledge Base.
        
        Berbeda dengan response_map (template generik), fungsi ini
        mencari data NYATA di knowledge base dan menyusun jawaban
        yang informatif dan relevan.
        
        Args:
            intent: Intent yang terdeteksi (tanya_harga, tanya_produk, dll)
            message: Pesan asli dari user
            
        Returns:
            String respon yang informatif, atau None jika tidak ada data
        """
        if not self.kb:
            return None
        
        msg_lower = message.lower()
        
        # ── TANYA HARGA ──────────────────────────────────
        if intent == 'tanya_harga':
            products = self._search_products(message, limit=5)
            if products:
                if len(products) == 1:
                    p = products[0]
                    return (
                        f"Harga {p['nama']} adalah {self._format_harga(p['harga'])} 💰\n\n"
                        f"📋 Spek: {p.get('spesifikasi', '-')}\n"
                        f"📦 Stok: {p.get('stok', 'Hubungi toko')}\n"
                        f"🛡️ Garansi: {p.get('garansi', '-')}\n\n"
                        f"Mau tau lebih detail atau mau beli kak? Tanya aja ke {AGENT_NAME} 😊"
                    )
                else:
                    lines = [f"{AGENT_NAME} kasih daftar harganya ya kak 💰:\n"]
                    for p in products:
                        lines.append(f"• {p['nama']} — {self._format_harga(p['harga'])}")
                    lines.append(f"\nTotal {len(products)} produk ditemukan. Mau lihat spek yang mana kak? 😊")
                    return '\n'.join(lines)
            # Tidak ada produk spesifik, kasih range harga per kategori
            lines = ["Berikut kisaran harga produk kami 💰:\n"]
            for kat in self.kb.get('produk', []):
                daftar = kat.get('daftar', [])
                if daftar:
                    prices = [p['harga'] for p in daftar if p.get('harga')]
                    if prices:
                        lines.append(f"• {kat['kategori']}: {self._format_harga(min(prices))} — {self._format_harga(max(prices))}")
            lines.append(f"\nSebutkan nama produk spesifik biar {AGENT_NAME} kasih harga pastinya ya kak! 😊")
            return '\n'.join(lines)
        
        # ── TANYA PRODUK ─────────────────────────────────
        elif intent == 'tanya_produk':
            products = self._search_products(message, limit=8)
            if products:
                lines = [f"{AGENT_NAME} temukan produk berikut 📱:\n"]
                for p in products:
                    stok_icon = "✅" if "tersedia" in p.get('stok', '').lower() else "⚠️"
                    lines.append(f"• {p['nama']} — {self._format_harga(p['harga'])} {stok_icon}")
                lines.append(f"\nMau lihat spek atau harga detailnya kak? Tanya aja ke {AGENT_NAME}! 😊")
                return '\n'.join(lines)
            # Tidak ada match, tampilkan kategori
            lines = [f"Toko {self.kb.get('toko', {}).get('nama', 'Kami')} menyediakan produk elektronik lengkap 🛒:\n"]
            for kat in self.kb.get('produk', []):
                lines.append(f"• {kat['kategori']} ({len(kat.get('daftar', []))} produk)")
            lines.append(f"\nSebutkan brand atau tipe yang dicari ya kak, biar {AGENT_NAME} cariin! 😊")
            return '\n'.join(lines)
        
        # ── TANYA SPESIFIKASI ────────────────────────────
        elif intent == 'tanya_spesifikasi':
            products = self._search_products(message, limit=3)
            if products:
                lines = []
                for p in products:
                    lines.append(f"📋 {p['nama']}:")
                    lines.append(f"   Spek: {p.get('spesifikasi', '-')}")
                    lines.append(f"   Harga: {self._format_harga(p['harga'])}")
                    lines.append(f"   Rating: ⭐ {p.get('rating', '-')}/100")
                    lines.append(f"   Stok: {p.get('stok', '-')}")
                    lines.append("")
                lines.append(f"Mau tanya lagi kak? {AGENT_NAME} siap bantu! 😊")
                return '\n'.join(lines)
            return None  # Fallback ke template
        
        # ── TANYA GARANSI ────────────────────────────────
        elif intent == 'tanya_garansi':
            products = self._search_products(message, limit=3)
            if products:
                lines = ["Informasi garansi produk 🛡️:\n"]
                for p in products:
                    lines.append(f"• {p['nama']}: {p.get('garansi', 'Hubungi toko')}")
                return '\n'.join(lines)
            # Fallback ke kebijakan garansi
            garansi_info = self.kb.get('kebijakan', {}).get('garansi', {})
            if garansi_info:
                return (
                    f"Kebijakan garansi kami 🛡️:\n\n"
                    f"• Durasi: {garansi_info.get('durasi_resmi', '1 tahun')}\n"
                    f"• Cakupan: {garansi_info.get('cakupan', 'Kerusakan pabrik')}\n"
                    f"• Klaim: {garansi_info.get('cara_klaim', 'Bawa ke toko dengan nota')}\n\n"
                    f"Mau tanya lagi kak? {AGENT_NAME} siap bantu! 😊"
                )
            return None
        
        # ── TANYA LOKASI ─────────────────────────────────
        elif intent == 'tanya_lokasi':
            toko = self.kb.get('toko', {})
            alamat = toko.get('alamat', {})
            kontak = toko.get('kontak', {})
            return (
                f"📍 Alamat {toko.get('nama', 'Toko Kami')}:\n\n"
                f"{alamat.get('jalan', '-')}\n"
                f"{alamat.get('kelurahan', '')}, {alamat.get('kecamatan', '')}, "
                f"{alamat.get('kabupaten', '')} {alamat.get('kode_pos', '')}\n"
                f"{alamat.get('provinsi', '')}\n\n"
                f"📌 Patokan: {alamat.get('patokan', '-')}\n"
                f"📞 WA: {kontak.get('whatsapp', '-')}\n\n"
                f"{AGENT_NAME} tunggu kedatangannya ya kak! 😊"
            )
        
        # ── TANYA JAM BUKA ───────────────────────────────
        elif intent == 'tanya_jam_buka':
            jam = self.kb.get('toko', {}).get('jam_operasional', {})
            return (
                f"Jam operasional {self.kb.get('toko', {}).get('nama', 'Toko Kami')} ⏰:\n\n"
                f"📅 Senin-Sabtu: {jam.get('senin_sabtu', '-')}\n"
                f"📅 Minggu: {jam.get('minggu', '-')}\n"
                f"📅 Libur Nasional: {jam.get('libur_nasional', '-')}\n"
                f"📝 Catatan: {jam.get('catatan', '-')}\n\n"
                f"{AGENT_NAME} tunggu kedatangannya ya kak! 😊"
            )
        
        # ── TANYA PENGIRIMAN ─────────────────────────────
        elif intent == 'tanya_pengiriman':
            kirim = self.kb.get('kebijakan', {}).get('pengiriman', {})
            if kirim:
                jasa = ', '.join(kirim.get('jasa_pengiriman', ['JNE', 'J&T', 'SiCepat']))
                return (
                    f"Info pengiriman 🚚:\n\n"
                    f"📦 Jasa kirim: {jasa}\n"
                    f"💰 Ongkir: {kirim.get('ongkir', 'Tergantung lokasi')}\n"
                    f"⏱️ Estimasi: {kirim.get('estimasi', '1-3 hari kerja')}\n"
                    f"📍 Area: {kirim.get('area_gratis', 'Cianjur kota gratis ongkir')}\n\n"
                    f"Mau tanya lagi kak? {AGENT_NAME} siap bantu! 😊"
                )
            return None
        
        # ── TANYA PEMBAYARAN ─────────────────────────────
        elif intent == 'tanya_pembayaran':
            bayar = self.kb.get('kebijakan', {}).get('pembayaran', {})
            if bayar:
                metode = bayar.get('metode', [])
                if isinstance(metode, list):
                    metode_str = '\n'.join([f"  • {m}" for m in metode])
                else:
                    metode_str = str(metode)
                return (
                    f"Metode pembayaran yang tersedia 💳:\n\n"
                    f"{metode_str}\n\n"
                    f"💡 {bayar.get('catatan', 'Pembayaran bisa dilakukan di toko atau transfer')}\n\n"
                    f"Mau tanya lagi kak? {AGENT_NAME} siap bantu! 😊"
                )
            return None
        
        # ── TANYA PROMO ──────────────────────────────────
        elif intent == 'tanya_promo':
            promo = self.kb.get('kebijakan', {}).get('promo_saat_ini', [])
            if promo:
                if isinstance(promo, list) and promo:
                    lines = ["Promo yang sedang berlaku 🎉:\n"]
                    for p in promo:
                        if isinstance(p, dict):
                            lines.append(f"• {p.get('nama', '')} — {p.get('deskripsi', '')}")
                        else:
                            lines.append(f"• {p}")
                    lines.append(f"\nJangan sampai kelewatan ya kak! — {AGENT_NAME} 😊")
                    return '\n'.join(lines)
                elif isinstance(promo, str):
                    return f"Promo saat ini 🎉:\n{promo}\n\nJangan sampai kelewatan ya kak! — {AGENT_NAME} 😊"
            return (
                f"Saat ini belum ada promo khusus kak 😊\n\n"
                f"Tapi harga kami selalu kompetitif! "
                f"Follow Instagram kami untuk info promo terbaru ya! — {AGENT_NAME} 🎉"
            )
        
        # ── GREETING ─────────────────────────────────────
        elif intent == 'greeting':
            toko = self.kb.get('toko', {})
            return (
                f"{AGENT_GREETING}, {AGENT_INTRO} di {toko.get('nama', 'Toko Kami')}! 😊\n\n"
                f"{AGENT_NAME} bisa bantu kamu seputar:\n"
                f"• 📱 Produk & Spesifikasi\n"
                f"• 💰 Harga & Promo\n"
                f"• 🚚 Pengiriman & Pembayaran\n"
                f"• 🛡️ Garansi & Retur\n"
                f"• 📍 Lokasi & Jam Buka\n\n"
                f"Tanya apa aja ya kak, {AGENT_NAME} siap bantu! 😊"
            )
        
        # Intent lain: return None agar pakai template dari intents.json
        return None

    def get_response(self, message: str) -> dict:
        """
        Dapatkan respon chatbot untuk pesan user.

        Alur respon (dari paling cerdas ke paling sederhana):
        1. Knowledge Base response → jawaban berdasarkan DATA NYATA
        2. Template response → jawaban template dari intents.json
        3. Fallback → pesan default jika semua gagal

        Args:
            message: Pesan mentah dari user

        Returns:
            dict dengan keys:
            - response: teks respon chatbot
            - intent: intent yang terdeteksi
            - confidence: tingkat keyakinan
            - preprocessed: teks setelah preprocessing
        """
        # Prediksi intent
        prediction = self.predict_intent(message)

        intent = prediction['intent']
        confidence = prediction['confidence']

        # Tentukan respon berdasarkan confidence
        if confidence >= 0.35 and intent in self.response_map:
            # Coba generate respon cerdas dari Knowledge Base
            kb_response = self._generate_kb_response(intent, message)
            if kb_response:
                response = kb_response
            else:
                # KB tidak punya data → pakai template dari intents.json
                response = random.choice(self.response_map[intent])
        else:
            # Confidence rendah → fallback response
            response = (
                f"Maaf kak, {AGENT_NAME} belum paham pertanyaannya 😅 "
                f"Coba sampaikan dengan cara lain ya, atau hubungi CS kami di:\n\n"
                f"📞 WhatsApp: {self.kb.get('toko', {}).get('kontak', {}).get('whatsapp', '0812-3456-7890') if self.kb else '0812-3456-7890'}\n\n"
                f"{AGENT_NAME} bisa bantu seputar: produk, harga, lokasi, jam buka, "
                f"pengiriman, pembayaran, garansi, dan promo!"
            )
            intent = 'unknown'

        return {
            'response': response,
            'intent': intent,
            'confidence': prediction['confidence'],
            'preprocessed': prediction['preprocessed'],
            'all_intents': prediction['all_intents']
        }

    def _save_model(self):
        """Simpan model terlatih ke file .pkl untuk penggunaan selanjutnya."""
        os.makedirs(self.model_dir, exist_ok=True)
        model_path = os.path.join(self.model_dir, 'chatbot_pipeline.pkl')
        joblib.dump(self.pipeline, model_path)
        print(f"💾 Model disimpan ke: {model_path}")

    def _load_model(self) -> bool:
        """
        Muat model terlatih dari file .pkl.
        Returns True jika berhasil, False jika file tidak ada.
        """
        model_path = os.path.join(self.model_dir, 'chatbot_pipeline.pkl')
        if os.path.exists(model_path):
            try:
                self.pipeline = joblib.load(model_path)
                self.is_trained = True
                print(f"📂 Model terlatih dimuat dari: {model_path}")
                return True
            except Exception as e:
                print(f"⚠️  Gagal memuat model: {e}")
                return False
        return False

    def retrain(self):
        """Force retrain model (hapus model lama dan train ulang)."""
        model_path = os.path.join(self.model_dir, 'chatbot_pipeline.pkl')
        if os.path.exists(model_path):
            os.remove(model_path)
        self.train()


# ============================================================
# SECTION 3: Testing Mandiri
# ============================================================
# Jalankan file ini langsung untuk test engine secara interaktif:
#   python nlp_engine.py
# ============================================================

if __name__ == '__main__':
    print("=" * 60)
    print("  CekatIn NLP Engine - Mode Testing Interaktif")
    print("=" * 60)

    # Inisialisasi engine (otomatis train jika belum ada model)
    engine = NLPEngine()

    print("\n💬 Ketik pesan untuk test chatbot (ketik 'quit' untuk keluar)")
    print("-" * 60)

    while True:
        user_input = input("\n👤 Anda: ").strip()
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("👋 Sampai jumpa!")
            break

        result = engine.get_response(user_input)

        print(f"\n🤖 Bot: {result['response']}")
        print(f"\n   📊 Debug Info:")
        print(f"   ├── Intent     : {result['intent']}")
        print(f"   ├── Confidence : {result['confidence']:.2%}")
        print(f"   ├── Preprocessed: '{result['preprocessed']}'")
        print(f"   └── Top Intents:")
        for i, top in enumerate(result['all_intents']):
            prefix = "       ├──" if i < len(result['all_intents']) - 1 else "       └──"
            print(f"   {prefix} {top['intent']}: {top['confidence']:.2%}")
