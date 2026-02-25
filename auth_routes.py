"""
CekatIn — Authentication Routes (Blueprint)
=============================================
Endpoint untuk register, login, Google OAuth, profile, dan password management.

Penjelasan Blueprint:
- Blueprint = cara Flask mengelompokkan routes terkait
- Semua routes auth diawali /api/auth/...
- Blueprint diregister di app.py utama

Endpoint:
  POST   /api/auth/register   → Daftar admin baru (email+password)
  POST   /api/auth/login      → Login email+password, dapat JWT
  POST   /api/auth/google     → Login/register via Google OAuth
  GET    /api/auth/me          → Get current user info
  PUT    /api/auth/password    → Ganti password
  POST   /api/auth/refresh     → Refresh expired token
  GET    /api/auth/config      → Client-side config (Google Client ID)
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from database import get_db
from db_models import User, Tenant
from auth import hash_password, verify_password, create_token, refresh_token
from middleware import require_auth

# ═══════════════════════════════════════════════════════
# Blueprint Registration
# ═══════════════════════════════════════════════════════
# Blueprint ini akan di-import dan di-register di app.py:
#   from auth_routes import auth_bp
#   app.register_blueprint(auth_bp)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ═══════════════════════════════════════════════════════
# POST /api/auth/register — Daftar Admin Baru
# ═══════════════════════════════════════════════════════

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Daftarkan admin baru untuk sebuah tenant (toko).
    
    Penjelasan alur:
    1. Terima data: email, password, full_name, tenant_slug
    2. Validasi: cek email belum terdaftar, tenant ada
    3. Hash password dengan bcrypt
    4. Simpan user ke database
    5. Buat JWT token langsung (auto-login setelah register)
    
    Request Body (JSON):
        {
            "email": "admin@toko.com",
            "password": "password123",
            "full_name": "Nama Admin",
            "tenant_slug": "reonshop"      // slug toko yang sudah ada
        }
    
    Response:
        {
            "message": "Registrasi berhasil!",
            "token": "eyJhbGci...",
            "user": { id, email, full_name, role, tenant }
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Data JSON diperlukan'}), 400
    
    # Validasi field required
    required = ['email', 'password', 'full_name', 'tenant_slug']
    missing = [f for f in required if f not in data or not data[f]]
    if missing:
        return jsonify({
            'error': f'Field berikut diperlukan: {", ".join(missing)}'
        }), 400
    
    email = data['email'].strip().lower()
    password = data['password']
    full_name = data['full_name'].strip()
    tenant_slug = data['tenant_slug'].strip().lower()
    
    # Validasi password minimum
    if len(password) < 6:
        return jsonify({'error': 'Password minimal 6 karakter'}), 400
    
    db = get_db()
    try:
        # Cek apakah email sudah terdaftar
        existing = db.query(User).filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'Email sudah terdaftar'}), 409  # 409 Conflict
        
        # Cek apakah tenant ada
        tenant = db.query(Tenant).filter_by(slug=tenant_slug).first()
        if not tenant:
            return jsonify({
                'error': f'Tenant "{tenant_slug}" tidak ditemukan',
                'hint': 'Hubungi superadmin untuk membuat tenant baru'
            }), 404
        
        # Hash password
        pw_hash = hash_password(password)
        
        # Buat user baru
        user = User(
            tenant_id=tenant.id,
            email=email,
            password_hash=pw_hash,
            full_name=full_name,
            role='admin'
        )
        db.add(user)
        db.commit()
        
        # Auto-login: buat token langsung
        token = create_token(
            user_id=user.id,
            tenant_id=tenant.id,
            role=user.role
        )
        
        return jsonify({
            'message': 'Registrasi berhasil! 🎉',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'tenant': {
                    'id': tenant.id,
                    'name': tenant.name,
                    'slug': tenant.slug
                }
            }
        }), 201  # 201 Created
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Registrasi gagal: {str(e)}'}), 500
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# POST /api/auth/google — Login/Register via Google
# ═══════════════════════════════════════════════════════

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """
    Login atau register menggunakan akun Google.
    
    Penjelasan alur:
    ────────────────
    1. Frontend mendapatkan Google ID Token dari Google Sign-In popup
    2. Frontend kirim token ke endpoint ini
    3. Backend verifikasi token ke Google (beneran valid?)
    4. Ambil email + nama dari token
    5. Cek di database:
       - Jika user sudah ada (by google_id atau email) → LOGIN
       - Jika user belum ada → AUTO-REGISTER + LOGIN
    6. Return JWT token CekatIn
    
    Request Body (JSON):
        {
            "token": "eyJhbGci...",           // Google ID Token
            "tenant_slug": "reonshop"         // Optional, default tenant
        }
    
    Response:
        {
            "message": "Login Google berhasil!",
            "token": "eyJhbGci...",            // JWT CekatIn
            "user": { id, email, full_name, avatar_url, ... },
            "is_new_user": true/false
        }
    """
    # Import Google auth module
    try:
        from google_auth import verify_google_token, is_google_auth_configured
    except ImportError:
        return jsonify({'error': 'Google auth module tidak tersedia'}), 500
    
    # Cek apakah Google OAuth sudah dikonfigurasi
    if not is_google_auth_configured():
        return jsonify({
            'error': 'Google OAuth belum dikonfigurasi',
            'hint': 'Set GOOGLE_CLIENT_ID di file .env'
        }), 503  # 503 Service Unavailable
    
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'error': 'Google ID token diperlukan'}), 400
    
    # ── Step 1: Verifikasi Google Token ──
    google_user = verify_google_token(data['token'])
    
    if not google_user:
        return jsonify({'error': 'Google token invalid atau expired'}), 401
    
    google_id = google_user['google_id']
    email = google_user['email'].lower()
    name = google_user['name']
    picture = google_user.get('picture', '')
    tenant_slug = data.get('tenant_slug', 'reonshop').strip().lower()
    
    db = get_db()
    try:
        is_new_user = False
        
        # ── Step 2: Cari user yang sudah ada ──
        # Prioritas: cari by google_id dulu, lalu by email
        user = db.query(User).filter_by(google_id=google_id).first()
        
        if not user:
            # Cek apakah email sudah terdaftar (via register biasa)
            user = db.query(User).filter_by(email=email).first()
            
            if user:
                # Link akun Google ke user yang sudah ada
                user.google_id = google_id
                user.avatar_url = picture
                if not user.full_name and name:
                    user.full_name = name
            else:
                # ── Step 3: User baru → Auto-register ──
                tenant = db.query(Tenant).filter_by(slug=tenant_slug).first()
                
                if not tenant:
                    return jsonify({
                        'error': f'Tenant "{tenant_slug}" tidak ditemukan'
                    }), 404
                
                user = User(
                    tenant_id=tenant.id,
                    email=email,
                    password_hash=None,  # Google-only user, no password
                    full_name=name,
                    google_id=google_id,
                    avatar_url=picture,
                    role='admin'
                )
                db.add(user)
                is_new_user = True
        
        # ── Step 4: Update last_login ──
        user.last_login = datetime.now(timezone.utc)
        if picture and not user.avatar_url:
            user.avatar_url = picture
        db.commit()
        
        # ── Step 5: Buat JWT token CekatIn ──
        tenant = db.query(Tenant).filter_by(id=user.tenant_id).first()
        
        token = create_token(
            user_id=user.id,
            tenant_id=user.tenant_id,
            role=user.role
        )
        
        action = 'Registrasi' if is_new_user else 'Login'
        
        return jsonify({
            'message': f'{action} Google berhasil! 🎉',
            'token': token,
            'is_new_user': is_new_user,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'avatar_url': user.avatar_url,
                'auth_method': 'google',
                'tenant': {
                    'id': tenant.id if tenant else None,
                    'name': tenant.name if tenant else None,
                    'slug': tenant.slug if tenant else None
                }
            }
        }), 201 if is_new_user else 200
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Google login gagal: {str(e)}'}), 500
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# POST /api/auth/login — Login
# ═══════════════════════════════════════════════════════

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login dan dapatkan JWT token.
    
    Request Body:
        {
            "email": "admin@toko.com",
            "password": "password123"
        }
    
    Response:
        {
            "message": "Login berhasil!",
            "token": "eyJhbGci...",
            "user": { id, email, full_name, role, tenant }
        }
    """
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email dan password diperlukan'}), 400
    
    email = data['email'].strip().lower()
    password = data['password']
    
    db = get_db()
    try:
        # Cari user berdasarkan email
        user = db.query(User).filter_by(email=email, is_active=True).first()
        
        if not user:
            return jsonify({'error': 'Email atau password salah'}), 401
        
        # Verifikasi password
        if not user.password_hash:
            return jsonify({
                'error': 'Akun ini menggunakan Google login, silakan login via Google',
                'auth_method': 'google'
            }), 401
        
        if not verify_password(password, user.password_hash):
            return jsonify({'error': 'Email atau password salah'}), 401
        
        # Update last_login
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        
        # Ambil data tenant
        tenant = db.query(Tenant).filter_by(id=user.tenant_id).first()
        
        # Buat JWT token
        token = create_token(
            user_id=user.id,
            tenant_id=user.tenant_id,
            role=user.role
        )
        
        return jsonify({
            'message': 'Login berhasil! 🎉',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'tenant': {
                    'id': tenant.id if tenant else None,
                    'name': tenant.name if tenant else None,
                    'slug': tenant.slug if tenant else None
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Login gagal: {str(e)}'}), 500
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# GET /api/auth/me — Get Current User Info
# ═══════════════════════════════════════════════════════

@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    """
    Ambil info user yang sedang login (dari JWT token).
    
    Header:
        Authorization: Bearer <token>
    
    Response:
        {
            "user": { id, email, full_name, role, tenant, last_login }
        }
    """
    user_id = request.current_user['sub']
    
    db = get_db()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User tidak ditemukan'}), 404
        
        tenant = db.query(Tenant).filter_by(id=user.tenant_id).first()
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'avatar_url': getattr(user, 'avatar_url', ''),
                'auth_method': 'google' if getattr(user, 'google_id', None) else 'email',
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'tenant': {
                    'id': tenant.id if tenant else None,
                    'name': tenant.name if tenant else None,
                    'slug': tenant.slug if tenant else None,
                    'plan': tenant.plan if tenant else None
                }
            }
        })
        
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# PUT /api/auth/password — Ganti Password
# ═══════════════════════════════════════════════════════

@auth_bp.route('/password', methods=['PUT'])
@require_auth
def change_password():
    """
    Ganti password user yang sedang login.
    
    Request Body:
        {
            "current_password": "password_lama",
            "new_password": "password_baru"
        }
    """
    data = request.get_json()
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'error': 'current_password dan new_password diperlukan'}), 400
    
    if len(data['new_password']) < 6:
        return jsonify({'error': 'Password baru minimal 6 karakter'}), 400
    
    user_id = request.current_user['sub']
    
    db = get_db()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User tidak ditemukan'}), 404
        
        # Verifikasi password lama
        if not verify_password(data['current_password'], user.password_hash):
            return jsonify({'error': 'Password lama salah'}), 401
        
        # Update password
        user.password_hash = hash_password(data['new_password'])
        db.commit()
        
        return jsonify({'message': 'Password berhasil diubah! 🔒'})
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Gagal mengubah password: {str(e)}'}), 500
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# POST /api/auth/refresh — Refresh Token
# ═══════════════════════════════════════════════════════

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """
    Refresh JWT token yang hampir expired.
    
    Request Body:
        { "token": "eyJhbGci..." }
    
    Response:
        { "token": "eyJhbGci..." }  (token baru)
    """
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'error': 'Token diperlukan'}), 400
    
    new_token = refresh_token(data['token'])
    
    if not new_token:
        return jsonify({'error': 'Token invalid, silakan login ulang'}), 401
    
    return jsonify({
        'message': 'Token berhasil di-refresh',
        'token': new_token
    })


# ═══════════════════════════════════════════════════════
# GET /api/auth/config — Client Config
# ═══════════════════════════════════════════════════════

@auth_bp.route('/config', methods=['GET'])
def auth_config():
    """
    Return konfigurasi auth untuk frontend.
    
    Penjelasan:
    - Frontend perlu tahu GOOGLE_CLIENT_ID untuk menampilkan 
      tombol "Login with Google"
    - Jika Google OAuth belum dikonfigurasi, frontend hide tombol-nya
    
    Response:
        {
            "google_enabled": true/false,
            "google_client_id": "xxx.apps.googleusercontent.com"
        }
    """
    try:
        from google_auth import GOOGLE_CLIENT_ID, is_google_auth_configured
        google_enabled = is_google_auth_configured()
        client_id = GOOGLE_CLIENT_ID if google_enabled else None
    except ImportError:
        google_enabled = False
        client_id = None
    
    return jsonify({
        'google_enabled': google_enabled,
        'google_client_id': client_id,
        'email_enabled': True  # Email+password selalu tersedia
    })
