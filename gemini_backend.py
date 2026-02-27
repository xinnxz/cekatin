"""
CekatIn - AI Backend (Multi-Provider + Key Rotation)
======================================================
Modul ini mengintegrasikan MULTIPLE AI Provider sebagai engine
untuk menghasilkan respon chatbot yang natural layaknya CS manusia.

Architecture: Multi-Provider with Key Rotation
───────────────────────────────────────────────
  Provider 1: Google Gemini (Primary — kualitas terbaik)
  Provider 2: Groq / Llama  (Fallback — limit besar, cepat)

  Alur:
  ─────
  Request masuk → Gemini (primary)
       ↓ Rate limit?
  Rotasi key Gemini (key pool)
       ↓ Semua key Gemini habis?
  Fallback ke Groq (14.400 RPD gratis!)
       ↓ Groq juga gagal?
  Fallback ke NLP Engine (offline)

Kapasitas Gratis:
  Gemini: N keys × 20 RPD
  Groq  : 14.400 RPD
  Total : ~14.400+ request/hari — GRATIS!

Author: CekatIn Team
"""

import os
import json
import time
import re

# ============================================================
# Load Knowledge Base dari JSON
# ============================================================

def load_knowledge_base():
    """
    Baca knowledge_base.json dan konversi jadi teks instruksi untuk AI.
    Data ini menjadi "otak" chatbot — semua jawaban berdasarkan data ini.
    """
    kb_path = os.path.join(os.path.dirname(__file__), 'dataset', 'knowledge_base.json')
    
    try:
        with open(kb_path, 'r', encoding='utf-8') as f:
            kb = json.load(f)
        print(f"✅ Knowledge Base dimuat dari: {kb_path}")
    except FileNotFoundError:
        print(f"⚠️  Knowledge Base tidak ditemukan: {kb_path}")
        return _get_default_context()
    except json.JSONDecodeError as e:
        print(f"⚠️  Error parsing knowledge_base.json: {e}")
        return _get_default_context()
    
    # ── Bangun System Instruction dari data JSON ──
    parts = []
    
    toko = kb.get('toko', {})
    kontak = toko.get('kontak', {})
    alamat = toko.get('alamat', {})
    jam = toko.get('jam_operasional', {})
    
    # ══════════════════════════════════════════════════════════
    # PERSONA & ATURAN — ini yang bikin respon terasa "manusia"
    # ══════════════════════════════════════════════════════════
    parts.append(f"""
IDENTITAS:
Kamu adalah "Cika", asisten virtual dari {toko.get('nama', 'Toko')} — {toko.get('tagline', '')}.
Nama lengkap sistem ini CekatIn, tapi kamu dipanggil "Cika" oleh semua orang.

PERSONA & GAYA BICARA:
- Kamu bicara seperti CS toko online profesional yang RAMAH dan CEKATAN
- Gunakan Bahasa Indonesia casual-formal (seperti chat WhatsApp ke customer)
- Panggil customer "kak" atau "Kakak"
- Gunakan emoji secukupnya (1-3 per pesan, jangan berlebihan)
- Jawab SINGKAT tapi LENGKAP (2-4 paragraf maksimal)
- Jangan gunakan format markdown seperti **bold** atau bullet list — tulis secara natural seperti chat biasa
- Kalau customer tanya produk, langsung kasih info lengkap (harga, spesifikasi, warna, stok)
- Kalau customer bingung, tawarkan rekomendasi
- Selalu akhiri dengan tawaran bantuan lanjutan
- Bisa merespon sapaan, basa-basi, dan small talk secara natural

CONTOH GAYA CHAT:
Customer: "ada hp murah ga?"
CekatIn: "Ada dong kak! 📱 Kalau cari HP budget-friendly, kami punya OPPO A18 cuma Rp 1.799.000 — udah 4/128GB. Atau Xiaomi Redmi 13 di Rp 1.999.000, layar AMOLED 6.79 inci. Kalau mau yang agak lebih oke, Samsung Galaxy A15 di Rp 2.499.000 udah 6/128GB. Kakak ada preferensi merk tertentu? Biar aku bantu cariin yang paling pas! 😊"

Customer: "bisa cicilan ga?"
CekatIn: "Bisa banget kak! Kami terima cicilan via Kredivo, Akulaku, sama kartu kredit. Minimal pembelian Rp 1.000.000 ya. Atau kalau mau DP dulu juga bisa, nanti tinggal hubungi CS kami di WhatsApp 0878-3456-8565 buat atur cicilannya. Mau cicilan untuk produk yang mana kak?"

ATURAN WAJIB:
1. HANYA jawab berdasarkan data di bawah ini — JANGAN mengarang informasi
2. Jika informasi TIDAK ADA dalam data, jawab jujur: "Wah, untuk detail itu aku belum punya info lengkapnya nih kak. Coba hubungi CS kami langsung di WhatsApp {kontak.get('whatsapp', '')} ya, biar bisa dibantu lebih detail! 😊"
3. JANGAN pernah buat harga, spesifikasi, atau informasi fiktif
4. Jika customer menyapa (halo, hi, selamat pagi, dll), balas dengan ramah dan perkenalkan diri
5. Jika customer mengucapkan terima kasih atau pamit, jawab dengan hangat
6. Jawab dalam Bahasa Indonesia SELALU
""")
    
    # Info Toko
    parts.append(f"""
═══ INFORMASI TOKO ═══
Nama: {toko.get('nama', '')}
Alamat: {alamat.get('jalan', '')}, {alamat.get('kecamatan', '')}, {alamat.get('kabupaten', '')}, {alamat.get('provinsi', '')} {alamat.get('kode_pos', '')}
Patokan: {alamat.get('patokan', '')}
WhatsApp: {kontak.get('whatsapp', '')}
Telepon: {kontak.get('telepon', '')}
Email: {kontak.get('email', '')}
Instagram: {kontak.get('instagram', '')}
Tokopedia: {kontak.get('tokopedia', '')}
Shopee: {kontak.get('shopee', '')}
Jam Buka Senin-Sabtu: {jam.get('senin_sabtu', '')}
Jam Buka Minggu: {jam.get('minggu', '')}
Libur: {jam.get('libur_nasional', '')}
Catatan: {jam.get('catatan', '')}
Tentang: {toko.get('tentang', '')}
""")
    
    # Produk
    produk_list = kb.get('produk', [])
    parts.append("\n═══ DATABASE PRODUK ═══")
    
    for kategori_data in produk_list:
        kategori = kategori_data.get('kategori', '')
        parts.append(f"\n📦 KATEGORI: {kategori}")
        parts.append("-" * 40)
        
        for item in kategori_data.get('daftar', []):
            parts.append(f"  Nama       : {item.get('nama', '')}")
            parts.append(f"  Harga      : Rp {item.get('harga', 0):,.0f}".replace(',', '.'))
            parts.append(f"  Spesifikasi: {item.get('spesifikasi', '')}")
            if 'warna' in item:
                parts.append(f"  Warna      : {', '.join(item['warna'])}")
            parts.append(f"  Stok       : {item.get('stok', 'Hubungi CS')}")
            parts.append(f"  Garansi    : {item.get('garansi', '')}")
            if item.get('termasuk_pasang'):
                parts.append(f"  Bonus      : Gratis pemasangan")
            parts.append("")
    
    # Kebijakan
    kebijakan = kb.get('kebijakan', {})
    
    garansi = kebijakan.get('garansi', {})
    if garansi:
        parts.append("\n═══ KEBIJAKAN GARANSI ═══")
        parts.append(f"Garansi Resmi: {garansi.get('garansi_resmi', '')}")
        parts.append(f"Garansi Toko: {garansi.get('garansi_toko', '')}")
        parts.append(f"Cara Klaim: {garansi.get('cara_klaim', '')}")
        syarat = garansi.get('syarat_klaim', [])
        if syarat:
            parts.append("Syarat Klaim:")
            for s in syarat:
                parts.append(f"  • {s}")
        tidak = garansi.get('yang_tidak_ditanggung', [])
        if tidak:
            parts.append("Yang Tidak Ditanggung:")
            for t in tidak:
                parts.append(f"  • {t}")
    
    pengiriman = kebijakan.get('pengiriman', {})
    if pengiriman:
        parts.append("\n═══ KEBIJAKAN PENGIRIMAN ═══")
        parts.append(f"Kurir: {', '.join(pengiriman.get('kurir', []))}")
        lokal = pengiriman.get('lokal', {})
        parts.append(f"Lokal: {lokal.get('layanan', '')} — {lokal.get('area', '')}")
        parts.append(f"Gratis Ongkir: {pengiriman.get('gratis_ongkir', '')}")
        parts.append(f"Subsidi Ongkir: {pengiriman.get('subsidi_ongkir', '')}")
        estimasi = pengiriman.get('estimasi', {})
        for area, waktu in estimasi.items():
            parts.append(f"Estimasi {area}: {waktu}")
        cod = pengiriman.get('cod', {})
        parts.append(f"COD: {'Tersedia' if cod.get('tersedia') else 'Tidak tersedia'} — {cod.get('area', '')}")
        parts.append(f"Packing: {pengiriman.get('packing', '')}")
    
    pembayaran = kebijakan.get('pembayaran', {})
    if pembayaran:
        parts.append("\n═══ METODE PEMBAYARAN ═══")
        for metode in pembayaran.get('metode', []):
            nama = metode.get('nama', '')
            catatan = metode.get('catatan', '')
            bank = metode.get('bank', [])
            provider = metode.get('provider', [])
            parts.append(f"- {nama}")
            if bank:
                for b in bank:
                    parts.append(f"  • {b}")
            if provider:
                parts.append(f"  • {', '.join(provider)}")
            if catatan:
                parts.append(f"  • {catatan}")
    
    retur = kebijakan.get('retur_refund', {})
    if retur:
        parts.append("\n═══ KEBIJAKAN RETUR & REFUND ═══")
        parts.append(f"Proses: {retur.get('proses_retur', '')}")
        parts.append(f"Waktu Refund: {retur.get('refund', '')}")
        parts.append("Syarat Retur:")
        for s in retur.get('syarat_retur', []):
            parts.append(f"  • {s}")
        parts.append("Tidak Bisa Diretur:")
        for t in retur.get('yang_tidak_bisa_diretur', []):
            parts.append(f"  • {t}")
    
    promo_list = kebijakan.get('promo_saat_ini', [])
    if promo_list:
        parts.append("\n═══ PROMO SAAT INI ═══")
        for promo in promo_list:
            parts.append(f"- {promo.get('nama', '')}: {promo.get('detail', '')}")
            parts.append(f"  Periode: {promo.get('periode', '')} | Syarat: {promo.get('syarat', '')}")
    
    faq_list = kb.get('faq', [])
    if faq_list:
        parts.append("\n═══ FAQ ═══")
        for faq in faq_list:
            parts.append(f"Q: {faq.get('pertanyaan', '')}")
            parts.append(f"A: {faq.get('jawaban', '')}")
    
    return '\n'.join(parts)


def _get_default_context():
    """Fallback context jika knowledge_base.json tidak tersedia."""
    return """
Kamu adalah CekatIn, customer service virtual toko elektronik.
Saat ini data produk belum dimuat. Sarankan customer hubungi CS langsung.
Tetap ramah dan helpful meskipun belum bisa jawab detail.
"""


# ============================================================
# API Key Pool — Mengelola rotasi API key per provider
# ============================================================

class APIKeyPool:
    """
    Mengelola pool API key dengan rotasi otomatis.
    
    Algoritma:
    ──────────
    1. Semua key dimuat dari .env (PREFIX_1, PREFIX_2, ..., PREFIX_N)
    2. Key aktif dipakai untuk request
    3. Kalau kena rate limit → key masuk cooldown
    4. Otomatis rotasi ke key berikutnya yang tersedia
    5. Kalau semua cooldown → tunggu yang paling cepat pulih
    6. Key yang cooldown habis → otomatis aktif kembali
    """
    
    COOLDOWN_DURATION = 65  # Default cooldown (detik)
    
    def __init__(self, prefix="GEMINI_API_KEY", single_key_name=None):
        """
        Args:
            prefix: Prefix untuk multi-key (e.g. "GEMINI_API_KEY" → _1, _2, ...)
            single_key_name: Nama single key untuk backward compatibility
        """
        self.prefix = prefix
        self.single_key_name = single_key_name or prefix
        self.keys = []
        self.cooldowns = {}        # {index: timestamp_kapan_pulih}
        self.disabled_keys = set() # Key yang permanent disabled
        self.current_index = 0
        self.request_counts = {}   # {index: jumlah_request}
        
        self._load_keys()
    
    def _load_keys(self):
        """Load semua API key dari .env file dan environment."""
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        env_keys = {}
        
        try:
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        var_name, var_value = line.split('=', 1)
                        var_name = var_name.strip()
                        var_value = var_value.strip().strip("'\"")
                        if var_value:
                            env_keys[var_name] = var_value
        except FileNotFoundError:
            pass
        
        # Cek juga environment variables
        for key_name in [self.single_key_name] + [f'{self.prefix}_{i}' for i in range(1, 21)]:
            env_val = os.environ.get(key_name, '')
            if env_val and key_name not in env_keys:
                env_keys[key_name] = env_val
        
        # Prioritas: multi-key → single key
        numbered_keys = []
        for i in range(1, 21):
            key_name = f'{self.prefix}_{i}'
            if key_name in env_keys:
                numbered_keys.append(env_keys[key_name])
        
        if numbered_keys:
            self.keys = numbered_keys
        elif self.single_key_name in env_keys:
            self.keys = [env_keys[self.single_key_name]]
        
        for i in range(len(self.keys)):
            self.request_counts[i] = 0
    
    def get_active_key(self):
        """Dapatkan key yang aktif (tidak cooldown/disabled). Returns None jika tidak ada."""
        if not self.keys:
            return None
        
        now = time.time()
        
        # Bersihkan cooldown expired
        expired = [idx for idx, until in self.cooldowns.items() if now >= until]
        for idx in expired:
            del self.cooldowns[idx]
            print(f"   ✅ {self.prefix} Key #{idx+1} sudah pulih")
        
        # Cari key tersedia
        checked = 0
        while checked < len(self.keys):
            idx = self.current_index % len(self.keys)
            
            if idx not in self.disabled_keys and idx not in self.cooldowns:
                return self.keys[idx]
            
            self.current_index = (self.current_index + 1) % len(self.keys)
            checked += 1
        
        # Semua cooldown — tunggu yang paling cepat
        if self.cooldowns:
            soonest_idx = min(self.cooldowns, key=self.cooldowns.get)
            wait_time = self.cooldowns[soonest_idx] - now
            
            if wait_time > 0:
                print(f"   ⏳ Semua {self.prefix} key cooldown — tunggu {wait_time:.0f}s...")
                time.sleep(wait_time + 1)
            
            del self.cooldowns[soonest_idx]
            self.current_index = soonest_idx
            return self.keys[soonest_idx]
        
        return None
    
    def mark_rate_limited(self, cooldown_seconds=None):
        """Key aktif kena rate limit → masuk cooldown → rotasi."""
        idx = self.current_index % len(self.keys)
        duration = cooldown_seconds or self.COOLDOWN_DURATION
        self.cooldowns[idx] = time.time() + duration
        print(f"   🔄 {self.prefix} Key #{idx+1} cooldown {duration}s")
        self.current_index = (self.current_index + 1) % len(self.keys)
    
    def mark_disabled(self):
        """Key aktif invalid → disable permanent."""
        idx = self.current_index % len(self.keys)
        self.disabled_keys.add(idx)
        print(f"   🚫 {self.prefix} Key #{idx+1} disabled (invalid)")
        self.current_index = (self.current_index + 1) % len(self.keys)
    
    def record_request(self):
        """Catat jumlah request per key."""
        idx = self.current_index % len(self.keys)
        self.request_counts[idx] = self.request_counts.get(idx, 0) + 1
    
    def has_available_keys(self):
        """Cek apakah ada key yang LANGSUNG tersedia (tanpa menunggu)."""
        if not self.keys:
            return False
        now = time.time()
        for i in range(len(self.keys)):
            if i not in self.disabled_keys and (i not in self.cooldowns or now >= self.cooldowns[i]):
                return True
        return False
    
    def all_cooldown(self):
        """Cek apakah semua key sedang cooldown (bukan disabled)."""
        if not self.keys:
            return True
        active_keys = [i for i in range(len(self.keys)) if i not in self.disabled_keys]
        if not active_keys:
            return True
        return all(i in self.cooldowns and time.time() < self.cooldowns[i] for i in active_keys)
    
    def get_status(self):
        """Status pool untuk monitoring."""
        now = time.time()
        active, cooldown, disabled = [], [], []
        
        for i in range(len(self.keys)):
            if i in self.disabled_keys:
                disabled.append(i + 1)
            elif i in self.cooldowns and now < self.cooldowns[i]:
                remaining = self.cooldowns[i] - now
                cooldown.append({'key': i + 1, 'remaining': f'{remaining:.0f}s'})
            else:
                active.append(i + 1)
        
        return {
            'total': len(self.keys),
            'active': active,
            'cooldown': cooldown,
            'disabled': disabled,
            'current': (self.current_index % len(self.keys)) + 1 if self.keys else 0,
            'requests': {f'key_{k+1}': v for k, v in self.request_counts.items()}
        }


# ============================================================
# GeminiBackend — Multi-Provider Engine (Gemini + Groq)
# ============================================================

class GeminiBackend:
    """
    Engine utama chatbot — Multi-Provider AI Architecture.
    
    Alur Request:
    ─────────────
    1. Gemini (primary) — kualitas terbaik, tapi limit kecil
    2. Groq/Llama (fallback) — limit besar (14.400 RPD), cepat
    3. NLP Engine (last resort) — offline, kalau semua AI down
    
    Setiap provider punya key pool sendiri untuk rotasi.
    """
    
    def __init__(self):
        self.available = False
        self.chat_histories = {}
        
        # Load knowledge base (shared untuk semua provider)
        self.system_instruction = load_knowledge_base()
        
        # ── Provider 1: Gemini ──
        self.gemini_pool = APIKeyPool(prefix="GEMINI_API_KEY", single_key_name="GEMINI_API_KEY")
        self.gemini_available = False
        self._genai = None
        
        try:
            from google import genai
            self._genai = genai
            if self.gemini_pool.keys:
                active_key = self.gemini_pool.get_active_key()
                if active_key:
                    self.gemini_client = genai.Client(api_key=active_key)
                    self.gemini_model = 'gemini-2.5-flash'
                    self.gemini_available = True
                    
                    n = len(self.gemini_pool.keys)
                    print(f"✅ Gemini: {n} key(s) dimuat")
                    for i in range(n):
                        k = self.gemini_pool.keys[i]
                        masked = k[:8] + '...' + k[-4:] if len(k) > 12 else '***'
                        print(f"   Key #{i+1}: {masked}")
        except ImportError:
            print("⚠️  google-genai belum terinstall → pip install google-genai")
        except Exception as e:
            print(f"⚠️  Gemini init error: {e}")
        
        # ── Provider 2: Groq ──
        self.groq_pool = APIKeyPool(prefix="GROQ_API_KEY", single_key_name="GROQ_API_KEY")
        self.groq_available = False
        self._groq_module = None
        
        try:
            import groq as groq_module
            self._groq_module = groq_module
            if self.groq_pool.keys:
                active_key = self.groq_pool.get_active_key()
                if active_key:
                    self.groq_client = groq_module.Groq(api_key=active_key)
                    self.groq_model = 'llama-3.3-70b-versatile'
                    self.groq_available = True
                    
                    n = len(self.groq_pool.keys)
                    print(f"✅ Groq: {n} key(s) dimuat (model: {self.groq_model})")
                    for i in range(n):
                        k = self.groq_pool.keys[i]
                        masked = k[:8] + '...' + k[-4:] if len(k) > 12 else '***'
                        print(f"   Key #{i+1}: {masked}")
        except ImportError:
            print("ℹ️  groq belum terinstall — Groq fallback tidak aktif")
        except Exception as e:
            print(f"⚠️  Groq init error: {e}")
        
        # ── Set overall availability ──
        self.available = self.gemini_available or self.groq_available
        
        if self.available:
            providers = []
            if self.gemini_available:
                providers.append(f"Gemini ({len(self.gemini_pool.keys)} keys)")
            if self.groq_available:
                providers.append(f"Groq ({len(self.groq_pool.keys)} keys)")
            
            print(f"\n🚀 Multi-Provider Engine AKTIF: {' + '.join(providers)}")
            
            # Hitung total kapasitas
            gemini_rpd = len(self.gemini_pool.keys) * 20
            groq_rpd = len(self.groq_pool.keys) * 14400 if self.groq_available else 0
            print(f"   📊 Kapasitas total: ~{gemini_rpd + groq_rpd:,} RPD gratis!")
        else:
            print("⚠️  Tidak ada AI provider yang aktif — mode NLP only")
    
    # ────────────────────────────────────────────────
    #  Gemini Request
    # ────────────────────────────────────────────────
    
    def _call_gemini(self, contents, session_id):
        """
        Kirim request ke Gemini API.
        Dengan key rotation jika kena rate limit.
        
        Returns:
            str: Response text, atau None jika gagal
        """
        max_retries = min(len(self.gemini_pool.keys) + 1, 5)
        
        for attempt in range(max_retries):
            try:
                self.gemini_pool.record_request()
                
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model,
                    contents=contents,
                    config={
                        'system_instruction': self.system_instruction,
                        'max_output_tokens': 500,
                        'temperature': 0.8
                    }
                )
                return response.text
                
            except Exception as e:
                error_msg = str(e)
                key_num = (self.gemini_pool.current_index % len(self.gemini_pool.keys)) + 1
                print(f"⚠️  Gemini Key #{key_num}: {error_msg[:120]}")
                
                # Rate limit → rotasi key
                if ('429' in error_msg or 'RESOURCE_EXHAUSTED' in error_msg or
                    'quota' in error_msg.lower() or 'rate' in error_msg.lower()):
                    
                    cooldown = None
                    delay_match = re.search(r"retryDelay.*?'(\d+)s'", error_msg)
                    if delay_match:
                        cooldown = int(delay_match.group(1)) + 5
                    
                    self.gemini_pool.mark_rate_limited(cooldown)
                    
                    # Coba key lain (tanpa menunggu)
                    if self.gemini_pool.has_available_keys():
                        active_key = self.gemini_pool.get_active_key()
                        if active_key:
                            self.gemini_client = self._genai.Client(api_key=active_key)
                            new_key_num = (self.gemini_pool.current_index % len(self.gemini_pool.keys)) + 1
                            print(f"   🔄 Rotasi → Gemini Key #{new_key_num}")
                            continue
                    
                    # Semua Gemini key cooldown → jangan tunggu, langsung return None
                    # agar bisa fallback ke Groq
                    print("   ⚡ Semua Gemini key cooldown → fallback ke provider lain")
                    return None
                
                # Invalid key → disable
                if '403' in error_msg or 'PERMISSION_DENIED' in error_msg:
                    self.gemini_pool.mark_disabled()
                    if self.gemini_pool.has_available_keys():
                        active_key = self.gemini_pool.get_active_key()
                        if active_key:
                            self.gemini_client = self._genai.Client(api_key=active_key)
                            continue
                    return None
                
                # Error lain
                return None
        
        return None
    
    # ────────────────────────────────────────────────
    #  Groq Request
    # ────────────────────────────────────────────────
    
    def _call_groq(self, message, history):
        """
        Kirim request ke Groq API (Llama 3.3 70B).
        Fallback provider dengan limit besar.
        
        Returns:
            str: Response text, atau None jika gagal
        """
        if not self.groq_available:
            return None
        
        max_retries = min(len(self.groq_pool.keys) + 1, 3)
        
        for attempt in range(max_retries):
            try:
                # Bangun messages format untuk Groq (OpenAI-compatible)
                messages = [
                    {"role": "system", "content": self.system_instruction}
                ]
                
                # Tambah history
                for entry in history:
                    role = "user" if entry['role'] == 'user' else "assistant"
                    messages.append({"role": role, "content": entry['text']})
                
                # Tambah pesan terbaru
                messages.append({"role": "user", "content": message})
                
                self.groq_pool.record_request()
                
                response = self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=messages,
                    max_tokens=500,
                    temperature=0.8
                )
                
                return response.choices[0].message.content
                
            except Exception as e:
                error_msg = str(e)
                key_num = (self.groq_pool.current_index % len(self.groq_pool.keys)) + 1
                print(f"⚠️  Groq Key #{key_num}: {error_msg[:120]}")
                
                # Rate limit → rotasi key
                if ('429' in error_msg or 'rate' in error_msg.lower() or 
                    'limit' in error_msg.lower()):
                    
                    self.groq_pool.mark_rate_limited(60)
                    
                    if self.groq_pool.has_available_keys():
                        active_key = self.groq_pool.get_active_key()
                        if active_key:
                            self.groq_client = self._groq_module.Groq(api_key=active_key)
                            continue
                    return None
                
                # Invalid key
                if '401' in error_msg or 'invalid' in error_msg.lower():
                    self.groq_pool.mark_disabled()
                    if self.groq_pool.has_available_keys():
                        active_key = self.groq_pool.get_active_key()
                        if active_key:
                            self.groq_client = self._groq_module.Groq(api_key=active_key)
                            continue
                    return None
                
                return None
        
        return None
    
    # ────────────────────────────────────────────────
    #  Main Response Method
    # ────────────────────────────────────────────────
    
    def get_response(self, message: str, session_id: str = "default",
                     nlp_intent: str = None, nlp_confidence: float = 0.0,
                     kb_context: str = "") -> dict:
        """
        Hasilkan respon AI dengan multi-provider fallback.
        
        Alur:
        1. Gemini (primary) → kualitas terbaik
        2. Groq (fallback) → limit besar
        3. Return None → NLP engine handle di app.py
        
        Args:
            message: Pesan user
            session_id: Session ID untuk riwayat chat
            nlp_intent: Intent yang terdeteksi oleh NLP classifier
            nlp_confidence: Confidence score dari NLP classifier
            kb_context: Data Knowledge Base yang relevan per intent
                        (diambil dari NLPEngine.get_kb_context())
        """
        if not self.available:
            return {'response': None, 'source': 'ai_unavailable'}
        
        # Riwayat chat
        if session_id not in self.chat_histories:
            self.chat_histories[session_id] = []
        history = self.chat_histories[session_id]
        
        # ── Bangun pesan kontekstual untuk AI ──
        # Gabungkan pesan user + NLP intent hint + data KB yang relevan
        # Ini memungkinkan Gemini menjawab secara AKURAT (dari data KB)
        # namun dengan GAYA yang natural dan bervariasi
        context_parts = [message]
        
        if nlp_intent and nlp_intent != 'unknown' and nlp_confidence > 0.3:
            context_parts.append(f"\n[Konteks NLP: topik '{nlp_intent}' ({nlp_confidence:.0%})]")
        
        if kb_context:
            context_parts.append(
                f"\n[DATA RELEVAN DARI DATABASE — gunakan data ini untuk jawaban yang akurat, "
                f"tapi sampaikan dengan gaya natural dan bervariasi setiap kali. "
                f"JANGAN copy-paste data mentah, olah jadi percakapan natural.]\n{kb_context}"
            )
        
        full_message = ''.join(context_parts)
        
        response_text = None
        source = 'ai_error'
        
        # ── Step 1: Coba Gemini (Primary) ──
        if self.gemini_available and self.gemini_pool.has_available_keys():
            # Bangun contents format Gemini
            contents = []
            for entry in history:
                contents.append({
                    'role': entry['role'],
                    'parts': [{'text': entry['text']}]
                })
            contents.append({
                'role': 'user',
                'parts': [{'text': full_message}]
            })
            
            response_text = self._call_gemini(contents, session_id)
            if response_text:
                source = 'gemini'
        
        # ── Step 2: Fallback ke Groq ──
        if not response_text and self.groq_available and self.groq_pool.has_available_keys():
            print("   🔄 Fallback → Groq (Llama 3.3 70B)")
            response_text = self._call_groq(full_message, history)
            if response_text:
                source = 'groq'
        
        # ── Simpan ke riwayat jika berhasil ──
        if response_text:
            history.append({'role': 'user', 'text': message})
            history.append({'role': 'model', 'text': response_text})
            
            if len(history) > 20:
                self.chat_histories[session_id] = history[-20:]
            
            return {
                'response': response_text,
                'source': source,
                'intent': nlp_intent or 'ai_generated'
            }
        
        # ── Semua provider gagal ──
        return {
            'response': None,
            'source': 'ai_error',
            'error': 'Semua AI provider tidak tersedia'
        }
    
    def get_pool_status(self):
        """Status semua provider untuk health check."""
        status = {
            'providers': [],
            'total_capacity_rpd': 0
        }
        
        if self.gemini_pool.keys:
            gemini_status = self.gemini_pool.get_status()
            gemini_status['provider'] = 'gemini'
            gemini_status['model'] = self.gemini_model if self.gemini_available else 'N/A'
            gemini_status['available'] = self.gemini_available
            status['providers'].append(gemini_status)
            status['total_capacity_rpd'] += len(self.gemini_pool.keys) * 20
        
        if self.groq_pool.keys:
            groq_status = self.groq_pool.get_status()
            groq_status['provider'] = 'groq'
            groq_status['model'] = self.groq_model if self.groq_available else 'N/A'
            groq_status['available'] = self.groq_available
            status['providers'].append(groq_status)
            status['total_capacity_rpd'] += len(self.groq_pool.keys) * 14400
        
        return status
    
    def clear_history(self, session_id: str = "default"):
        """Hapus riwayat chat untuk sesi tertentu."""
        if session_id in self.chat_histories:
            del self.chat_histories[session_id]
