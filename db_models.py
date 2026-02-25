"""
CekatIn — Database Models (ORM)
=================================
Semua tabel database didefinisikan di sini menggunakan SQLAlchemy ORM.

Penjelasan ORM (Object-Relational Mapping):
- Setiap CLASS di bawah = 1 TABEL di database
- Setiap PROPERTY = 1 KOLOM di tabel
- Relationship() = menghubungkan tabel satu sama lain (JOIN)

Contoh:
    class User → tabel "users"
    User.email → kolom "email" di tabel "users"
    User.tenant → JOIN ke tabel "tenants"

Urutan tabel (berdasarkan dependency):
1. Tenant    (Toko/Client)
2. User      (Admin per Toko)
3. Intent    (Kategori pertanyaan)
4. Pattern   (Variasi pertanyaan)
5. Response  (Jawaban bot)
6. Conversation  (Sesi percakapan)
7. Message   (Isi pesan)
8. LearningLog  (Auto-learn queue)
9. TrainedModel  (Model ML yang sudah di-train)
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean,
    DateTime, ForeignKey, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from database import Base


# ═══════════════════════════════════════════════════════
# Helper: Generate UUID
# ═══════════════════════════════════════════════════════
def generate_uuid():
    """Generate UUID v4 sebagai string (kompatibel semua database)."""
    return str(uuid.uuid4())


def utcnow():
    """Get current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════
# 1. TENANT — Data Toko/Client
# ═══════════════════════════════════════════════════════
# Setiap tenant adalah 1 toko/UMKM yang menggunakan CekatIn.
# Tenant memiliki admin, intents, model, dan data chat sendiri.

class Tenant(Base):
    __tablename__ = 'tenants'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)          # "Toko ReonShop"
    slug = Column(String(50), unique=True, nullable=False)  # "reonshop"
    tagline = Column(String(255), default='')            # "Gadget Terlengkap"
    description = Column(Text, default='')
    logo_url = Column(String(500), default='')
    whatsapp = Column(String(20), default='')
    email = Column(String(100), default='')
    address = Column(Text, default='')
    operating_hours = Column(JSON, default=dict)         # {"senin": "09:00-21:00"}

    # Subscription plan
    plan = Column(String(20), default='starter')         # starter/business/enterprise
    max_chats_per_month = Column(Integer, default=500)
    max_intents = Column(Integer, default=10)

    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships — Menghubungkan ke tabel lain
    # Penjelasan: back_populates bikin akses 2 arah
    # tenant.users → list semua user di tenant ini
    # user.tenant  → tenant pemilik user ini
    users = relationship('User', back_populates='tenant', cascade='all, delete-orphan')
    intents = relationship('Intent', back_populates='tenant', cascade='all, delete-orphan')
    conversations = relationship('Conversation', back_populates='tenant', cascade='all, delete-orphan')
    learning_logs = relationship('LearningLog', back_populates='tenant', cascade='all, delete-orphan')
    trained_models = relationship('TrainedModel', back_populates='tenant', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Tenant {self.name} ({self.slug})>"


# ═══════════════════════════════════════════════════════
# 2. USER — Admin per Toko
# ═══════════════════════════════════════════════════════
# Setiap user adalah admin yang bisa login ke dashboard.
# User terikat ke 1 tenant (toko).

class User(Base):
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)    # Nullable untuk Google-only users
    full_name = Column(String(100), default='')
    role = Column(String(20), default='admin')           # superadmin/admin/viewer
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Google OAuth fields
    google_id = Column(String(100), unique=True, nullable=True)  # Google sub ID
    avatar_url = Column(String(500), default='')                 # Foto profil Google

    # Relationships
    tenant = relationship('Tenant', back_populates='users')

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


# ═══════════════════════════════════════════════════════
# 3. INTENT — Kategori Pertanyaan
# ═══════════════════════════════════════════════════════
# Intent = "niat" atau "keinginan" user.
# Contoh: "greeting" (menyapa), "tanya_harga" (tanya harga).
# Setiap intent punya banyak patterns dan responses.

class Intent(Base):
    __tablename__ = 'intents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(36), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    tag = Column(String(100), nullable=False)             # "greeting", "tanya_harga"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    tenant = relationship('Tenant', back_populates='intents')
    patterns = relationship('Pattern', back_populates='intent', cascade='all, delete-orphan')
    responses = relationship('Response', back_populates='intent', cascade='all, delete-orphan')

    # Constraint: 1 tenant tidak boleh punya tag yang sama
    __table_args__ = (
        UniqueConstraint('tenant_id', 'tag', name='uq_tenant_tag'),
        Index('idx_intents_tenant', 'tenant_id'),
    )

    def __repr__(self):
        return f"<Intent {self.tag}>"


# ═══════════════════════════════════════════════════════
# 4. PATTERN — Variasi Pertanyaan
# ═══════════════════════════════════════════════════════
# Pattern = contoh kalimat yang termasuk intent tertentu.
# Makin banyak pattern, model makin akurat mengenali intent.
# Contoh pattern untuk intent "greeting":
#   - "halo"
#   - "hi kak"
#   - "selamat siang"

class Pattern(Base):
    __tablename__ = 'patterns'

    id = Column(Integer, primary_key=True, autoincrement=True)
    intent_id = Column(Integer, ForeignKey('intents.id', ondelete='CASCADE'), nullable=False)
    text = Column(Text, nullable=False)                   # "berapa harga hp"
    source = Column(String(20), default='manual')         # manual / auto_learn
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    intent = relationship('Intent', back_populates='patterns')

    def __repr__(self):
        return f"<Pattern '{self.text[:30]}...'>"


# ═══════════════════════════════════════════════════════
# 5. RESPONSE — Jawaban Bot
# ═══════════════════════════════════════════════════════
# Response = jawaban yang diberikan bot untuk intent tertentu.
# Bisa ada banyak response per intent (dipilih random).

class Response(Base):
    __tablename__ = 'responses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    intent_id = Column(Integer, ForeignKey('intents.id', ondelete='CASCADE'), nullable=False)
    text = Column(Text, nullable=False)                   # "Halo kak! Ada yang bisa dibantu?"
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    intent = relationship('Intent', back_populates='responses')

    def __repr__(self):
        return f"<Response '{self.text[:30]}...'>"


# ═══════════════════════════════════════════════════════
# 6. CONVERSATION — Sesi Percakapan
# ═══════════════════════════════════════════════════════
# Conversation = 1 sesi chat antara visitor dan bot.
# Dimulai saat visitor pertama kali kirim pesan,
# berakhir saat visitor meninggalkan halaman/timeout.

class Conversation(Base):
    __tablename__ = 'conversations'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    session_id = Column(String(100), nullable=False)      # ID session visitor
    visitor_ip = Column(String(45), default='')            # IP address
    started_at = Column(DateTime, default=utcnow)
    ended_at = Column(DateTime, nullable=True)
    message_count = Column(Integer, default=0)
    satisfaction = Column(Integer, nullable=True)          # Rating 1-5 (optional)

    # Relationships
    tenant = relationship('Tenant', back_populates='conversations')
    messages = relationship('Message', back_populates='conversation', cascade='all, delete-orphan')

    __table_args__ = (
        Index('idx_conversations_tenant', 'tenant_id'),
        Index('idx_conversations_started', 'started_at'),
    )

    def __repr__(self):
        return f"<Conversation {self.id[:8]}... ({self.message_count} msgs)>"


# ═══════════════════════════════════════════════════════
# 7. MESSAGE — Isi Pesan dalam Percakapan
# ═══════════════════════════════════════════════════════
# Message = 1 pesan (bisa dari user atau bot).
# Menyimpan teks, intent yang terdeteksi, confidence, dll.

class Message(Base):
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(36), ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    sender = Column(String(10), nullable=False)            # 'user' atau 'bot'
    text = Column(Text, nullable=False)
    intent_tag = Column(String(100), nullable=True)        # Intent yang terdeteksi
    confidence = Column(Float, nullable=True)              # Confidence score (0.0-1.0)
    source = Column(String(20), nullable=True)             # 'nlp', 'gemini', 'groq'
    response_time_ms = Column(Integer, nullable=True)      # Waktu respon dalam ms
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    conversation = relationship('Conversation', back_populates='messages')

    __table_args__ = (
        Index('idx_messages_conversation', 'conversation_id'),
        Index('idx_messages_created', 'created_at'),
    )

    def __repr__(self):
        return f"<Message [{self.sender}] '{self.text[:30]}...'>"


# ═══════════════════════════════════════════════════════
# 8. LEARNING_LOG — Auto-Learn Queue
# ═══════════════════════════════════════════════════════
# Menyimpan pesan yang belum dikenali oleh NLP (confidence rendah).
# Admin bisa review dan approve untuk dijadikan training data.
#
# Status flow:
#   pending → approved (masuk ke training data)
#   pending → rejected (diabaikan)

class LearningLog(Base):
    __tablename__ = 'learning_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(36), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    user_message = Column(Text, nullable=False)            # Pesan asli dari user
    bot_response = Column(Text, nullable=True)             # Jawaban bot
    detected_intent = Column(String(100), nullable=True)   # Intent yang terdeteksi
    confidence = Column(Float, nullable=True)              # Confidence score
    status = Column(String(20), default='pending')         # pending/approved/rejected
    target_intent = Column(String(100), nullable=True)     # Intent yang benar (set oleh admin)
    reviewed_by = Column(String(36), nullable=True)        # User ID yang review
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    tenant = relationship('Tenant', back_populates='learning_logs')

    __table_args__ = (
        Index('idx_learning_tenant', 'tenant_id'),
        Index('idx_learning_status', 'status'),
    )

    def __repr__(self):
        return f"<LearningLog [{self.status}] '{self.user_message[:30]}...'>"


# ═══════════════════════════════════════════════════════
# 9. TRAINED_MODEL — Model ML yang Sudah Di-train
# ═══════════════════════════════════════════════════════
# Menyimpan metadata model yang sudah di-training.
# Setiap tenant punya model sendiri (isolated).
# Version tracking memungkinkan rollback jika model baru buruk.

class TrainedModel(Base):
    __tablename__ = 'trained_models'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(36), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    file_path = Column(String(500), nullable=True)         # Path ke .pkl file
    accuracy = Column(Float, nullable=True)                # Akurasi model (0.0-1.0)
    training_samples = Column(Integer, default=0)          # Jumlah data training
    is_active = Column(Boolean, default=True)              # Model yang aktif dipakai
    trained_at = Column(DateTime, default=utcnow)

    # Relationships
    tenant = relationship('Tenant', back_populates='trained_models')

    def __repr__(self):
        return f"<TrainedModel v{self.version} ({self.accuracy:.1%} accuracy)>"
