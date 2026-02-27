"""
CekatIn - Widget API Routes
============================================================
Melayani request dari embeddable chat widget (dipasang di web client).
Widget berjalan di domain yang berbeda (cross-origin), jadi tidak pakai auth JWT.
Hanya pakai `tenant_slug` (X-Tenant-Slug header) dan `session_id`.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime

# Import dari backend (karena ini bagian dari monolithic Flask app)
try:
    from database import get_db
    from db_models import Tenant, Conversation, Message
    from db_service import get_or_create_conversation, get_tenant_by_slug
    DB_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Widget Database tidak tersedia: {e}")
    DB_AVAILABLE = False

widget_bp = Blueprint('widget_bp', __name__)

# ============================================================
# Route 1: Get Widget Config
# ============================================================
@widget_bp.route('/api/widget/config', methods=['GET'])
def get_config():
    """
    Ambil konfigurasi tampilan widget (warna, nama bot, dll).
    Widget memanggil ini saat load pertama kali.
    """
    tenant_slug = request.headers.get('X-Tenant-Slug') or request.args.get('tenant')
    
    if not tenant_slug:
        return jsonify({'error': 'Tenant slug is required'}), 400

    if not DB_AVAILABLE:
        # Fallback config jika DB offline
        return jsonify({
            'primaryColor': '#4F46E5',  # Indigo (default CekatIn)
            'botName': 'CekatIn Virtual Assistant',
            'greetingMessage': 'Halo! Ada yang bisa kami bantu?',
            'companyName': tenant_slug.capitalize(),
            'logoUrl': ''
        })

    db = get_db()
    try:
        tenant = get_tenant_by_slug(db, tenant_slug)
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404
            
        return jsonify({
            'primaryColor': '#4F46E5',  # Bisa ditambahkan ke Tenant model nanti jika mau di-customize per tenant
            'botName': f'{tenant.name} Support',
            'greetingMessage': f'Halo! Selamat datang di {tenant.name}. Ada yang bisa dibantu?',
            'companyName': tenant.name,
            'logoUrl': tenant.logo_url or ''
        })
    finally:
        db.close()


# ============================================================
# Route 2: Get Chat History
# ============================================================
@widget_bp.route('/api/widget/history', methods=['GET'])
def get_history():
    """
    Ambil riwayat obrolan pengunjung berdasarkan session_id.
    Agar kalau pagenya direfresh, chat tidak hilang.
    """
    tenant_slug = request.headers.get('X-Tenant-Slug') or request.args.get('tenant')
    session_id = request.args.get('session_id')
    
    if not tenant_slug or not session_id:
        return jsonify({'error': 'Tenant slug and session_id are required'}), 400
        
    if not DB_AVAILABLE:
        return jsonify({'messages': []})
        
    db = get_db()
    try:
        # Cek tenant
        tenant = get_tenant_by_slug(db, tenant_slug)
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404
            
        # Cek conversation
        conv = db.query(Conversation).filter_by(tenant_id=tenant.id, session_id=session_id).first()
        if not conv:
            return jsonify({'messages': []})
            
        # Ambil messages
        messages = db.query(Message).filter_by(conversation_id=conv.id).order_by(Message.created_at.asc()).all()
        
        history = [
            {
                'id': msg.id,
                'sender': msg.sender,
                'text': msg.text,
                'timestamp': msg.created_at.isoformat()
            }
            for msg in messages
        ]
        
        return jsonify({'messages': history})
    finally:
        db.close()

# Catatan: Route /api/widget/chat (POST) tidak perlu dibuat terpisah.
# Widget bisa langsung tembak ke /api/chat yang sudah ada di app.py,
# karena mekanisme klasifikasi dan integrasi DB-nya sudah lengkap di sana.
# Di app.py, /api/chat sudah menerima session_id dan X-Tenant-Slug,
# dan sudah menyimpan ke Conversation & Message table.
