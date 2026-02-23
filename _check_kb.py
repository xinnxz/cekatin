import json

with open('dataset/knowledge_base.json','r',encoding='utf-8') as f:
    kb = json.load(f)

for cat in kb['produk']:
    print(f"{cat['kategori']}: {len(cat['daftar'])} produk")

print(f"\nKebijakan: {list(kb.get('kebijakan',{}).keys())}")
print(f"Promo: {len(kb.get('promo',[]))} promo")
print(f"FAQ: {len(kb.get('faq',[]))} faq")
