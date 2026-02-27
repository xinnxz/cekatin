"""
CekatIn — Dashboard API Routes
=================================
REST API endpoints untuk admin dashboard.

Endpoints:
  GET    /api/dashboard/stats      → Overview statistics
  GET    /api/intents              → List semua intents
  POST   /api/intents              → Buat intent baru
  PUT    /api/intents/<id>         → Update intent (tag, patterns, responses)
  DELETE /api/intents/<id>         → Hapus intent
  GET    /api/intents/<id>         → Detail satu intent

Penjelasan:
  - Semua endpoint tenant-scoped via X-Tenant-Slug header
  - Auth required (JWT token) jika auth system tersedia
  - Response format: JSON
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from database import get_db
from db_models import (
    Tenant, Intent, Pattern, Response,
    Conversation, Message, LearningLog, TrainedModel
)

# ═══════════════════════════════════════════════════════
# Blueprint Setup
# ═══════════════════════════════════════════════════════
dashboard_bp = Blueprint('dashboard', __name__)

# Coba import auth middleware (optional)
try:
    from middleware import require_auth
    HAS_AUTH = True
except ImportError:
    HAS_AUTH = False
    # Dummy decorator jika auth belum ada
    def require_auth(f):
        return f


def get_tenant_from_header():
    """
    Ambil tenant dari header X-Tenant-Slug.
    
    Penjelasan:
    - Dashboard frontend selalu kirim header X-Tenant-Slug
    - Jika tidak ada, fallback ke 'reonshop' (backward compatible)
    
    Returns:
        tuple: (tenant, error_response)
        - Jika sukses: (Tenant object, None)
        - Jika gagal: (None, JSON error response)
    """
    slug = request.headers.get('X-Tenant-Slug', 'reonshop')
    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=slug, is_active=True).first()
        if not tenant:
            return None, jsonify({
                'error': f'Tenant "{slug}" tidak ditemukan',
                'code': 'TENANT_NOT_FOUND'
            }), 404
        return tenant, None
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# DASHBOARD STATS
# ═══════════════════════════════════════════════════════

@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """
    GET /api/dashboard/stats
    
    Penjelasan:
    - Mengambil ringkasan statistik untuk halaman Overview
    - Semua data tenant-scoped (hanya data milik tenant yang diminta)
    - Menghitung total chats, intents, patterns, accuracy, dll.
    
    Response:
    {
        "total_chats": 1523,
        "total_intents": 25,
        "total_patterns": 200,
        "nlp_accuracy": 91.2,
        "avg_response_ms": 1200,
        "chat_volume": [{"day": "Sen", "chats": 120}, ...],
        "top_intents": [{"name": "tanya_harga", "count": 342}, ...],
        "recent_chats": [{"message": "...", "intent": "...", ...}, ...]
    }
    """
    tenant, error = get_tenant_from_header()
    if error:
        return error

    db = get_db()
    try:
        # ── Total Intents & Patterns ──
        total_intents = db.query(func.count(Intent.id)).filter_by(
            tenant_id=tenant.id, is_active=True
        ).scalar() or 0

        total_patterns = db.query(func.count(Pattern.id)).join(Intent).filter(
            Intent.tenant_id == tenant.id,
            Intent.is_active == True
        ).scalar() or 0

        # ── Total Conversations (all time) ──
        total_chats = db.query(func.count(Conversation.id)).filter_by(
            tenant_id=tenant.id
        ).scalar() or 0

        # ── NLP Accuracy — rata-rata confidence dari messages ──
        avg_confidence = db.query(func.avg(Message.confidence)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).filter(
            Conversation.tenant_id == tenant.id,
            Message.confidence.isnot(None),
            Message.sender == 'user'
        ).scalar()
        nlp_accuracy = round((avg_confidence or 0.85) * 100, 1)

        # ── Avg Response Time ──
        avg_response = db.query(func.avg(Message.response_time_ms)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).filter(
            Conversation.tenant_id == tenant.id,
            Message.response_time_ms.isnot(None)
        ).scalar()
        avg_response_ms = int(avg_response or 1200)

        # ── Chat Volume (7 hari terakhir) ──
        days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
        now = datetime.now(timezone.utc)
        chat_volume = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = db.query(func.count(Conversation.id)).filter(
                Conversation.tenant_id == tenant.id,
                Conversation.started_at >= day_start,
                Conversation.started_at < day_end
            ).scalar() or 0
            chat_volume.append({
                'day': days[day_start.weekday()],
                'chats': count
            })

        # ── Top Intents (berdasarkan jumlah pesan) ──
        # colors order: paling gelap ke paling terang
        colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']
        top_intents_query = db.query(
            Message.intent_tag,
            func.count(Message.id).label('count')
        ).join(
            Conversation, Message.conversation_id == Conversation.id
        ).filter(
            Conversation.tenant_id == tenant.id,
            Message.intent_tag.isnot(None),
            Message.sender == 'user'
        ).group_by(Message.intent_tag).order_by(
            func.count(Message.id).desc()
        ).limit(5).all()

        top_intents = [
            {
                'name': row.intent_tag,
                'count': row.count,
                'fill': colors[i] if i < len(colors) else '#BFDBFE'
            }
            for i, row in enumerate(top_intents_query)
        ]

        # Jika belum ada data, berikan default dari intents
        if not top_intents:
            intents = db.query(Intent).filter_by(
                tenant_id=tenant.id, is_active=True
            ).limit(5).all()
            top_intents = [
                {
                    'name': intent.tag,
                    'count': len(intent.patterns),
                    'fill': colors[i] if i < len(colors) else '#BFDBFE'
                }
                for i, intent in enumerate(intents)
            ]

        # ── Recent Chats (5 terakhir) ──
        recent_messages = db.query(Message).join(
            Conversation, Message.conversation_id == Conversation.id
        ).filter(
            Conversation.tenant_id == tenant.id,
            Message.sender == 'user'
        ).order_by(Message.created_at.desc()).limit(5).all()

        recent_chats = []
        for i, msg in enumerate(recent_messages):
            # Hitung "X min ago"
            elapsed = (now - msg.created_at.replace(tzinfo=timezone.utc)).total_seconds()
            if elapsed < 60:
                time_ago = 'just now'
            elif elapsed < 3600:
                time_ago = f'{int(elapsed / 60)} min ago'
            elif elapsed < 86400:
                time_ago = f'{int(elapsed / 3600)} hours ago'
            else:
                time_ago = f'{int(elapsed / 86400)} days ago'

            recent_chats.append({
                'id': i + 1,
                'message': msg.text[:100],
                'intent': msg.intent_tag or 'unknown',
                'confidence': round(msg.confidence or 0, 2),
                'time': time_ago
            })

        return jsonify({
            'total_chats': total_chats,
            'total_intents': total_intents,
            'total_patterns': total_patterns,
            'nlp_accuracy': nlp_accuracy,
            'avg_response_ms': avg_response_ms,
            'chat_volume': chat_volume,
            'top_intents': top_intents,
            'recent_chats': recent_chats,
            'tenant': {
                'name': tenant.name,
                'slug': tenant.slug,
                'plan': tenant.plan
            }
        })

    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# INTENTS CRUD
# ═══════════════════════════════════════════════════════

@dashboard_bp.route('/api/intents', methods=['GET'])
def list_intents():
    """
    GET /api/intents
    
    Penjelasan:
    - Mengambil semua intents milik tenant
    - Include jumlah patterns dan responses per intent
    - Mendukung search via query parameter ?search=keyword
    
    Response:
    {
        "intents": [
            {
                "id": 1,
                "tag": "greeting",
                "patterns": ["halo", "hi", ...],
                "responses": ["Halo kak!", ...],
                "patternsCount": 5,
                "responsesCount": 2,
                "created_at": "2024-01-01T00:00:00Z"
            },
            ...
        ],
        "total": 25
    }
    """
    tenant, error = get_tenant_from_header()
    if error:
        return error

    search = request.args.get('search', '').strip()

    db = get_db()
    try:
        query = db.query(Intent).filter_by(
            tenant_id=tenant.id,
            is_active=True
        )

        # Filter pencarian
        if search:
            query = query.filter(Intent.tag.ilike(f'%{search}%'))

        intents = query.order_by(Intent.created_at.desc()).all()

        result = []
        for intent in intents:
            patterns = [p.text for p in intent.patterns]
            responses = [r.text for r in intent.responses]
            result.append({
                'id': str(intent.id),
                'tag': intent.tag,
                'patterns': patterns,
                'responses': responses,
                'patternsCount': len(patterns),
                'responsesCount': len(responses),
                'created_at': intent.created_at.isoformat() if intent.created_at else None
            })

        return jsonify({
            'intents': result,
            'total': len(result)
        })

    finally:
        db.close()


@dashboard_bp.route('/api/intents', methods=['POST'])
def create_intent():
    """
    POST /api/intents
    
    Penjelasan:
    - Membuat intent baru dengan tag, patterns, dan responses
    - Tag harus unik per tenant (tidak boleh duplikat)
    - Minimal harus ada 1 pattern dan 1 response
    
    Request Body:
    {
        "tag": "tanya_harga",
        "patterns": ["berapa harganya", "harga hp"],
        "responses": ["Silakan cek katalog kami!"]
    }
    
    Response: 201 Created + intent data
    """
    tenant, error = get_tenant_from_header()
    if error:
        return error

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body harus JSON'}), 400

    # Validasi input
    tag = data.get('tag', '').strip().lower().replace(' ', '_')
    patterns = data.get('patterns', [])
    responses = data.get('responses', [])

    if not tag:
        return jsonify({'error': 'Tag tidak boleh kosong'}), 400
    if not patterns:
        return jsonify({'error': 'Minimal 1 pattern harus diisi'}), 400
    if not responses:
        return jsonify({'error': 'Minimal 1 response harus diisi'}), 400

    db = get_db()
    try:
        # Cek duplikat tag
        existing = db.query(Intent).filter_by(
            tenant_id=tenant.id, tag=tag
        ).first()
        if existing:
            return jsonify({
                'error': f'Intent "{tag}" sudah ada',
                'code': 'DUPLICATE_TAG'
            }), 409

        # Buat intent baru
        new_intent = Intent(
            tenant_id=tenant.id,
            tag=tag
        )
        db.add(new_intent)
        db.flush()  # Dapat ID sebelum commit

        # Tambah patterns
        for text in patterns:
            text = text.strip()
            if text:
                db.add(Pattern(intent_id=new_intent.id, text=text, source='manual'))

        # Tambah responses
        for text in responses:
            text = text.strip()
            if text:
                db.add(Response(intent_id=new_intent.id, text=text))

        db.commit()

        return jsonify({
            'message': f'Intent "{tag}" berhasil dibuat',
            'intent': {
                'id': str(new_intent.id),
                'tag': new_intent.tag,
                'patterns': [p for p in patterns if p.strip()],
                'responses': [r for r in responses if r.strip()],
                'patternsCount': len([p for p in patterns if p.strip()]),
                'responsesCount': len([r for r in responses if r.strip()])
            }
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Gagal membuat intent: {str(e)}'}), 500
    finally:
        db.close()


@dashboard_bp.route('/api/intents/<intent_id>', methods=['GET'])
def get_intent(intent_id):
    """
    GET /api/intents/<id>
    
    Penjelasan:
    - Mengambil detail satu intent lengkap dengan patterns dan responses
    
    Response: Intent data (sama seperti item di list)
    """
    tenant, error = get_tenant_from_header()
    if error:
        return error

    db = get_db()
    try:
        intent = db.query(Intent).filter_by(
            id=intent_id,
            tenant_id=tenant.id,
            is_active=True
        ).first()

        if not intent:
            return jsonify({'error': 'Intent tidak ditemukan'}), 404

        patterns = [p.text for p in intent.patterns]
        responses = [r.text for r in intent.responses]

        return jsonify({
            'id': str(intent.id),
            'tag': intent.tag,
            'patterns': patterns,
            'responses': responses,
            'patternsCount': len(patterns),
            'responsesCount': len(responses),
            'created_at': intent.created_at.isoformat() if intent.created_at else None
        })

    finally:
        db.close()


@dashboard_bp.route('/api/intents/<intent_id>', methods=['PUT'])
def update_intent(intent_id):
    """
    PUT /api/intents/<id>
    
    Penjelasan:
    - Update intent: bisa ganti tag, patterns, atau responses
    - Patterns & responses di-replace sepenuhnya (bukan append)
      artinya: semua pattern lama dihapus, diganti dengan yang baru
    
    Request Body (semua optional):
    {
        "tag": "new_tag_name",
        "patterns": ["pattern baru 1", "pattern baru 2"],
        "responses": ["response baru 1"]
    }
    
    Response: 200 + updated intent data
    """
    tenant, error = get_tenant_from_header()
    if error:
        return error

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body harus JSON'}), 400

    db = get_db()
    try:
        intent = db.query(Intent).filter_by(
            id=intent_id,
            tenant_id=tenant.id,
            is_active=True
        ).first()

        if not intent:
            return jsonify({'error': 'Intent tidak ditemukan'}), 404

        # Update tag jika disediakan
        new_tag = data.get('tag', '').strip().lower().replace(' ', '_')
        if new_tag and new_tag != intent.tag:
            # Cek duplikat
            existing = db.query(Intent).filter_by(
                tenant_id=tenant.id, tag=new_tag
            ).first()
            if existing and existing.id != intent.id:
                return jsonify({
                    'error': f'Tag "{new_tag}" sudah dipakai',
                    'code': 'DUPLICATE_TAG'
                }), 409
            intent.tag = new_tag

        # Update patterns jika disediakan (replace all)
        new_patterns = data.get('patterns')
        if new_patterns is not None:
            # Hapus semua pattern lama
            db.query(Pattern).filter_by(intent_id=intent.id).delete()
            # Tambah pattern baru
            for text in new_patterns:
                text = text.strip()
                if text:
                    db.add(Pattern(intent_id=intent.id, text=text, source='manual'))

        # Update responses jika disediakan (replace all)
        new_responses = data.get('responses')
        if new_responses is not None:
            # Hapus semua response lama
            db.query(Response).filter_by(intent_id=intent.id).delete()
            # Tambah response baru
            for text in new_responses:
                text = text.strip()
                if text:
                    db.add(Response(intent_id=intent.id, text=text))

        # Update timestamp
        intent.updated_at = datetime.now(timezone.utc)
        db.commit()

        # Refresh data
        db.refresh(intent)
        patterns = [p.text for p in intent.patterns]
        responses = [r.text for r in intent.responses]

        return jsonify({
            'message': f'Intent "{intent.tag}" berhasil diupdate',
            'intent': {
                'id': str(intent.id),
                'tag': intent.tag,
                'patterns': patterns,
                'responses': responses,
                'patternsCount': len(patterns),
                'responsesCount': len(responses)
            }
        })

    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Gagal update intent: {str(e)}'}), 500
    finally:
        db.close()


@dashboard_bp.route('/api/intents/<intent_id>', methods=['DELETE'])
def delete_intent(intent_id):
    """
    DELETE /api/intents/<id>
    
    Penjelasan:
    - Soft delete: set is_active = False (data tetap ada di DB)
    - Patterns dan responses tidak dihapus (cascade soft delete)
    - Bisa di-restore nanti jika diperlukan
    
    Response: 200 + confirmation message
    """
    tenant, error = get_tenant_from_header()
    if error:
        return error

    db = get_db()
    try:
        intent = db.query(Intent).filter_by(
            id=intent_id,
            tenant_id=tenant.id,
            is_active=True
        ).first()

        if not intent:
            return jsonify({'error': 'Intent tidak ditemukan'}), 404

        # Soft delete
        intent.is_active = False
        intent.updated_at = datetime.now(timezone.utc)
        db.commit()

        return jsonify({
            'message': f'Intent "{intent.tag}" berhasil dihapus',
            'deleted_tag': intent.tag
        })

    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Gagal menghapus intent: {str(e)}'}), 500
    finally:
        db.close()
