"""
Script untuk mengintegrasikan dataset smartphone Kaggle ke knowledge_base.json
"""
import json

# Load smartphone dataset
with open('dataset/smartphone-dataset.json', 'r') as f:
    smartphones = json.load(f)

# Load current knowledge base
with open('dataset/knowledge_base.json', 'r', encoding='utf-8') as f:
    kb = json.load(f)

# Transform smartphone data ke format knowledge base
new_smartphones = []
seen_models = set()

for phone in smartphones:
    model = phone['model'].strip()
    if model in seen_models:
        continue
    seen_models.add(model)
    
    # Format nama (title case)
    nama = model.title()
    
    # Parse harga
    harga_str = phone.get('price', '0').replace('Rp', '').replace(',', '')
    try:
        harga = int(harga_str)
    except:
        continue
    
    # Build spesifikasi string
    specs = []
    if phone.get('ram_gb'):
        specs.append(f"RAM {phone['ram_gb']}GB")
    if phone.get('storage_gb'):
        specs.append(f"ROM {phone['storage_gb']}GB")
    if phone.get('chipset'):
        specs.append(phone['chipset'].strip())
    if phone.get('screen_size_in'):
        specs.append(f"Layar {phone['screen_size_in']} inch")
    if phone.get('refresh_rate_hz') and phone['refresh_rate_hz']:
        specs.append(f"{phone['refresh_rate_hz']}Hz")
    if phone.get('rear_camera_max_mp'):
        specs.append(f"Kamera {phone['rear_camera_max_mp']}MP")
    if phone.get('battery_mah'):
        specs.append(f"Baterai {phone['battery_mah']}mAh")
    if phone.get('fast_charge_w') and phone['fast_charge_w']:
        specs.append(f"Fast Charge {phone['fast_charge_w']}W")
    if phone.get('network_type'):
        specs.append(phone['network_type'].upper())
    if phone.get('NFC') == 'TRUE':
        specs.append('NFC')
    if phone.get('os'):
        specs.append(phone['os'])
    
    spesifikasi = ', '.join(specs)
    
    # Determine brand for garansi
    brand = model.split()[0].title()
    if brand == 'Apple':
        garansi = 'Garansi resmi iBox 1 tahun'
    elif brand in ['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Poco', 'Oneplus']:
        garansi = f'Garansi resmi {brand} 1 tahun'
    elif brand in ['Motorola', 'Nokia', 'Huawei', 'Google', 'Nothing']:
        garansi = f'Garansi resmi {brand} 1 tahun'
    else:
        garansi = 'Garansi distributor 1 tahun'
    
    # Stok based on rating
    if phone.get('rating', 0) >= 85:
        stok = 'Tersedia'
    elif phone.get('rating', 0) >= 70:
        stok = 'Tersedia'
    else:
        stok = 'Stok terbatas'
    
    new_smartphones.append({
        'nama': nama,
        'harga': harga,
        'spesifikasi': spesifikasi,
        'rating': phone.get('rating', 0),
        'stok': stok,
        'garansi': garansi
    })

# Sort by brand then price
new_smartphones.sort(key=lambda x: (x['nama'].split()[0], x['harga']))

# Replace smartphone category in knowledge base
for prod in kb['produk']:
    if prod['kategori'] == 'Smartphone':
        prod['daftar'] = new_smartphones
        break

# Save updated knowledge base
with open('dataset/knowledge_base.json', 'w', encoding='utf-8') as f:
    json.dump(kb, f, ensure_ascii=False, indent=4)

print(f"Total smartphones integrated: {len(new_smartphones)}")
brands = set(s['nama'].split()[0] for s in new_smartphones)
print(f"Brands: {len(brands)}")
print(f"Price range: Rp{min(s['harga'] for s in new_smartphones):,} - Rp{max(s['harga'] for s in new_smartphones):,}")
print(f"\nSample entries:")
for s in new_smartphones[:5]:
    print(f"  {s['nama']:<45} Rp{s['harga']:>12,}")
print(f"  ...")
for s in new_smartphones[-3:]:
    print(f"  {s['nama']:<45} Rp{s['harga']:>12,}")
print("\n✅ Knowledge base updated!")
