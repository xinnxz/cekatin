"""
Test Self-Learning System:
1. Chat beberapa kali (interaksi di-log)
2. Cek learning stats
3. Trigger auto-learn
4. Verifikasi pattern baru masuk training data
"""
import requests
import json

BASE = 'http://localhost:5000'

print("=" * 60)
print("  TEST 1: Simulasi User Chatting (log interaksi)")
print("=" * 60)

chats = [
    'halo kak',
    'harga samsung galaxy a15 berapa',
    'ada promo samsung gak',
    'bisa kirim ke bandung',
    'bisa bayar pake gopay',
    'spek poco x6 gimana',
    'hp murah yang bagus apa ya',
    'ada stok iphone 15 gak',
]

for msg in chats:
    r = requests.post(f'{BASE}/api/chat', json={'message': msg, 'session_id': 'learn_test'}).json()
    conf = r.get('confidence', 0)
    routing = r.get('routing', '?')
    intent = r.get('intent', '?')
    print(f"  [{conf*100:5.1f}%] {routing:<12} {intent:<22} | {msg}")

print()
print("=" * 60)
print("  TEST 2: Learning Stats (sebelum auto-learn)")
print("=" * 60)

stats = requests.get(f'{BASE}/api/learning-stats').json()
print(f"  Total interaksi: {stats.get('total_interactions', 0)}")
print(f"  NLP-driven:      {stats.get('nlp_driven', 0)}")
print(f"  AI-driven:       {stats.get('ai_driven', 0)}")
print(f"  NLP success rate: {stats.get('nlp_success_rate', '?')}")
print(f"  Avg confidence:  {stats.get('avg_confidence', 0)*100:.1f}%")
print(f"  Patterns learned: {stats.get('patterns_learned', 0)}")

print()
print("=" * 60)
print("  TEST 3: Trigger Auto-Learn")
print("=" * 60)

learn = requests.post(f'{BASE}/api/auto-learn').json()
print(f"  Status: {learn.get('status')}")
print(f"  Message: {learn.get('message')}")
print(f"  Patterns added: {learn.get('patterns_added', 0)}")
print(f"  Total patterns: {learn.get('total_patterns', 0)}")
if learn.get('breakdown'):
    print(f"  Breakdown: {json.dumps(learn['breakdown'], indent=4)}")

print()
print("=" * 60)
print("  TEST 4: Verifikasi confidence SETELAH auto-learn")
print("=" * 60)

for msg in chats:
    r = requests.post(f'{BASE}/api/chat', json={'message': msg, 'session_id': 'verify'}).json()
    conf = r.get('confidence', 0)
    routing = r.get('routing', '?')
    intent = r.get('intent', '?')
    marker = "✅" if conf >= 0.7 else "⬆️" if conf >= 0.5 else "❌"
    print(f"  [{conf*100:5.1f}%] {routing:<12} {intent:<22} | {msg} {marker}")

print("\n🧠 Self-Learning Test Complete!")
