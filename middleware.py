"""
CekatIn — Authentication Middleware
=====================================
Decorators untuk melindungi endpoint yang memerlukan autentikasi.

Penjelasan Middleware:
- Middleware = kode yang berjalan SEBELUM handler endpoint
- Digunakan sebagai "penjaga pintu" — cek dulu sebelum masuk
- Implementasi menggunakan Python decorator (@require_auth)

Cara pakai:
    from middleware import require_auth, require_role

    @app.route('/api/admin/intents')
    @require_auth                    # Harus login
    def get_intents():
        tenant_id = request.current_user['tenant_id']
        ...

    @app.route('/api/admin/users')
    @require_auth
    @require_role('superadmin')      # Harus superadmin
    def get_users():
        ...

Alur middleware:
    Request masuk → Cek header Authorization → Decode JWT → 
    Jika valid → lanjut ke handler endpoint
    Jika tidak → return 401 Unauthorized
"""

from functools import wraps
from flask import request, jsonify
from auth import verify_token


def require_auth(f):
    """
    Decorator: Endpoint ini HARUS login.
    
    Penjelasan:
    1. Ambil token dari header "Authorization: Bearer <token>"
    2. Verifikasi token (cek signature + expiry)
    3. Jika valid → simpan user data di request.current_user
    4. Jika tidak → return 401
    
    Setelah melewati decorator ini, handler bisa akses:
    - request.current_user['sub']       → user_id
    - request.current_user['tenant_id'] → tenant_id
    - request.current_user['role']      → role
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # ── Step 1: Ambil header Authorization ──
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return jsonify({
                'error': 'Token diperlukan',
                'message': 'Tambahkan header: Authorization: Bearer <token>'
            }), 401
        
        # ── Step 2: Ekstrak token ──
        # Format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
        parts = auth_header.split(' ')
        
        if len(parts) != 2 or parts[0] != 'Bearer':
            return jsonify({
                'error': 'Format token salah',
                'message': 'Format yang benar: Authorization: Bearer <token>'
            }), 401
        
        token = parts[1]
        
        # ── Step 3: Verifikasi token ──
        payload = verify_token(token)
        
        if payload is None:
            return jsonify({
                'error': 'Token invalid atau expired',
                'message': 'Silakan login ulang untuk mendapat token baru'
            }), 401
        
        # ── Step 4: Simpan data user di request ──
        # Ini memungkinkan handler mengakses info user tanpa decode ulang
        request.current_user = payload
        
        return f(*args, **kwargs)
    
    return decorated


def require_role(*allowed_roles):
    """
    Decorator: Endpoint ini HANYA boleh diakses oleh role tertentu.
    
    Penjelasan:
    - Harus dipasang SETELAH @require_auth
    - Cek apakah role user termasuk dalam daftar yang diizinkan
    
    Args:
        *allowed_roles: Role yang diizinkan, misal 'admin', 'superadmin'
    
    Contoh:
        @require_auth
        @require_role('admin', 'superadmin')
        def delete_intent():
            ...  # Hanya admin dan superadmin yang bisa akses
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            
            if not user:
                return jsonify({
                    'error': 'Autentikasi diperlukan',
                    'message': 'Gunakan @require_auth sebelum @require_role'
                }), 401
            
            user_role = user.get('role', '')
            
            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Akses ditolak',
                    'message': f'Endpoint ini memerlukan role: {", ".join(allowed_roles)}. Role Anda: {user_role}'
                }), 403  # 403 Forbidden (bukan 401)
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator
