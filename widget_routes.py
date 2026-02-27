"""
CekatIn — Widget API Routes
============================================================
Blueprint Flask khusus untuk melayani embeddable chat widget.

Endpoint:
  GET  /api/widget/config   → Ambil konfigurasi tampilan widget
  GET  /api/widget/history  → Ambil riwayat chat berdasarkan session_id

Catatan: Widget mengirim pesan melalui /api/chat yang sudah ada di app.py
(multi-tenant via header X-Tenant-Slug sudah ditangani di sana).
"""

from flask import Blueprint, request, jsonify

widget_bp = Blueprint('widget_bp', __name__)

# Ambil nama bot dari satu sumber kebenaran (nlp_engine.py)
# Dengan ini, ganti nama Cika di nlp_engine.py → otomatis berubah di widget juga
try:
    from nlp_engine import AGENT_NAME
except ImportError:
    AGENT_NAME = 'Cika'  # Fallback jika import gagal


def _get_db_components():
    """Lazy import DB components untuk menghindari circular imports."""
    try:
        from database import get_db
        from db_models import Tenant, Conversation, Message
        return get_db, Tenant, Conversation, Message, True
    except Exception as e:
        print(f"⚠️ Widget DB tidak tersedia: {e}")
        return None, None, None, None, False


# ============================================================
# Route: GET /api/widget/config
# ============================================================

@widget_bp.route('/api/widget/config', methods=['GET'])
def get_widget_config():
    """
    Ambil konfigurasi tampilan widget untuk tenant tertentu.
    Widget memanggil endpoint ini saat pertama kali load.

    Query params:
        tenant (str): Slug tenant, bisa juga via header X-Tenant-Slug

    Response JSON:
        {
            "primaryColor": "#4F46E5",
            "botName": "Support Bot",
            "greetingMessage": "Halo! Ada yang bisa dibantu?",
            "companyName": "Toko ReonShop",
            "logoUrl": ""
        }
    """
    tenant_slug = (
        request.headers.get('X-Tenant-Slug') or
        request.args.get('tenant')
    )

    if not tenant_slug:
        return jsonify({'error': 'Parameter tenant diperlukan'}), 400

    get_db, Tenant, Conversation, Message, db_ok = _get_db_components()

    # --- Fallback config jika DB offline ---
    if not db_ok or get_db is None:
        return jsonify({
            'primaryColor': '#4F46E5',
            'botName': AGENT_NAME,
            'greetingMessage': f'Halo! Ada yang bisa {AGENT_NAME} bantu hari ini?',
            'companyName': tenant_slug.replace('-', ' ').title(),
            'logoUrl': ''
        })

    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()

        if not tenant:
            return jsonify({'error': f"Tenant '{tenant_slug}' tidak ditemukan"}), 404

        return jsonify({
            'primaryColor': '#4F46E5',
            'botName': AGENT_NAME,
            'greetingMessage': (
                f'Halo! Selamat datang di {tenant.name}. '
                f'Ada yang bisa {AGENT_NAME} bantu?'
            ),
            'companyName': tenant.name,
            'logoUrl': tenant.logo_url or ''
        })
    finally:
        db.close()


# ============================================================
# Route: GET /api/widget/history
# ============================================================

@widget_bp.route('/api/widget/history', methods=['GET'])
def get_widget_history():
    """
    Ambil riwayat percakapan berdasarkan session_id visitor.
    Digunakan widget untuk memuat ulang chat history setelah
    user refresh halaman.

    Query params:
        tenant (str)     : Slug tenant
        session_id (str) : Session ID dari localStorage widget

    Response JSON:
        {
            "messages": [
                {"id": 1, "sender": "bot", "text": "Halo!", "timestamp": "..."},
                {"id": 2, "sender": "user", "text": "Ada promo?", "timestamp": "..."},
                ...
            ]
        }
    """
    tenant_slug = (
        request.headers.get('X-Tenant-Slug') or
        request.args.get('tenant')
    )
    session_id = request.args.get('session_id')

    if not tenant_slug or not session_id:
        return jsonify({'error': 'Parameter tenant dan session_id diperlukan'}), 400

    get_db, Tenant, Conversation, Message, db_ok = _get_db_components()

    if not db_ok:
        return jsonify({'messages': []})

    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=tenant_slug, is_active=True).first()
        if not tenant:
            return jsonify({'messages': []})

        # Cari conversation yang matching
        conv = db.query(Conversation).filter_by(
            tenant_id=tenant.id,
            session_id=session_id
        ).first()

        if not conv:
            return jsonify({'messages': []})

        # Ambil semua pesan, urutkan dari terlama ke terbaru
        messages = (
            db.query(Message)
            .filter_by(conversation_id=conv.id)
            .order_by(Message.created_at.asc())
            .all()
        )

        history = [
            {
                'id': msg.id,
                'sender': msg.sender,
                'text': msg.text,
                'timestamp': msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in messages
        ]

        return jsonify({'messages': history})
    finally:
        db.close()
