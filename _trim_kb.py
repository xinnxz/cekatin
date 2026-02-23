"""
Generate 50 smartphone populer Indonesia ke knowledge_base.json
Brand: Samsung, Xiaomi, Oppo, Vivo, Realme, Apple, Poco, Infinix
Harga realistis 2024-2025
"""
import json

smartphones = [
    # ── SAMSUNG (10 unit) ──────────────────────────────
    {"nama": "Samsung Galaxy A05s", "harga": 1599000, "spesifikasi": "RAM 4GB, ROM 64GB, Snapdragon 680, Layar 6.7 inch PLS LCD, Kamera 50MP+2MP+2MP, Baterai 5000mAh, Fast Charge 25W, 4G", "rating": 78, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy A15", "harga": 2399000, "spesifikasi": "RAM 6GB, ROM 128GB, Helio G99, Layar 6.5 inch Super AMOLED, Kamera 50MP+5MP+2MP, Baterai 5000mAh, Fast Charge 25W, 4G", "rating": 82, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy A25 5G", "harga": 3199000, "spesifikasi": "RAM 8GB, ROM 128GB, Exynos 1280, Layar 6.5 inch Super AMOLED 120Hz, Kamera 50MP+8MP+2MP, Baterai 5000mAh, Fast Charge 25W, 5G, NFC", "rating": 84, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy A35 5G", "harga": 4499000, "spesifikasi": "RAM 8GB, ROM 128GB, Exynos 1380, Layar 6.6 inch Super AMOLED 120Hz, Kamera 50MP+8MP+5MP, Baterai 5000mAh, Fast Charge 25W, 5G, NFC, IP67", "rating": 86, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy A55 5G", "harga": 5999000, "spesifikasi": "RAM 8GB, ROM 256GB, Exynos 1480, Layar 6.6 inch Super AMOLED 120Hz, Kamera 50MP+12MP+5MP, Baterai 5000mAh, Fast Charge 25W, 5G, NFC, IP67", "rating": 88, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy S23 FE", "harga": 7499000, "spesifikasi": "RAM 8GB, ROM 128GB, Exynos 2200, Layar 6.4 inch Dynamic AMOLED 120Hz, Kamera 50MP+12MP+8MP, Baterai 4500mAh, Fast Charge 25W, 5G, NFC, IP68", "rating": 87, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy S24", "harga": 12999000, "spesifikasi": "RAM 8GB, ROM 256GB, Exynos 2400, Layar 6.2 inch Dynamic AMOLED 2X 120Hz, Kamera 50MP+12MP+10MP, Baterai 4000mAh, Fast Charge 25W, 5G, NFC, IP68, Galaxy AI", "rating": 90, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy S24 Ultra", "harga": 21999000, "spesifikasi": "RAM 12GB, ROM 512GB, Snapdragon 8 Gen 3, Layar 6.8 inch Dynamic AMOLED 2X 120Hz, Kamera 200MP+50MP+10MP+12MP, Baterai 5000mAh, Fast Charge 45W, 5G, NFC, IP68, S-Pen, Galaxy AI", "rating": 95, "stok": "Tersedia", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy Z Flip5", "harga": 14999000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 8 Gen 2, Layar 6.7 inch Dynamic AMOLED 2X 120Hz (Flip), Kamera 12MP+12MP, Baterai 3700mAh, 5G, NFC, IPX8", "rating": 87, "stok": "Stok terbatas", "garansi": "Garansi resmi Samsung 1 tahun"},
    {"nama": "Samsung Galaxy Z Fold5", "harga": 25999000, "spesifikasi": "RAM 12GB, ROM 512GB, Snapdragon 8 Gen 2, Layar 7.6 inch Dynamic AMOLED 2X 120Hz (Fold), Kamera 50MP+12MP+10MP, Baterai 4400mAh, 5G, NFC, IPX8", "rating": 91, "stok": "Stok terbatas", "garansi": "Garansi resmi Samsung 1 tahun"},

    # ── XIAOMI (8 unit) ────────────────────────────────
    {"nama": "Xiaomi Redmi 13", "harga": 1899000, "spesifikasi": "RAM 6GB, ROM 128GB, Helio G99 Ultra, Layar 6.79 inch FHD+ 90Hz, Kamera 108MP+2MP, Baterai 5030mAh, Fast Charge 33W, 4G, NFC", "rating": 80, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi Redmi Note 13", "harga": 2499000, "spesifikasi": "RAM 8GB, ROM 128GB, Snapdragon 685, Layar 6.67 inch AMOLED 120Hz, Kamera 108MP+8MP+2MP, Baterai 5000mAh, Fast Charge 33W, 4G, NFC", "rating": 85, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi Redmi Note 13 Pro 5G", "harga": 3899000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 7s Gen 2, Layar 6.67 inch AMOLED 120Hz, Kamera 200MP+8MP+2MP, Baterai 5100mAh, Fast Charge 67W, 5G, NFC, IP54", "rating": 89, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi 14", "harga": 9999000, "spesifikasi": "RAM 12GB, ROM 256GB, Snapdragon 8 Gen 3, Layar 6.36 inch AMOLED 120Hz, Kamera Leica 50MP+50MP+50MP, Baterai 4610mAh, Fast Charge 90W, 5G, NFC, IP68", "rating": 92, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi 14 Ultra", "harga": 16999000, "spesifikasi": "RAM 16GB, ROM 512GB, Snapdragon 8 Gen 3, Layar 6.73 inch AMOLED 120Hz, Kamera Leica 50MP+50MP+50MP+50MP, Baterai 5300mAh, Fast Charge 90W, 5G, NFC, IP68", "rating": 94, "stok": "Stok terbatas", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi Redmi A3", "harga": 1199000, "spesifikasi": "RAM 3GB, ROM 64GB, Helio G36, Layar 6.71 inch HD+ 90Hz, Kamera 8MP+0.08MP, Baterai 5000mAh, 4G", "rating": 70, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi Redmi Note 12", "harga": 2099000, "spesifikasi": "RAM 6GB, ROM 128GB, Snapdragon 685, Layar 6.67 inch AMOLED 120Hz, Kamera 50MP+8MP+2MP, Baterai 5000mAh, Fast Charge 33W, 4G, NFC", "rating": 83, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Xiaomi POCO X6 Pro 5G", "harga": 4299000, "spesifikasi": "RAM 8GB, ROM 256GB, Dimensity 8300 Ultra, Layar 6.67 inch AMOLED 120Hz, Kamera 64MP+8MP+2MP, Baterai 5000mAh, Fast Charge 67W, 5G, NFC", "rating": 88, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},

    # ── OPPO (6 unit) ──────────────────────────────────
    {"nama": "Oppo A18", "harga": 1699000, "spesifikasi": "RAM 4GB, ROM 128GB, Helio G85, Layar 6.56 inch HD+ 90Hz, Kamera 8MP+2MP, Baterai 5000mAh, 4G", "rating": 75, "stok": "Tersedia", "garansi": "Garansi resmi Oppo 1 tahun"},
    {"nama": "Oppo A78 5G", "harga": 3299000, "spesifikasi": "RAM 8GB, ROM 128GB, Dimensity 700, Layar 6.56 inch HD+ 90Hz, Kamera 50MP+2MP, Baterai 5000mAh, Fast Charge 33W, 5G, NFC", "rating": 80, "stok": "Tersedia", "garansi": "Garansi resmi Oppo 1 tahun"},
    {"nama": "Oppo Reno 11 5G", "harga": 5499000, "spesifikasi": "RAM 8GB, ROM 256GB, Dimensity 7050, Layar 6.7 inch AMOLED 120Hz, Kamera 64MP+8MP+32MP, Baterai 5000mAh, Fast Charge 67W, 5G, NFC", "rating": 86, "stok": "Tersedia", "garansi": "Garansi resmi Oppo 1 tahun"},
    {"nama": "Oppo Reno 11 Pro 5G", "harga": 7499000, "spesifikasi": "RAM 12GB, ROM 256GB, Dimensity 8100, Layar 6.7 inch AMOLED 120Hz, Kamera 50MP+8MP+32MP, Baterai 4600mAh, Fast Charge 80W, 5G, NFC", "rating": 88, "stok": "Tersedia", "garansi": "Garansi resmi Oppo 1 tahun"},
    {"nama": "Oppo Find X7 Ultra", "harga": 17999000, "spesifikasi": "RAM 16GB, ROM 512GB, Snapdragon 8 Gen 3, Layar 6.82 inch AMOLED 120Hz, Kamera Hasselblad 50MP+50MP+50MP+50MP, Baterai 5400mAh, Fast Charge 100W, 5G, NFC, IP68", "rating": 93, "stok": "Stok terbatas", "garansi": "Garansi resmi Oppo 1 tahun"},
    {"nama": "Oppo A58", "harga": 2599000, "spesifikasi": "RAM 6GB, ROM 128GB, Helio G85, Layar 6.72 inch FHD+ 90Hz, Kamera 50MP+2MP, Baterai 5000mAh, Fast Charge 33W, 4G, NFC", "rating": 79, "stok": "Tersedia", "garansi": "Garansi resmi Oppo 1 tahun"},

    # ── VIVO (6 unit) ──────────────────────────────────
    {"nama": "Vivo Y17s", "harga": 1799000, "spesifikasi": "RAM 4GB, ROM 128GB, Helio G85, Layar 6.56 inch HD+ 60Hz, Kamera 50MP+2MP, Baterai 5000mAh, Fast Charge 15W, 4G", "rating": 76, "stok": "Tersedia", "garansi": "Garansi resmi Vivo 1 tahun"},
    {"nama": "Vivo V29e 5G", "harga": 4499000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 695, Layar 6.67 inch AMOLED 120Hz, Kamera 64MP+8MP, Baterai 4800mAh, Fast Charge 44W, 5G, NFC", "rating": 83, "stok": "Tersedia", "garansi": "Garansi resmi Vivo 1 tahun"},
    {"nama": "Vivo V30 5G", "harga": 5999000, "spesifikasi": "RAM 12GB, ROM 256GB, Snapdragon 7 Gen 3, Layar 6.78 inch AMOLED 120Hz, Kamera ZEISS 50MP+50MP, Baterai 5000mAh, Fast Charge 80W, 5G, NFC, IP54", "rating": 87, "stok": "Tersedia", "garansi": "Garansi resmi Vivo 1 tahun"},
    {"nama": "Vivo X100 Pro", "harga": 14999000, "spesifikasi": "RAM 16GB, ROM 512GB, Dimensity 9300, Layar 6.78 inch AMOLED 120Hz, Kamera ZEISS 50MP+50MP+50MP, Baterai 5400mAh, Fast Charge 100W, 5G, NFC, IP68", "rating": 93, "stok": "Stok terbatas", "garansi": "Garansi resmi Vivo 1 tahun"},
    {"nama": "Vivo Y36", "harga": 2299000, "spesifikasi": "RAM 8GB, ROM 128GB, Helio G99, Layar 6.64 inch FHD+ 90Hz, Kamera 50MP+2MP, Baterai 5000mAh, Fast Charge 44W, 4G", "rating": 80, "stok": "Tersedia", "garansi": "Garansi resmi Vivo 1 tahun"},
    {"nama": "Vivo Y100 5G", "harga": 3699000, "spesifikasi": "RAM 8GB, ROM 256GB, Dimensity 6100+, Layar 6.67 inch AMOLED 120Hz, Kamera 50MP+2MP, Baterai 5000mAh, Fast Charge 44W, 5G, NFC", "rating": 82, "stok": "Tersedia", "garansi": "Garansi resmi Vivo 1 tahun"},

    # ── REALME (5 unit) ────────────────────────────────
    {"nama": "Realme C67", "harga": 2199000, "spesifikasi": "RAM 6GB, ROM 128GB, Snapdragon 685, Layar 6.72 inch FHD+ 90Hz, Kamera 108MP+2MP, Baterai 5000mAh, Fast Charge 33W, 4G, NFC", "rating": 81, "stok": "Tersedia", "garansi": "Garansi resmi Realme 1 tahun"},
    {"nama": "Realme 12 Pro+ 5G", "harga": 5499000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 7s Gen 2, Layar 6.7 inch AMOLED 120Hz, Kamera 50MP+64MP+8MP, Baterai 5000mAh, Fast Charge 67W, 5G, NFC, IP65", "rating": 87, "stok": "Tersedia", "garansi": "Garansi resmi Realme 1 tahun"},
    {"nama": "Realme GT 5 Pro", "harga": 8999000, "spesifikasi": "RAM 12GB, ROM 256GB, Snapdragon 8 Gen 3, Layar 6.78 inch AMOLED 144Hz, Kamera 50MP+8MP+50MP, Baterai 5400mAh, Fast Charge 100W, 5G, NFC, IP65", "rating": 91, "stok": "Tersedia", "garansi": "Garansi resmi Realme 1 tahun"},
    {"nama": "Realme Narzo 60", "harga": 2699000, "spesifikasi": "RAM 8GB, ROM 128GB, Helio G99, Layar 6.4 inch AMOLED 90Hz, Kamera 64MP+2MP, Baterai 5000mAh, Fast Charge 33W, 4G, NFC", "rating": 82, "stok": "Tersedia", "garansi": "Garansi resmi Realme 1 tahun"},
    {"nama": "Realme C55", "harga": 1899000, "spesifikasi": "RAM 6GB, ROM 128GB, Helio G88, Layar 6.72 inch FHD+ 90Hz, Kamera 64MP+2MP, Baterai 5000mAh, Fast Charge 33W, 4G, NFC", "rating": 79, "stok": "Tersedia", "garansi": "Garansi resmi Realme 1 tahun"},

    # ── APPLE / IPHONE (5 unit) ────────────────────────
    {"nama": "Apple iPhone 15", "harga": 14999000, "spesifikasi": "RAM 6GB, ROM 128GB, A16 Bionic, Layar 6.1 inch Super Retina XDR OLED, Kamera 48MP+12MP, Baterai 3877mAh, USB-C, 5G, NFC, IP68, Dynamic Island", "rating": 90, "stok": "Tersedia", "garansi": "Garansi resmi iBox 1 tahun"},
    {"nama": "Apple iPhone 15 Pro Max", "harga": 24999000, "spesifikasi": "RAM 8GB, ROM 256GB, A17 Pro, Layar 6.7 inch Super Retina XDR ProMotion 120Hz, Kamera 48MP+12MP+12MP, Baterai 4441mAh, USB-C, 5G, NFC, IP68, Titanium, Action Button", "rating": 95, "stok": "Tersedia", "garansi": "Garansi resmi iBox 1 tahun"},
    {"nama": "Apple iPhone 14", "harga": 11999000, "spesifikasi": "RAM 6GB, ROM 128GB, A15 Bionic, Layar 6.1 inch Super Retina XDR OLED, Kamera 12MP+12MP, Baterai 3279mAh, Lightning, 5G, NFC, IP68", "rating": 87, "stok": "Tersedia", "garansi": "Garansi resmi iBox 1 tahun"},
    {"nama": "Apple iPhone SE 2022", "harga": 7999000, "spesifikasi": "RAM 4GB, ROM 64GB, A15 Bionic, Layar 4.7 inch LCD Retina HD, Kamera 12MP, Baterai 2018mAh, Touch ID, 5G, NFC, IP67", "rating": 78, "stok": "Stok terbatas", "garansi": "Garansi resmi iBox 1 tahun"},
    {"nama": "Apple iPhone 13", "harga": 9999000, "spesifikasi": "RAM 4GB, ROM 128GB, A15 Bionic, Layar 6.1 inch Super Retina XDR OLED, Kamera 12MP+12MP, Baterai 3240mAh, Lightning, 5G, NFC, IP68", "rating": 85, "stok": "Tersedia", "garansi": "Garansi resmi iBox 1 tahun"},

    # ── POCO (4 unit) ──────────────────────────────────
    {"nama": "Poco M6 Pro", "harga": 2299000, "spesifikasi": "RAM 6GB, ROM 128GB, Helio G99 Ultra, Layar 6.67 inch AMOLED 120Hz, Kamera 64MP+8MP+2MP, Baterai 5000mAh, Fast Charge 67W, 4G, NFC", "rating": 84, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Poco X6 5G", "harga": 3599000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 7s Gen 2, Layar 6.67 inch AMOLED 120Hz, Kamera 64MP+8MP+2MP, Baterai 5100mAh, Fast Charge 67W, 5G, NFC", "rating": 87, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Poco F6 5G", "harga": 5499000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 8s Gen 3, Layar 6.67 inch AMOLED 120Hz, Kamera 50MP+8MP, Baterai 5000mAh, Fast Charge 90W, 5G, NFC, IP64", "rating": 90, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},
    {"nama": "Poco F6 Pro 5G", "harga": 7999000, "spesifikasi": "RAM 12GB, ROM 512GB, Snapdragon 8 Gen 2, Layar 6.67 inch AMOLED 120Hz, Kamera 50MP+8MP+2MP, Baterai 5000mAh, Fast Charge 120W, 5G, NFC, IP64", "rating": 91, "stok": "Tersedia", "garansi": "Garansi resmi Xiaomi 1 tahun"},

    # ── INFINIX (3 unit) ───────────────────────────────
    {"nama": "Infinix Hot 40i", "harga": 1299000, "spesifikasi": "RAM 4GB, ROM 128GB, Helio G36, Layar 6.56 inch HD+ 90Hz, Kamera 13MP+0.08MP, Baterai 5000mAh, 4G", "rating": 72, "stok": "Tersedia", "garansi": "Garansi resmi Infinix 1 tahun"},
    {"nama": "Infinix Note 40 Pro 5G", "harga": 3499000, "spesifikasi": "RAM 8GB, ROM 256GB, Dimensity 7020, Layar 6.78 inch AMOLED 120Hz, Kamera 108MP+2MP, Baterai 5000mAh, Fast Charge 68W + Wireless 20W, 5G, NFC", "rating": 85, "stok": "Tersedia", "garansi": "Garansi resmi Infinix 1 tahun"},
    {"nama": "Infinix GT 20 Pro", "harga": 4299000, "spesifikasi": "RAM 8GB, ROM 256GB, Dimensity 8200 Ultimate, Layar 6.78 inch AMOLED 144Hz, Kamera 108MP+2MP+2MP, Baterai 5000mAh, Fast Charge 45W, 5G, NFC, JBL Speaker", "rating": 86, "stok": "Tersedia", "garansi": "Garansi resmi Infinix 1 tahun"},

    # ── NOTHING (3 unit) ───────────────────────────────
    {"nama": "Nothing Phone (2a)", "harga": 4999000, "spesifikasi": "RAM 8GB, ROM 128GB, Dimensity 7200 Pro, Layar 6.7 inch AMOLED 120Hz, Kamera 50MP+50MP, Baterai 5000mAh, Fast Charge 45W, 5G, NFC, Glyph Interface", "rating": 85, "stok": "Tersedia", "garansi": "Garansi resmi Nothing 1 tahun"},
    {"nama": "Nothing Phone (2)", "harga": 8499000, "spesifikasi": "RAM 12GB, ROM 256GB, Snapdragon 8+ Gen 1, Layar 6.7 inch AMOLED 120Hz, Kamera 50MP+50MP, Baterai 4700mAh, Fast Charge 45W + Wireless 15W, 5G, NFC, IP54, Glyph", "rating": 88, "stok": "Stok terbatas", "garansi": "Garansi resmi Nothing 1 tahun"},
    {"nama": "Nothing Phone (1)", "harga": 5499000, "spesifikasi": "RAM 8GB, ROM 256GB, Snapdragon 778G+, Layar 6.55 inch AMOLED 120Hz, Kamera 50MP+50MP, Baterai 4500mAh, Fast Charge 33W + Wireless 15W, 5G, NFC, Glyph", "rating": 82, "stok": "Stok terbatas", "garansi": "Garansi resmi Nothing 1 tahun"},
]

print(f"Total smartphone: {len(smartphones)}")

# Brand count
from collections import Counter
brands = Counter()
for p in smartphones:
    brand = p['nama'].split()[0]
    brands[brand] += 1
for brand, count in brands.most_common():
    print(f"  {brand}: {count}")

# Harga range
prices = [p['harga'] for p in smartphones]
print(f"\nHarga range: Rp {min(prices):,} — Rp {max(prices):,}")

# Update knowledge base
with open('dataset/knowledge_base.json', 'r', encoding='utf-8') as f:
    kb = json.load(f)

for kat in kb['produk']:
    if kat['kategori'] == 'Smartphone':
        kat['daftar'] = smartphones
        break

with open('dataset/knowledge_base.json', 'w', encoding='utf-8') as f:
    json.dump(kb, f, ensure_ascii=False, indent=4)

print(f"\n✅ Knowledge base di-update: {len(smartphones)} smartphones dari {len(brands)} brand populer!")
