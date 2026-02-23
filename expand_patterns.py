"""
Script untuk menambahkan patterns baru ke intents.json
Fokus pada variasi slang, produk spesifik, dan query casual
yang belum tercakup di training data
"""
import json

with open('dataset/intents.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Patterns baru per intent — fokus pada variasi yang BELUM ADA
new_patterns = {
    "tanya_produk": [
        # --- Variasi rekomendasi ---
        "rekomendasi hp murah",
        "rekomen hp murah dong",
        "hp murah apa ya",
        "hp murah yang bagus",
        "rekomendasi hp 1 jutaan",
        "rekomendasi hp 2 jutaan",
        "rekomendasi hp 3 jutaan",
        "rekomendasi hp 5 jutaan",
        "rekomendasi hp gaming",
        "rekomendasi hp kamera bagus",
        "rekomendasi hp baterai awet",
        "hp yang worth it beli apa",
        "hp terbaik harga segitu",
        "minta saran hp dong",
        "suggest hp yang bagus",
        "saranin hp budget murah",
        "hp apa yang paling laris",
        "hp paling recommended apa",
        "hp bestseller apa",
        # --- Variasi tanya stok brand ---
        "ada samsung apa aja",
        "ada xiaomi apa aja",
        "ada iphone apa aja",
        "ada oppo apa aja",
        "ada vivo apa aja",
        "ada realme apa aja",
        "ada poco apa aja",
        "ada oneplus apa aja",
        "samsung apa aja yang ada",
        "xiaomi apa saja yang tersedia",
        "iphone yang dijual apa aja",
        "produk samsung apa aja",
        "produk xiaomi apa aja",
        "list hp samsung",
        "list hp xiaomi",
        "daftar hp yang dijual",
        "katalog hp",
        "katalog smartphone",
        # --- Variasi spesifik model ---
        "ada samsung galaxy a15 gak",
        "ada iphone 14 gak",
        "samsung galaxy s23 ready gak",
        "xiaomi redmi note 12 ada gak",
        "stok samsung galaxy a55",
        "stok iphone 15",
        "ready stock samsung",
        "ready stock xiaomi",
        # --- Variasi tipe produk ---
        "hp 5g apa aja",
        "hp yang sudah 5g",
        "smartphone 5g murah",
        "hp nfc ada apa aja",
        "hp ram 8gb apa aja",
        "hp ram 12gb",
        "hp storage 256gb",
        "hp snapdragon apa aja",
        "hp layar amoled",
        "hp kamera 108mp",
        "hp kamera 200mp",
        "hp baterai 5000mah",
        "hp fast charging",
        # --- Variasi casual ---
        "jual hp apa aja sih",
        "hp yang dijual apa",
        "mau lihat lihat hp",
        "mau cari hp",
        "lagi cari hp nih",
        "butuh hp baru",
        "pengen ganti hp",
        "mau beli hp baru",
        "lagi nyari smartphone",
        "cari handphone baru",
    ],
    
    "tanya_harga": [
        # --- Variasi slang harga ---
        "brp harganya",
        "harganya berapa ya",
        "berapa duit",
        "berapa rupiah",
        "price nya berapa",
        "harga hp samsung berapa",
        "harga hp xiaomi berapa",
        "harga iphone berapa",
        "samsung galaxy a15 harganya berapa",
        "xiaomi redmi note 12 harganya berapa",
        "iphone 14 harganya berapa",
        "iphone 15 berapa ya",
        "samsung a55 berapa",
        "poco x6 berapa",
        "oppo reno 11 harga",
        "vivo v25 harganya",
        "realme 10 pro berapa",
        # --- Variasi range harga ---
        "hp harga 1 jutaan",
        "hp harga 2 jutaan",
        "hp harga 3 jutaan",
        "hp harga 5 jutaan",
        "hp harga dibawah 2 juta",
        "hp harga dibawah 3 juta",
        "hp harga dibawah 5 juta",
        "hp murah dibawah 2 juta",
        "hp murah dibawah 1 juta",
        "hp paling murah berapa",
        "hp termurah harganya berapa",
        "hp termahal harganya berapa",
        # --- Variasi compare harga ---
        "mana yang lebih murah",
        "bandingkan harga samsung dan xiaomi",
        "lebih murah samsung atau xiaomi",
        "iphone atau samsung lebih murah",
        # --- Variasi slang ---
        "brp duit hp itu",
        "hrg nya brp",
        "hrgnya brapa",
        "brpaan tuh",
        "kisaran harga berapa",
        "range harga berapa",
        "budget berapa ya",
        "perlu siapain uang berapa",
        "modalnya berapa",
    ],
    
    "tanya_spesifikasi": [
        # --- Variasi spek umum ---
        "spek hp itu apa aja",
        "spesifikasi lengkap dong",
        "detail spek nya",
        "fitur hp itu apa",
        "kelebihan hp itu apa",
        "keunggulan produk itu",
        # --- Variasi spek spesifik ---
        "ram nya berapa",
        "storage nya berapa gb",
        "kamera nya berapa mp",
        "baterai nya berapa mah",
        "layar nya berapa inch",
        "prosesor nya apa",
        "chipset nya apa",
        "ada fast charging gak",
        "ada nfc gak",
        "support 5g gak",
        "refresh rate berapa",
        "os nya apa",
        "android berapa",
        # --- Variasi spek brand ---
        "spek samsung galaxy a15",
        "spek iphone 14",
        "spek xiaomi redmi note 12",
        "spek poco x6",
        "spek oppo reno 11",
        "spek vivo v25",
        "spesifikasi samsung galaxy s23",
        "spesifikasi iphone 15 pro",
        "detail samsung a55",
        "detail xiaomi poco",
        # --- Variasi casual ---
        "itu hp bagus gak sih",
        "hp itu worth it gak",
        "bagusan mana samsung atau xiaomi",
        "iphone atau samsung bagus mana",
        "review hp itu gimana",
        "rating hp itu berapa",
    ],
    
    "greeting": [
        # tambahan greeting casual
        "permisi",
        "permisi kak",
        "selamat datang",
        "ada orang gak",
        "min",
        "kak",
        "helo",
        "yokk",
        "woi",
        "p",
        "halooo",
        "hai kak",
        "hi min",
        "pagi kak",
        "siang kak",
        "sore kak",
        "malam kak",
    ],
    
    "tanya_promo": [
        # --- brand promo ---
        "promo samsung apa",
        "promo xiaomi apa",
        "promo iphone ada gak",
        "diskon hp samsung",
        "diskon hp xiaomi",
        "ada flash sale gak",
        "ada sale gak",
        "kapan ada promo",
        "promo akhir bulan",
        "promo bulan ini",
        "ada voucher gak",
        "ada kupon gak",
        "cashback ada gak",
        "potongan harga ada gak",
        "ada penawaran spesial",
        "deals apa aja",
    ],
    
    "tanya_garansi": [
        "garansi samsung berapa lama",
        "garansi xiaomi berapa lama",
        "garansi iphone berapa lama",
        "garansi oppo berapa lama",
        "garansi resmi atau distributor",
        "hp ini garansi resmi gak",
        "original gak hp nya",
        "hp asli gak",
        "bukan kw kan",
        "bukan palsu kan",
        "produk ori gak",
    ],
    
    "tanya_pengiriman": [
        "ongkir ke jakarta berapa",
        "ongkir ke bandung berapa",
        "ongkir ke surabaya berapa",
        "kirim ke luar kota bisa",
        "kirim ke luar jawa bisa",
        "pengiriman pakai apa",
        "kirim pakai jne bisa",
        "kirim pakai jnt bisa",
        "kirim pakai sicepat bisa",
        "estimasi sampai berapa hari",
        "berapa lama sampai",
        "kapan sampai kalau pesan sekarang",
    ],
    
    "tanya_pembayaran": [
        "bisa bayar pakai gopay",
        "bisa bayar pakai ovo",
        "bisa bayar pakai dana",
        "bisa bayar pakai shopeepay",
        "terima qris gak",
        "bisa pake kartu kredit",
        "bisa transfer bca",
        "bisa transfer bri",
        "bisa transfer mandiri",
        "bisa cicilan gak hp",
        "cicilan 0 persen ada",
        "kredit hp bisa gak",
        "nyicil hp bisa",
    ],
}

# Add new patterns to existing intents
total_added = 0
for intent in data['intents']:
    tag = intent['tag']
    if tag in new_patterns:
        existing = set(p.lower() for p in intent['patterns'])
        added = 0
        for new_p in new_patterns[tag]:
            if new_p.lower() not in existing:
                intent['patterns'].append(new_p)
                existing.add(new_p.lower())
                added += 1
        total_added += added
        print(f"  {tag:<25} +{added} patterns (total: {len(intent['patterns'])})")

# Save
with open('dataset/intents.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n✅ Total {total_added} patterns baru ditambahkan!")
print(f"   Dataset sekarang: {sum(len(i['patterns']) for i in data['intents'])} total patterns")
