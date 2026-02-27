"""
CekatIn — Tenant Manager (Multi-Tenant NLP Model Cache)
=========================================================
Module inti untuk sistem multi-tenant CekatIn.

Penjelasan Multi-Tenant:
────────────────────────
Sebelumnya CekatIn hanya melayani 1 toko (single-tenant).
Dengan TenantManager, 1 server bisa melayani BANYAK toko sekaligus.

Setiap tenant (toko) memiliki:
- NLP Engine sendiri (model terpisah)
- Dataset intent sendiri (dari database, per tenant_id)
- Model file sendiri (disimpan di models/{tenant_slug}/)
- Knowledge base sendiri (opsional)

Cara Kerja:
───────────
1. Request masuk → identifikasi tenant dari header X-Tenant-Slug
2. TenantManager cek apakah engine sudah ada di cache
3. Jika BELUM → buat NLPEngine baru, train dari DB, simpan ke cache
4. Jika SUDAH → langsung pakai dari cache (cepat!)
5. Engine yang sudah tidak dipakai lama bisa di-evict dari cache

Diagram:
────────
  Request (X-Tenant-Slug: reonshop)
       │
       ▼
  TenantManager
       │
       ├── Cache HIT? → Return engine dari memory (< 1ms)
       │
       └── Cache MISS? → Load dari DB → Train model → Cache → Return
                                │
                          models/reonshop/chatbot_pipeline.pkl

Author: CekatIn Team
"""

import os
import threading
from datetime import datetime, timezone


# ═══════════════════════════════════════════════════════
# TENANT MANAGER
# ═══════════════════════════════════════════════════════
# Mengelola NLP Engine per tenant dengan in-memory caching.
# Thread-safe menggunakan threading.Lock().
#
# Kenapa pakai cache di memory?
# - Membuat NLPEngine + load model ~ 1-3 detik
# - Kalau setiap request harus load ulang → terlalu lambat
# - Cache menyimpan engine yang sudah ready → response instan
# ═══════════════════════════════════════════════════════

class TenantManager:
    """
    Manager untuk NLP Engine per tenant.
    
    Fitur:
    1. Lazy loading — engine dibuat hanya saat pertama kali diakses
    2. In-memory cache — engine disimpan di RAM untuk akses cepat
    3. Thread-safe — aman dipakai oleh multiple request bersamaan
    4. Per-tenant model — setiap tenant punya model .pkl sendiri
    
    Contoh penggunaan:
        tm = TenantManager()
        
        # Ambil engine untuk tenant "reonshop"
        engine = tm.get_engine_by_slug("reonshop")
        result = engine.get_response("harga hp berapa?")
        
        # Retrain model tenant tertentu
        tm.retrain_tenant_by_slug("reonshop")
    """
    
    def __init__(self):
        """
        Inisialisasi TenantManager.
        
        Penjelasan:
        - _engines: dict untuk menyimpan {tenant_id: NLPEngine}
        - _tenant_info: dict untuk menyimpan {tenant_id: {slug, name, ...}}
        - _lock: threading Lock untuk thread-safety
        - base_dir: root directory project (untuk menentukan model path)
        """
        self._engines = {}        # {tenant_id: NLPEngine}
        self._tenant_info = {}    # {tenant_id: {slug, name, last_accessed}}
        self._slug_to_id = {}     # {slug: tenant_id} — mapping untuk lookup cepat
        self._lock = threading.Lock()
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        
        print("🏢 TenantManager initialized")
    
    # ═══════════════════════════════════════════════════════
    # PUBLIC METHODS
    # ═══════════════════════════════════════════════════════
    
    def get_engine_by_slug(self, slug: str):
        """
        Ambil NLP Engine berdasarkan tenant slug.
        
        Penjelasan:
        - Slug = identifier unik tenant (contoh: "reonshop", "toko-baju")
        - Pertama cek slug → tenant_id di cache
        - Jika tidak ada di cache → query database
        - Setelah dapat tenant_id → ambil/buat engine
        
        Args:
            slug: Tenant slug (contoh: "reonshop")
            
        Returns:
            NLPEngine: Engine milik tenant tersebut
            
        Raises:
            ValueError: Jika tenant dengan slug tersebut tidak ditemukan
        """
        # Cek slug → tenant_id mapping di cache
        tenant_id = self._slug_to_id.get(slug)
        
        if not tenant_id:
            # Query database untuk mendapatkan tenant_id
            tenant_id = self._resolve_slug(slug)
            if not tenant_id:
                raise ValueError(f"Tenant dengan slug '{slug}' tidak ditemukan")
        
        return self.get_engine(tenant_id, slug)
    
    def get_engine(self, tenant_id: str, slug: str = None):
        """
        Ambil NLP Engine berdasarkan tenant_id.
        
        Penjelasan alur:
        1. Cek apakah engine sudah ada di cache
        2. Jika ada → update last_accessed, return langsung
        3. Jika belum → buat engine baru (lazy loading)
        
        Args:
            tenant_id: UUID tenant
            slug: Slug tenant (opsional, untuk model path)
            
        Returns:
            NLPEngine: Engine milik tenant tersebut
        """
        # Fast path: engine sudah ada di cache
        if tenant_id in self._engines:
            self._update_access(tenant_id)
            return self._engines[tenant_id]
        
        # Slow path: perlu buat engine baru (thread-safe)
        with self._lock:
            # Double-check setelah acquire lock
            # (thread lain mungkin sudah membuatnya)
            if tenant_id in self._engines:
                self._update_access(tenant_id)
                return self._engines[tenant_id]
            
            # Resolve slug jika belum ada
            if not slug:
                slug = self._get_slug_for_tenant(tenant_id)
            
            # Buat engine baru
            engine = self._create_engine(tenant_id, slug)
            
            # Simpan ke cache
            self._engines[tenant_id] = engine
            self._slug_to_id[slug] = tenant_id
            self._tenant_info[tenant_id] = {
                'slug': slug,
                'last_accessed': datetime.now(timezone.utc),
                'created_at': datetime.now(timezone.utc)
            }
            
            print(f"🏢 Engine cached untuk tenant: {slug} (ID: {tenant_id[:8]}...)")
            return engine
    
    def retrain_tenant(self, tenant_id: str):
        """
        Retrain model NLP untuk tenant tertentu.
        
        Penjelasan alur:
        1. Ambil slug dari tenant_id
        2. Hapus engine lama dari cache
        3. Buat engine baru (otomatis retrain dari DB)
        4. Simpan ke cache
        
        Args:
            tenant_id: UUID tenant yang mau di-retrain
            
        Returns:
            dict: Info hasil retrain {status, tenant_slug, intents_count}
        """
        slug = self._get_slug_for_tenant(tenant_id)
        
        with self._lock:
            # Hapus engine lama dari cache
            if tenant_id in self._engines:
                del self._engines[tenant_id]
            
            # Buat engine baru (fresh from DB)
            engine = self._create_engine(tenant_id, slug, force_retrain=True)
            self._engines[tenant_id] = engine
        
        print(f"🔄 Tenant '{slug}' berhasil di-retrain")
        
        return {
            'status': 'success',
            'tenant_slug': slug,
            'intents_count': len(engine.response_map)
        }
    
    def retrain_tenant_by_slug(self, slug: str):
        """
        Retrain model NLP berdasarkan slug.
        
        Args:
            slug: Tenant slug
            
        Returns:
            dict: Info hasil retrain
        """
        tenant_id = self._slug_to_id.get(slug) or self._resolve_slug(slug)
        if not tenant_id:
            raise ValueError(f"Tenant dengan slug '{slug}' tidak ditemukan")
        
        return self.retrain_tenant(tenant_id)
    
    def remove_engine(self, tenant_id: str):
        """
        Hapus engine dari cache (biasanya saat tenant dihapus).
        
        Args:
            tenant_id: UUID tenant
        """
        with self._lock:
            self._engines.pop(tenant_id, None)
            info = self._tenant_info.pop(tenant_id, {})
            slug = info.get('slug', '')
            self._slug_to_id.pop(slug, None)
            
        print(f"🗑️ Engine removed dari cache: {slug}")
    
    def get_cached_tenants(self):
        """
        List semua tenant yang sedang di-cache.
        
        Returns:
            list[dict]: Info setiap tenant yang ada di cache
        """
        result = []
        for tenant_id, info in self._tenant_info.items():
            engine = self._engines.get(tenant_id)
            result.append({
                'tenant_id': tenant_id,
                'slug': info.get('slug', ''),
                'intents_count': len(engine.response_map) if engine else 0,
                'last_accessed': info.get('last_accessed', '').isoformat() 
                    if hasattr(info.get('last_accessed', ''), 'isoformat') else '',
                'is_trained': engine.is_trained if engine else False
            })
        return result
    
    # ═══════════════════════════════════════════════════════
    # PRIVATE METHODS
    # ═══════════════════════════════════════════════════════
    
    def _create_engine(self, tenant_id: str, slug: str, force_retrain: bool = False):
        """
        Buat NLPEngine baru untuk tenant tertentu.
        
        Penjelasan:
        - Import NLPEngine di sini (bukan di top level) untuk menghindari
          circular import karena nlp_engine.py juga import dari module lain
        - Model disimpan di models/{slug}/ agar terpisah per tenant
        - Engine akan coba load model yang sudah ada, jika tidak ada → train baru
        
        Args:
            tenant_id: UUID tenant
            slug: Slug tenant (untuk folder model)
            force_retrain: Jika True, hapus model lama dan train ulang
            
        Returns:
            NLPEngine: Engine yang sudah trained
        """
        from nlp_engine import NLPEngine
        
        # Tentukan model directory per tenant
        model_dir = os.path.join(self.base_dir, 'models', slug)
        os.makedirs(model_dir, exist_ok=True)
        
        # Hapus model lama jika force retrain
        if force_retrain:
            model_path = os.path.join(model_dir, 'chatbot_pipeline.pkl')
            if os.path.exists(model_path):
                os.remove(model_path)
                print(f"🗑️ Model lama dihapus: {model_path}")
        
        # Buat engine dengan tenant_id dan tenant_slug
        print(f"🔨 Membuat NLPEngine untuk tenant: {slug}")
        engine = NLPEngine(
            use_database=True,
            tenant_id=tenant_id,
            tenant_slug=slug
        )
        
        return engine
    
    def _resolve_slug(self, slug: str):
        """
        Query database untuk mendapatkan tenant_id dari slug.
        
        Penjelasan:
        - Dipanggil saat slug belum ada di cache _slug_to_id
        - Query langsung ke tabel tenants
        - Simpan hasil ke cache untuk lookup berikutnya
        
        Args:
            slug: Tenant slug
            
        Returns:
            str: tenant_id, atau None jika tidak ditemukan
        """
        try:
            from database import get_db
            from db_models import Tenant
            
            db = get_db()
            try:
                tenant = db.query(Tenant).filter_by(slug=slug, is_active=True).first()
                if tenant:
                    # Simpan ke cache
                    self._slug_to_id[slug] = tenant.id
                    return tenant.id
                return None
            finally:
                db.close()
        except Exception as e:
            print(f"⚠️ Error resolving tenant slug '{slug}': {e}")
            return None
    
    def _get_slug_for_tenant(self, tenant_id: str):
        """
        Ambil slug dari tenant_id (cek cache dulu, fallback ke DB).
        
        Args:
            tenant_id: UUID tenant
            
        Returns:
            str: Slug tenant
        """
        # Cek di cache
        info = self._tenant_info.get(tenant_id, {})
        if info.get('slug'):
            return info['slug']
        
        # Fallback ke DB
        try:
            from database import get_db
            from db_models import Tenant
            
            db = get_db()
            try:
                tenant = db.query(Tenant).filter_by(id=tenant_id).first()
                return tenant.slug if tenant else 'default'
            finally:
                db.close()
        except Exception:
            return 'default'
    
    def _update_access(self, tenant_id: str):
        """
        Update waktu akses terakhir tenant (untuk cache management).
        
        Args:
            tenant_id: UUID tenant
        """
        if tenant_id in self._tenant_info:
            self._tenant_info[tenant_id]['last_accessed'] = datetime.now(timezone.utc)
