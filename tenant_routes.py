"""
CekatIn — Tenant Routes (Blueprint)
======================================
Endpoint untuk mengelola tenant (toko/client) di sistem multi-tenant.

Penjelasan:
- Tenant = 1 toko/UMKM yang menggunakan CekatIn
- Setiap tenant punya data sendiri: intents, model, chat history
- Endpoint ini memungkinkan CRUD tenant dari dashboard admin

Endpoint:
- POST   /api/tenants              → Buat tenant baru
- GET    /api/tenants              → List semua tenant
- GET    /api/tenants/<slug>       → Detail 1 tenant
- PUT    /api/tenants/<slug>       → Update tenant
- POST   /api/tenants/<slug>/retrain → Retrain model tenant

Author: CekatIn Team
"""

from flask import Blueprint, request, jsonify
from database import get_db
from db_models import Tenant, Intent, Pattern, Response
from middleware import require_auth, require_role
import re

# ═══════════════════════════════════════════════════════
# Blueprint Registration
# ═══════════════════════════════════════════════════════
# Blueprint ini akan di-import dan di-register di app.py:
#   from tenant_routes import tenant_bp
#   app.register_blueprint(tenant_bp)

tenant_bp = Blueprint('tenants', __name__, url_prefix='/api/tenants')


# ═══════════════════════════════════════════════════════
# Helper: Validasi Slug
# ═══════════════════════════════════════════════════════

def _validate_slug(slug: str) -> str:
    """
    Validasi dan sanitize tenant slug.
    
    Penjelasan:
    - Slug dipakai sebagai ID unik di URL dan folder model
    - Harus lowercase, huruf/angka/dash saja
    - Contoh valid: "reonshop", "toko-baju", "warung123"
    - Contoh invalid: "Toko Baju!", "reon shop", "toko@baju"
    
    Args:
        slug: Slug yang mau divalidasi
        
    Returns:
        str: Slug yang sudah disanitize
        
    Raises:
        ValueError: Jika slug tidak valid
    """
    # Sanitize: lowercase, replace spasi dengan dash
    slug = slug.lower().strip().replace(' ', '-')
    
    # Hapus karakter non-alphanumeric kecuali dash
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    
    # Hapus dash berulang dan dash di awal/akhir
    slug = re.sub(r'-+', '-', slug).strip('-')
    
    if len(slug) < 3:
        raise ValueError("Slug minimal 3 karakter")
    if len(slug) > 50:
        raise ValueError("Slug maksimal 50 karakter")
    
    return slug


def _tenant_to_dict(tenant):
    """
    Konversi object Tenant ke dictionary untuk JSON response.
    
    Args:
        tenant: Tenant model object
        
    Returns:
        dict: Data tenant yang aman untuk dikirim ke client
    """
    return {
        'id': tenant.id,
        'name': tenant.name,
        'slug': tenant.slug,
        'tagline': tenant.tagline or '',
        'description': tenant.description or '',
        'logo_url': tenant.logo_url or '',
        'whatsapp': tenant.whatsapp or '',
        'email': tenant.email or '',
        'address': tenant.address or '',
        'operating_hours': tenant.operating_hours or {},
        'plan': tenant.plan or 'starter',
        'is_active': tenant.is_active,
        'created_at': tenant.created_at.isoformat() if tenant.created_at else None
    }


# ═══════════════════════════════════════════════════════
# POST /api/tenants — Buat Tenant Baru
# ═══════════════════════════════════════════════════════

@tenant_bp.route('', methods=['POST'])
@require_auth
@require_role('superadmin', 'admin')
def create_tenant():
    """
    Buat tenant (toko) baru.
    
    Penjelasan alur:
    1. Terima data: name, slug (opsional, auto-generate dari name)
    2. Validasi slug unik
    3. Buat record tenant di database
    4. Return data tenant yang baru dibuat
    
    Request Body:
        {
            "name": "Toko ReonShop",
            "slug": "reonshop",          // opsional
            "tagline": "Gadget Terlengkap",
            "whatsapp": "628123456789",
            "email": "admin@reonshop.com"
        }
    
    Response (201):
        {
            "message": "Tenant berhasil dibuat!",
            "tenant": { id, name, slug, ... }
        }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body diperlukan'}), 400
    
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Nama tenant diperlukan'}), 400
    
    # Generate atau validasi slug
    slug = data.get('slug', '')
    if not slug:
        # Auto-generate dari name: "Toko Reon Shop" → "toko-reon-shop"
        slug = name
    
    try:
        slug = _validate_slug(slug)
    except ValueError as e:
        return jsonify({'error': f'Slug tidak valid: {e}'}), 400
    
    db = get_db()
    try:
        # Cek slug sudah dipakai atau belum
        existing = db.query(Tenant).filter_by(slug=slug).first()
        if existing:
            return jsonify({
                'error': f"Slug '{slug}' sudah digunakan oleh tenant lain",
                'suggestion': f"Coba: {slug}-2 atau {slug}-baru"
            }), 409  # 409 Conflict
        
        # Buat tenant baru
        tenant = Tenant(
            name=name,
            slug=slug,
            tagline=data.get('tagline', ''),
            description=data.get('description', ''),
            logo_url=data.get('logo_url', ''),
            whatsapp=data.get('whatsapp', ''),
            email=data.get('email', ''),
            address=data.get('address', ''),
            operating_hours=data.get('operating_hours', {}),
            plan=data.get('plan', 'starter')
        )
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        print(f"🏢 Tenant baru dibuat: {name} (slug: {slug})")
        
        return jsonify({
            'message': 'Tenant berhasil dibuat!',
            'tenant': _tenant_to_dict(tenant)
        }), 201
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Gagal membuat tenant: {str(e)}'}), 500
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# GET /api/tenants — List Semua Tenant
# ═══════════════════════════════════════════════════════

@tenant_bp.route('', methods=['GET'])
@require_auth
@require_role('superadmin')
def list_tenants():
    """
    List semua tenant (hanya superadmin).
    
    Query Params:
        ?active_only=true   → hanya tenant aktif
        ?page=1&limit=20    → pagination
    
    Response:
        {
            "tenants": [ { id, name, slug, ... }, ... ],
            "total": 15
        }
    """
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    page = max(1, int(request.args.get('page', 1)))
    limit = min(100, max(1, int(request.args.get('limit', 50))))
    offset = (page - 1) * limit
    
    db = get_db()
    try:
        query = db.query(Tenant)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        total = query.count()
        tenants = query.order_by(Tenant.created_at.desc()).offset(offset).limit(limit).all()
        
        return jsonify({
            'tenants': [_tenant_to_dict(t) for t in tenants],
            'total': total,
            'page': page,
            'limit': limit
        })
        
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# GET /api/tenants/<slug> — Detail 1 Tenant
# ═══════════════════════════════════════════════════════

@tenant_bp.route('/<slug>', methods=['GET'])
@require_auth
def get_tenant(slug):
    """
    Ambil detail tenant berdasarkan slug.
    
    Penjelasan:
    - Admin hanya bisa lihat tenant milik sendiri
    - Superadmin bisa lihat semua tenant
    
    Response:
        {
            "tenant": { id, name, slug, ... },
            "stats": {
                "intents_count": 25,
                "users_count": 2
            }
        }
    """
    user = request.current_user
    
    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=slug).first()
        
        if not tenant:
            return jsonify({'error': f"Tenant '{slug}' tidak ditemukan"}), 404
        
        # Cek akses: admin hanya bisa lihat tenant sendiri
        if user.get('role') != 'superadmin' and user.get('tenant_id') != tenant.id:
            return jsonify({'error': 'Akses ditolak — bukan tenant Anda'}), 403
        
        # Hitung statistik
        intents_count = db.query(Intent).filter_by(
            tenant_id=tenant.id, is_active=True
        ).count()
        
        return jsonify({
            'tenant': _tenant_to_dict(tenant),
            'stats': {
                'intents_count': intents_count
            }
        })
        
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# PUT /api/tenants/<slug> — Update Tenant
# ═══════════════════════════════════════════════════════

@tenant_bp.route('/<slug>', methods=['PUT'])
@require_auth
@require_role('admin', 'superadmin')
def update_tenant(slug):
    """
    Update data tenant (nama, tagline, kontak, dll).
    
    Request Body (semua field opsional):
        {
            "name": "Nama Baru",
            "tagline": "Tagline Baru",
            "whatsapp": "628999999999",
            "operating_hours": {"senin": "09:00-21:00"}
        }
    
    Response:
        {
            "message": "Tenant berhasil diupdate!",
            "tenant": { ... }
        }
    """
    user = request.current_user
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body diperlukan'}), 400
    
    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=slug).first()
        
        if not tenant:
            return jsonify({'error': f"Tenant '{slug}' tidak ditemukan"}), 404
        
        # Cek akses: admin hanya bisa update tenant sendiri
        if user.get('role') != 'superadmin' and user.get('tenant_id') != tenant.id:
            return jsonify({'error': 'Akses ditolak — bukan tenant Anda'}), 403
        
        # Update field yang dikirim
        updatable_fields = [
            'name', 'tagline', 'description', 'logo_url', 
            'whatsapp', 'email', 'address', 'operating_hours'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(tenant, field, data[field])
        
        # Superadmin bisa update plan dan is_active
        if user.get('role') == 'superadmin':
            if 'plan' in data:
                tenant.plan = data['plan']
            if 'is_active' in data:
                tenant.is_active = data['is_active']
        
        db.commit()
        db.refresh(tenant)
        
        return jsonify({
            'message': 'Tenant berhasil diupdate!',
            'tenant': _tenant_to_dict(tenant)
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Gagal update tenant: {str(e)}'}), 500
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# POST /api/tenants/<slug>/retrain — Retrain Model
# ═══════════════════════════════════════════════════════

@tenant_bp.route('/<slug>/retrain', methods=['POST'])
@require_auth
@require_role('admin', 'superadmin')
def retrain_tenant_model(slug):
    """
    Retrain NLP model untuk tenant tertentu.
    
    Penjelasan:
    - Mengambil tenant_manager dari Flask app context
    - Memanggil retrain_tenant_by_slug() di TenantManager
    - Model baru disimpan di models/{slug}/chatbot_pipeline.pkl
    
    Response:
        {
            "message": "Model berhasil di-retrain!",
            "result": { status, tenant_slug, intents_count }
        }
    """
    from flask import current_app
    
    user = request.current_user
    
    # Cek akses
    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=slug).first()
        if not tenant:
            return jsonify({'error': f"Tenant '{slug}' tidak ditemukan"}), 404
        
        if user.get('role') != 'superadmin' and user.get('tenant_id') != tenant.id:
            return jsonify({'error': 'Akses ditolak — bukan tenant Anda'}), 403
    finally:
        db.close()
    
    # Retrain via TenantManager
    try:
        tenant_manager = current_app.config.get('TENANT_MANAGER')
        if not tenant_manager:
            return jsonify({'error': 'TenantManager tidak tersedia'}), 500
        
        result = tenant_manager.retrain_tenant_by_slug(slug)
        
        return jsonify({
            'message': f"Model tenant '{slug}' berhasil di-retrain!",
            'result': result
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': f'Gagal retrain: {str(e)}'}), 500
