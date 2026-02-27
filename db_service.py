"""
CekatIn — Database Service Layer
==================================
Layer penghubung antara NLP Engine / App ↔ Database.

Penjelasan:
- Service layer ini menyediakan fungsi-fungsi untuk CRUD data
- NLP Engine dan App tidak perlu tahu detail database
- Bisa switch antara JSON file dan Database tanpa ubah logika utama

Fungsi utama:
1. load_intents_from_db()  → Ambil data intent (format sama seperti intents.json)
2. save_chat_message()     → Simpan pesan chat ke database
3. log_learning()          → Simpan learning log ke database
4. get_or_create_conversation() → Manage sesi percakapan
"""

import json
import os
from datetime import datetime, timezone

from database import get_db, init_db
from db_models import (
    Tenant, Intent, Pattern, Response,
    Conversation, Message, LearningLog, TrainedModel
)


# ═══════════════════════════════════════════════════════
# DEFAULT TENANT (untuk backward compatibility)
# ═══════════════════════════════════════════════════════
# Jika belum multi-tenant, semua data masuk ke tenant default.
DEFAULT_TENANT_SLUG = 'reonshop'


def get_default_tenant_id():
    """
    Ambil ID tenant default.
    
    Penjelasan:
    - Dipakai sebagai fallback jika tenant_id tidak disediakan
    - Setelah Phase 1.3 (Multi-Tenant), tenant_id biasanya
      diberikan secara eksplisit dari TenantManager
    
    Returns:
        str: UUID tenant default, atau None jika belum ada
    """
    db = get_db()
    try:
        tenant = db.query(Tenant).filter_by(slug=DEFAULT_TENANT_SLUG).first()
        return tenant.id if tenant else None
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# INTENT OPERATIONS
# ═══════════════════════════════════════════════════════

def load_intents_from_db(tenant_id=None):
    """
    Ambil semua intent dari database dalam format yang SAMA 
    seperti intents.json — supaya NLP Engine tidak perlu diubah.
    
    Penjelasan format output:
    {
        "intents": [
            {
                "tag": "greeting",
                "patterns": ["halo", "hi", ...],
                "responses": ["Halo kak!", ...]
            },
            ...
        ]
    }
    
    Args:
        tenant_id: UUID tenant (default: tenant default)
    
    Returns:
        dict: Data intent dalam format intents.json
    """
    if tenant_id is None:
        tenant_id = get_default_tenant_id()
    
    if not tenant_id:
        print("⚠️ Tenant default belum ada, fallback ke intents.json")
        return None
    
    db = get_db()
    try:
        # Query semua intent aktif milik tenant ini
        intents = db.query(Intent).filter_by(
            tenant_id=tenant_id,
            is_active=True
        ).all()
        
        result = {"intents": []}
        
        for intent in intents:
            # Ambil patterns dan responses untuk setiap intent
            patterns = [p.text for p in intent.patterns]
            responses = [r.text for r in intent.responses]
            
            result["intents"].append({
                "tag": intent.tag,
                "patterns": patterns,
                "responses": responses
            })
        
        print(f"📦 Loaded {len(result['intents'])} intents dari database")
        return result
        
    finally:
        db.close()


def add_pattern_to_intent(tag, pattern_text, tenant_id=None):
    """
    Tambah pattern baru ke intent yang sudah ada.
    
    Penjelasan:
    - Digunakan oleh auto-learn system
    - Pattern baru = variasi pertanyaan baru yang dipelajari
    - Setelah ditambahkan, model perlu di-retrain
    
    Args:
        tag: Tag intent (misal: "greeting")
        pattern_text: Teks pattern baru
        tenant_id: UUID tenant
    
    Returns:
        bool: True jika berhasil ditambahkan
    """
    if tenant_id is None:
        tenant_id = get_default_tenant_id()
    
    db = get_db()
    try:
        intent = db.query(Intent).filter_by(
            tenant_id=tenant_id,
            tag=tag
        ).first()
        
        if not intent:
            print(f"⚠️ Intent '{tag}' tidak ditemukan")
            return False
        
        # Cek duplikat
        existing = db.query(Pattern).filter_by(
            intent_id=intent.id,
            text=pattern_text
        ).first()
        
        if existing:
            return False
        
        new_pattern = Pattern(
            intent_id=intent.id,
            text=pattern_text,
            source='auto_learn'
        )
        db.add(new_pattern)
        db.commit()
        
        print(f"✅ Pattern baru ditambahkan ke '{tag}': {pattern_text}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error tambah pattern: {e}")
        return False
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# CONVERSATION & MESSAGE OPERATIONS
# ═══════════════════════════════════════════════════════

def get_or_create_conversation(session_id, tenant_id=None):
    """
    Ambil atau buat conversation baru berdasarkan session_id.
    
    Penjelasan:
    - Setiap visitor punya session_id (dari browser)
    - 1 session = 1 conversation
    - Jika session sudah ada → return conversation yang sama
    - Jika belum ada → buat conversation baru
    
    Args:
        session_id: ID sesi dari browser
        tenant_id: UUID tenant
    
    Returns:
        str: UUID conversation
    """
    if tenant_id is None:
        tenant_id = get_default_tenant_id()
    
    if not tenant_id:
        return None
    
    db = get_db()
    try:
        conversation = db.query(Conversation).filter_by(
            tenant_id=tenant_id,
            session_id=session_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                tenant_id=tenant_id,
                session_id=session_id,
            )
            db.add(conversation)
            db.commit()
        
        return conversation.id
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error get/create conversation: {e}")
        return None
    finally:
        db.close()


def save_chat_message(conversation_id, sender, text, 
                       intent_tag=None, confidence=None, 
                       source=None, response_time_ms=None):
    """
    Simpan 1 pesan chat ke database.
    
    Penjelasan:
    - Dipanggil setiap kali user kirim pesan ATAU bot menjawab
    - Menyimpan metadata lengkap (intent, confidence, source)
    - Data ini dipakai untuk analytics nanti
    
    Args:
        conversation_id: UUID conversation
        sender: 'user' atau 'bot'
        text: Isi pesan
        intent_tag: Intent yang terdeteksi (optional)
        confidence: Confidence score 0-1 (optional)
        source: 'nlp', 'gemini', 'groq' (optional)
        response_time_ms: Waktu respon dalam ms (optional)
    
    Returns:
        int: ID message yang baru dibuat, atau None
    """
    if not conversation_id:
        return None
    
    db = get_db()
    try:
        msg = Message(
            conversation_id=conversation_id,
            sender=sender,
            text=text,
            intent_tag=intent_tag,
            confidence=confidence,
            source=source,
            response_time_ms=response_time_ms
        )
        db.add(msg)
        
        # Update message count di conversation
        conversation = db.query(Conversation).filter_by(id=conversation_id).first()
        if conversation:
            conversation.message_count = (conversation.message_count or 0) + 1
        
        db.commit()
        return msg.id
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error save message: {e}")
        return None
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# LEARNING LOG OPERATIONS
# ═══════════════════════════════════════════════════════

def log_learning_to_db(user_message, bot_response=None, 
                        detected_intent=None, confidence=None, 
                        tenant_id=None):
    """
    Simpan interaksi ke learning log database.
    
    Penjelasan:
    - Ini versi DATABASE dari log_interaction() di app.py
    - Data disimpan PERMANEN (tidak hilang saat redeploy)
    - Admin bisa review via dashboard nanti
    
    Args:
        user_message: Pesan asli dari user
        bot_response: Jawaban bot
        detected_intent: Intent yang terdeteksi
        confidence: Confidence score
        tenant_id: UUID tenant
    
    Returns:
        int: ID learning log, atau None
    """
    if tenant_id is None:
        tenant_id = get_default_tenant_id()
    
    if not tenant_id:
        return None
    
    db = get_db()
    try:
        log = LearningLog(
            tenant_id=tenant_id,
            user_message=user_message,
            bot_response=bot_response,
            detected_intent=detected_intent,
            confidence=confidence,
            status='pending'
        )
        db.add(log)
        db.commit()
        return log.id
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error log learning: {e}")
        return None
    finally:
        db.close()


def get_pending_learning_logs(tenant_id=None, limit=50):
    """
    Ambil learning log yang belum di-review (pending).
    
    Args:
        tenant_id: UUID tenant
        limit: Jumlah maksimal data
    
    Returns:
        list[dict]: Learning logs yang pending
    """
    if tenant_id is None:
        tenant_id = get_default_tenant_id()
    
    db = get_db()
    try:
        logs = db.query(LearningLog).filter_by(
            tenant_id=tenant_id,
            status='pending'
        ).order_by(LearningLog.created_at.desc()).limit(limit).all()
        
        return [{
            'id': log.id,
            'user_message': log.user_message,
            'bot_response': log.bot_response,
            'detected_intent': log.detected_intent,
            'confidence': log.confidence,
            'created_at': log.created_at.isoformat() if log.created_at else None
        } for log in logs]
        
    finally:
        db.close()


def approve_learning_log(log_id, target_intent, reviewed_by=None):
    """
    Approve learning log dan tambahkan ke training data.
    
    Penjelasan alur:
    1. Update status log menjadi 'approved'
    2. Tambahkan user_message sebagai pattern baru ke target_intent
    3. Caller perlu retrain model setelah ini
    
    Args:
        log_id: ID learning log
        target_intent: Tag intent tujuan
        reviewed_by: UUID user yang review
    
    Returns:
        bool: True jika berhasil
    """
    db = get_db()
    try:
        log = db.query(LearningLog).filter_by(id=log_id).first()
        
        if not log:
            return False
        
        log.status = 'approved'
        log.target_intent = target_intent
        log.reviewed_by = reviewed_by
        log.reviewed_at = datetime.now(timezone.utc)
        
        db.commit()
        
        # Tambahkan sebagai pattern baru
        add_pattern_to_intent(target_intent, log.user_message, log.tenant_id)
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error approve learning: {e}")
        return False
    finally:
        db.close()


def reject_learning_log(log_id, reviewed_by=None):
    """Reject learning log (abaikan, tidak dijadikan training data)."""
    db = get_db()
    try:
        log = db.query(LearningLog).filter_by(id=log_id).first()
        if not log:
            return False
        
        log.status = 'rejected'
        log.reviewed_by = reviewed_by
        log.reviewed_at = datetime.now(timezone.utc)
        db.commit()
        return True
        
    except Exception as e:
        db.rollback()
        return False
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# ANALYTICS OPERATIONS
# ═══════════════════════════════════════════════════════

def get_chat_stats(tenant_id=None):
    """
    Ambil statistik chat untuk dashboard analytics.
    
    Returns:
        dict: {
            'total_conversations': int,
            'total_messages': int,
            'pending_learning': int
        }
    """
    if tenant_id is None:
        tenant_id = get_default_tenant_id()
    
    if not tenant_id:
        return {'total_conversations': 0, 'total_messages': 0, 'pending_learning': 0}
    
    db = get_db()
    try:
        total_conversations = db.query(Conversation).filter_by(
            tenant_id=tenant_id).count()
        total_messages = db.query(Message).join(Conversation).filter(
            Conversation.tenant_id == tenant_id).count()
        pending_learning = db.query(LearningLog).filter_by(
            tenant_id=tenant_id, status='pending').count()
        
        return {
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'pending_learning': pending_learning
        }
    finally:
        db.close()


# ═══════════════════════════════════════════════════════
# UTILITY: Sync Database ↔ intents.json
# ═══════════════════════════════════════════════════════

def export_db_to_intents_json(output_path=None, tenant_id=None):
    """
    Export data intent dari database ke format intents.json.
    
    Penjelasan:
    - Berguna untuk backup
    - Atau jika ingin kembali ke mode file-based
    
    Args:
        output_path: Path file output (default: dataset/intents.json)
        tenant_id: UUID tenant
    """
    data = load_intents_from_db(tenant_id)
    
    if not data:
        print("❌ Tidak ada data untuk di-export")
        return
    
    if output_path is None:
        output_path = os.path.join(
            os.path.dirname(__file__), 'dataset', 'intents_export.json'
        )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Exported {len(data['intents'])} intents ke {output_path}")
