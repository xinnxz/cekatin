"""
CekatIn — JSON to Database Migration Script
=============================================
Script ini memindahkan data dari intents.json ke database PostgreSQL/SQLite.

Cara pakai:
    python migrate_json_to_db.py

Alur:
1. Baca intents.json
2. Buat tenant default ("ReonShop")
3. Buat admin user default
4. Masukkan semua intent, pattern, response ke database
5. Print ringkasan migrasi

⚠️ Script ini AMAN untuk dijalankan berkali-kali (idempotent).
   Jika data sudah ada, tidak akan duplikat.
"""

import json
import os
import sys

# Pastikan import dari direktori yang benar
sys.path.insert(0, os.path.dirname(__file__))

from database import get_db, init_db
from db_models import Tenant, User, Intent, Pattern, Response


def migrate():
    """Jalankan migrasi dari intents.json ke database."""
    
    print("=" * 60)
    print("  CekatIn — Migrasi JSON → Database")
    print("=" * 60)
    
    # ── Step 1: Inisialisasi database (buat tabel) ──
    print("\n📦 Step 1: Membuat tabel database...")
    init_db()
    
    # ── Step 2: Baca intents.json ──
    print("📂 Step 2: Membaca intents.json...")
    intents_path = os.path.join(os.path.dirname(__file__), 'dataset', 'intents.json')
    
    if not os.path.exists(intents_path):
        print(f"❌ File tidak ditemukan: {intents_path}")
        return
    
    with open(intents_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    intents_data = data.get('intents', [])
    print(f"   Ditemukan {len(intents_data)} intent di file JSON")
    
    # ── Step 3: Buat/cari tenant default ──
    print("🏢 Step 3: Menyiapkan tenant default...")
    db = get_db()
    
    try:
        # Cek apakah tenant sudah ada
        tenant = db.query(Tenant).filter_by(slug='reonshop').first()
        
        if not tenant:
            tenant = Tenant(
                name='Toko ReonShop',
                slug='reonshop',
                tagline='Gadget Terlengkap & Terpercaya',
                description='Toko elektronik dengan produk smartphone, laptop, dan aksesoris',
                whatsapp='0812-3456-7890',
                email='cs@reonshop.com',
                plan='business',
                max_chats_per_month=5000,
                max_intents=50,
            )
            db.add(tenant)
            db.flush()  # Flush agar tenant.id tersedia
            print(f"   ✅ Tenant baru dibuat: {tenant.name}")
        else:
            print(f"   ⏭️  Tenant sudah ada: {tenant.name}")
        
        # ── Step 4: Buat admin user default ──
        print("👤 Step 4: Menyiapkan admin user...")
        
        admin = db.query(User).filter_by(email='admin@reonshop.com').first()
        
        if not admin:
            # Password default: "admin123" (hashed nanti saat auth system dibuat)
            # Untuk sekarang simpan plaintext, akan di-migrate ke bcrypt
            admin = User(
                tenant_id=tenant.id,
                email='admin@reonshop.com',
                password_hash='$placeholder$change_me',  # TODO: hash dengan bcrypt
                full_name='Admin ReonShop',
                role='admin',
            )
            db.add(admin)
            print(f"   ✅ Admin user dibuat: {admin.email}")
        else:
            print(f"   ⏭️  Admin sudah ada: {admin.email}")
        
        # ── Step 5: Migrasi intent, pattern, response ──
        print("🧠 Step 5: Migrasi intent, pattern, response...")
        
        stats = {
            'intents_created': 0,
            'intents_skipped': 0,
            'patterns_created': 0,
            'responses_created': 0,
        }
        
        for intent_data in intents_data:
            tag = intent_data.get('tag', '')
            patterns_list = intent_data.get('patterns', [])
            responses_list = intent_data.get('responses', [])
            
            if not tag:
                continue
            
            # Cek apakah intent sudah ada
            existing = db.query(Intent).filter_by(
                tenant_id=tenant.id,
                tag=tag
            ).first()
            
            if existing:
                stats['intents_skipped'] += 1
                continue
            
            # Buat intent baru
            intent = Intent(
                tenant_id=tenant.id,
                tag=tag,
            )
            db.add(intent)
            db.flush()  # Flush agar intent.id tersedia
            
            stats['intents_created'] += 1
            
            # Tambah patterns
            for pattern_text in patterns_list:
                pattern = Pattern(
                    intent_id=intent.id,
                    text=pattern_text,
                    source='manual',
                )
                db.add(pattern)
                stats['patterns_created'] += 1
            
            # Tambah responses
            for response_text in responses_list:
                response = Response(
                    intent_id=intent.id,
                    text=response_text,
                )
                db.add(response)
                stats['responses_created'] += 1
        
        # ── Step 6: Commit semua perubahan ──
        db.commit()
        
        # ── Step 7: Print ringkasan ──
        print("\n" + "=" * 60)
        print("  📊 RINGKASAN MIGRASI")
        print("=" * 60)
        print(f"  🏢 Tenant      : {tenant.name} ({tenant.slug})")
        print(f"  👤 Admin       : {admin.email}")
        print(f"  🧠 Intent baru : {stats['intents_created']}")
        print(f"  ⏭️  Intent skip : {stats['intents_skipped']}")
        print(f"  📝 Patterns    : {stats['patterns_created']}")
        print(f"  💬 Responses   : {stats['responses_created']}")
        print("=" * 60)
        print("  ✅ Migrasi berhasil!")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error saat migrasi: {e}")
        raise
    finally:
        db.close()


def show_db_stats():
    """Tampilkan statistik database saat ini."""
    db = get_db()
    try:
        tenants = db.query(Tenant).count()
        users = db.query(User).count()
        intents = db.query(Intent).count()
        patterns = db.query(Pattern).count()
        responses = db.query(Response).count()
        
        print("\n📊 Database Stats:")
        print(f"   Tenants   : {tenants}")
        print(f"   Users     : {users}")
        print(f"   Intents   : {intents}")
        print(f"   Patterns  : {patterns}")
        print(f"   Responses : {responses}")
    finally:
        db.close()


if __name__ == '__main__':
    migrate()
    show_db_stats()
