"""
CekatIn — Google OAuth Module
===============================
Login/Register menggunakan akun Google (OAuth 2.0).

Penjelasan OAuth 2.0 (Apa itu?):
──────────────────────────────────
OAuth = Open Authorization → izinkan app lain akses data user TANPA
membagikan password.

Alur Google OAuth untuk CekatIn:
────────────────────────────────
1. User klik "Login with Google" di frontend
2. Frontend buka popup Google Sign-In
3. User pilih akun Google → Google kasih ID Token ke frontend
4. Frontend kirim ID Token ke backend: POST /api/auth/google
5. Backend VERIFIKASI token ke Google (beneran dari Google? belum expired?)
6. Backend ambil email + nama dari token
7. Jika user sudah ada → login (buat JWT)
8. Jika user belum ada → auto-register + login

Kenapa pakai Token-Based Flow?
─────────────────────────────
- Lebih simpel (tidak perlu redirect callback URL)
- Cocok untuk SPA (Single Page Application) dan embeddable widget
- Frontend handle popup Google → kirim token ke API
- Backend tinggal verifikasi → tidak perlu session

Setup Google Cloud Console:
──────────────────────────
1. Buka https://console.cloud.google.com
2. Buat project baru atau pilih yang ada
3. API & Services → Credentials → Create OAuth 2.0 Client
4. Application type: Web application
5. Authorized origins: http://localhost:5000 (dev), https://yourdomain.com (prod)  
6. Copy Client ID → masukkan ke .env sebagai GOOGLE_CLIENT_ID
7. Copy Client Secret → masukkan ke .env sebagai GOOGLE_CLIENT_SECRET (optional)
"""

import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ═══════════════════════════════════════════════════════
# GOOGLE CLIENT ID
# ═══════════════════════════════════════════════════════
# Dapatkan dari Google Cloud Console → API & Services → Credentials
# Simpan di .env:  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')


def verify_google_token(token: str) -> dict:
    """
    Verifikasi Google ID Token dan ambil data user.
    
    Penjelasan:
    - Google ID Token berisi data user yang sudah ditanda-tangani Google
    - Kita verifikasi tanda tangan digital-nya ke Google
    - Jika valid → kita dapat email, nama, foto user
    
    Google ID Token berisi (payload):
    {
        "iss": "accounts.google.com",       # Siapa yang keluarkan
        "sub": "12345678901234",            # Google user ID (unik)
        "email": "user@gmail.com",          # Email user
        "email_verified": true,              # Email sudah diverifikasi?
        "name": "Nama User",               # Nama lengkap
        "picture": "https://...photo.jpg",  # URL foto profil
        "iat": 1234567890,                  # Token dibuat kapan
        "exp": 1234567890                   # Token expired kapan
    }
    
    Args:
        token: Google ID Token string dari frontend
    
    Returns:
        dict: Data user jika valid, contoh:
            {
                'google_id': '12345...',
                'email': 'user@gmail.com',
                'name': 'Nama User',
                'picture': 'https://...'
            }
        None: Jika token invalid
    """
    try:
        # Verifikasi token ke Google
        # Ini akan:
        # 1. Download Google public keys (auto-cached)
        # 2. Verifikasi signature token
        # 3. Cek token belum expired
        # 4. Cek audience (client_id) cocok
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Pastikan issuer (penerbit) adalah Google
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            print("❌ Google token issuer tidak valid")
            return None
        
        # Pastikan email sudah diverifikasi
        if not idinfo.get('email_verified', False):
            print("❌ Email Google belum diverifikasi")
            return None
        
        return {
            'google_id': idinfo['sub'],       # ID unik Google
            'email': idinfo['email'],          # Email
            'name': idinfo.get('name', ''),    # Nama lengkap
            'picture': idinfo.get('picture', '')  # URL foto profil
        }
        
    except ValueError as e:
        # Token invalid (format salah, expired, signature tidak cocok)
        print(f"❌ Google token invalid: {e}")
        return None
    except Exception as e:
        print(f"❌ Error verifikasi Google token: {e}")
        return None


def is_google_auth_configured() -> bool:
    """
    Cek apakah Google OAuth sudah dikonfigurasi.
    
    Returns:
        bool: True jika GOOGLE_CLIENT_ID sudah diset di .env
    """
    return bool(GOOGLE_CLIENT_ID)
