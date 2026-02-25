"""
CekatIn — Authentication Module
=================================
Mengelola autentikasi user: register, login, JWT token.

Penjelasan komponen:
1. bcrypt  → Hash password (enkripsi 1 arah, aman untuk disimpan di DB)
2. JWT     → Token yang dikirim client setiap request sebagai bukti login
3. Token berisi: user_id, tenant_id, role, expiry time

Alur autentikasi:
─────────────────
  Register: password → bcrypt.hash() → simpan hash ke DB
  Login:    password → bcrypt.check(password, hash) → jika cocok → buat JWT
  Request:  client kirim JWT di header → server verify → akses diberikan

Keamanan:
- Password TIDAK PERNAH disimpan langsung (hanya hash-nya)
- JWT punya expiry (default 24 jam)
- Secret key dari environment variable
"""

import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from config import Config


# ═══════════════════════════════════════════════════════
# PASSWORD HASHING (bcrypt)
# ═══════════════════════════════════════════════════════
# bcrypt adalah algoritma hashing yang dirancang khusus untuk password.
# Kenapa bcrypt, bukan MD5/SHA?
# - bcrypt SENGAJA lambat → brute force jadi sulit
# - bcrypt pakai "salt" → password yang sama menghasilkan hash berbeda
# - bcrypt punya "cost factor" → bisa disesuaikan seiring hardware makin cepat


def hash_password(password: str) -> str:
    """
    Hash password menggunakan bcrypt.
    
    Penjelasan:
    - gensalt() membuat random salt (16 bytes)
    - hashpw() menggabungkan salt + password → hash
    - Hasil: "$2b$12$..." (60 karakter, termasuk salt di dalamnya)
    
    Args:
        password: Password plaintext dari user
    
    Returns:
        str: Password yang sudah di-hash (aman disimpan di DB)
    
    Contoh:
        hash_password("admin123") 
        → "$2b$12$LJ3m5.../..."  (berbeda setiap dipanggil karena random salt)
    """
    salt = bcrypt.gensalt(rounds=12)  # 12 rounds = ~250ms per hash (cukup aman)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verifikasi password terhadap hash yang tersimpan.
    
    Penjelasan:
    - bcrypt mengekstrak salt dari hash yang tersimpan
    - Hash ulang password input dengan salt yang sama
    - Bandingkan hasilnya → jika sama = password benar
    
    Args:
        password: Password plaintext yang diinput user saat login
        password_hash: Hash yang tersimpan di database
    
    Returns:
        bool: True jika password cocok
    """
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )
    except Exception:
        return False


# ═══════════════════════════════════════════════════════
# JWT TOKEN (JSON Web Token)
# ═══════════════════════════════════════════════════════
# JWT = token yang berisi data (payload) + tanda tangan digital.
# 
# Struktur JWT (3 bagian dipisah titik):
#   Header.Payload.Signature
#   
# Header:  {"alg": "HS256", "typ": "JWT"}
# Payload: {"user_id": "abc", "exp": 1234567890, ...}
# Signature: HMAC-SHA256(header + payload, secret_key)
#
# Client menyimpan JWT di localStorage/cookie, lalu mengirimnya
# di setiap request via header: Authorization: Bearer <token>


def create_token(user_id: str, tenant_id: str, role: str = 'admin') -> str:
    """
    Buat JWT token untuk user yang berhasil login.
    
    Penjelasan payload:
    - sub (subject): ID user → siapa yang login
    - tenant_id: ID tenant → toko mana  
    - role: peran user → admin/viewer/superadmin
    - iat (issued at): kapan token dibuat
    - exp (expiry): kapan token kadaluarsa
    
    Args:
        user_id: UUID user
        tenant_id: UUID tenant
        role: Role user (admin/viewer/superadmin)
    
    Returns:
        str: JWT token string
    """
    now = datetime.now(timezone.utc)
    
    payload = {
        'sub': user_id,                          # Subject (siapa)
        'tenant_id': tenant_id,                  # Tenant (toko mana)
        'role': role,                            # Role (hak akses)
        'iat': now,                              # Issued at (kapan dibuat)
        'exp': now + timedelta(hours=Config.JWT_EXPIRY_HOURS)  # Expiry
    }
    
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')
    return token


def verify_token(token: str) -> dict:
    """
    Verifikasi dan decode JWT token.
    
    Penjelasan:
    - Cek apakah signature valid (tidak dimanipulasi)
    - Cek apakah token belum expired
    - Return payload jika valid
    
    Args:
        token: JWT token string dari header Authorization
    
    Returns:
        dict: Payload token jika valid
        None: Jika token invalid/expired
    
    Kemungkinan error:
    - ExpiredSignatureError → token sudah kadaluarsa
    - InvalidTokenError → token rusak/dimanipulasi
    """
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Token invalid


def refresh_token(token: str) -> str:
    """
    Refresh token yang hampir expired.
    
    Penjelasan:
    - Decode token lama (tanpa cek expiry)
    - Buat token baru dengan waktu expiry yang di-reset
    - User tidak perlu login ulang
    
    Args:
        token: JWT token lama
    
    Returns:
        str: Token baru, atau None jika token invalid
    """
    try:
        # Decode tanpa cek expiry
        payload = jwt.decode(
            token, Config.SECRET_KEY, 
            algorithms=['HS256'],
            options={"verify_exp": False}
        )
        
        # Buat token baru
        return create_token(
            user_id=payload['sub'],
            tenant_id=payload['tenant_id'],
            role=payload.get('role', 'admin')
        )
    except jwt.InvalidTokenError:
        return None
