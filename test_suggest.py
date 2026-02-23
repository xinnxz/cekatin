"""Test NLP KB-aware responses — verifikasi bahwa jawaban sekarang lebih cerdas"""
import requests

BASE = 'http://localhost:5000/api/chat'
SESSION = 'kb_test'

tests = [
    ("halo kak", "greeting"),
    ("harga samsung galaxy a25", "harga spesifik"),
    ("ada hp xiaomi apa aja", "produk brand"),
    ("spesifikasi oppo reno 11", "spek produk"),
    ("hp murah dibawah 2 juta", "filter harga"),
    ("daftar harga hp", "harga umum"),
    ("produk apa saja yang dijual", "katalog produk"),
    ("jam buka toko", "jam buka"),
    ("alamat toko dimana", "lokasi"),
    ("bisa bayar pakai apa", "pembayaran"),
]

print("=" * 70)
print("TEST: NLP KB-AWARE RESPONSES")
print("=" * 70)

for msg, label in tests:
    r = requests.post(BASE, json={'message': msg, 'session_id': SESSION}).json()
    resp = r.get('response', '')
    intent = r.get('intent', '?')
    conf = r.get('confidence', 0) * 100
    
    # Cek apakah response mengandung data nyata (bukan template)
    has_real_data = any(kw in resp.lower() for kw in ['rp ', 'ram ', 'garansi', 'samsung', 'xiaomi', 'oppo', 'vivo', 'senin', 'whatsapp', 'jl.'])
    status = "✅ KB" if has_real_data else "📋 Template"
    
    print(f"\n{'─' * 70}")
    print(f"📝 [{label}] \"{msg}\"")
    print(f"   Intent: {intent} | Confidence: {conf:.1f}% | {status}")
    print(f"   Response: {resp[:150]}{'...' if len(resp)>150 else ''}")

print(f"\n{'=' * 70}")
print("TEST SELESAI")
