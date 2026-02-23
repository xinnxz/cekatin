"""
CekatIn — Database Connection Module
======================================
Mengatur koneksi ke database menggunakan SQLAlchemy.

Penjelasan:
- `engine` = koneksi ke database (seperti "kabel" ke DB)
- `SessionLocal` = factory untuk membuat session (seperti "sesi kerja" dengan DB)
- `get_db()` = helper function yang dipakai di setiap request Flask
- Session ditutup otomatis setelah selesai (pakai try/finally)

Cara pakai di Flask route:
    from database import get_db
    
    @app.route('/api/something')
    def something():
        db = get_db()
        try:
            # ... query database ...
            db.commit()
        finally:
            db.close()
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import Config

# ═══════════════════════════════════════
# Engine — Koneksi ke Database
# ═══════════════════════════════════════
# create_engine() membuat "pool" koneksi ke database.
# pool_pre_ping=True memastikan koneksi masih hidup sebelum dipakai
# (mencegah error "connection closed" setelah idle lama).

engine = create_engine(
    Config.DATABASE_URL,
    pool_pre_ping=True,
    echo=Config.DEBUG  # Print SQL queries jika debug mode
)

# ═══════════════════════════════════════
# Session Factory
# ═══════════════════════════════════════
# SessionLocal() = membuat 1 session database.
# autocommit=False → kita harus manual commit() setelah insert/update
# autoflush=False  → data tidak otomatis dikirim ke DB sampai commit()
# Ini memberi kita kontrol penuh kapan data benar-benar disimpan.

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ═══════════════════════════════════════
# Base Class untuk Model
# ═══════════════════════════════════════
# Semua model (tabel) harus inherit dari Base ini.
# Contoh: class User(Base): ...

Base = declarative_base()


# ═══════════════════════════════════════
# Helper: Get Database Session
# ═══════════════════════════════════════
def get_db():
    """
    Membuat session database baru.
    
    Cara pakai:
        db = get_db()
        try:
            users = db.query(User).all()
            db.commit()
        finally:
            db.close()
    
    Returns:
        SQLAlchemy Session object
    """
    db = SessionLocal()
    return db


def init_db():
    """
    Membuat semua tabel di database.
    
    Penjelasan:
    - Import semua model dulu agar Base.metadata tahu tabel apa saja
    - create_all() akan buat tabel yang BELUM ada
    - Tabel yang sudah ada TIDAK akan di-overwrite (aman)
    """
    # Import models agar terdaftar di Base.metadata
    import db_models  # noqa: F401
    
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified!")
