'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, X, Settings, Trash2, ChevronRight,
    ExternalLink, Copy, Check, AlertCircle,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Connected Platforms Page — Persis chat.cekat.ai
   
   Arsitektur halaman (2-panel layout):
   
   ┌─────────────────────────┬──────────────────────────────────┐
   │  Inbox Sidebar (~380px) │   Settings / Setup Panel         │
   │                         │                                  │
   │  "Inboxes"              │  (No Inbox Selected)             │
   │  subtitle               │  — atau —                        │
   │  [+] button             │  Platform Selection Modal        │
   │  [Search by name...]    │  — atau —                        │
   │                         │  WhatsApp Setup Wizard           │
   │  Inbox list / empty     │  Web Chat Setup Form             │
   │                         │  Instagram/Messenger OAuth       │
   │                         │  Inbox Settings (detail view)    │
   └─────────────────────────┴──────────────────────────────────┘
   
   Fitur kompleks:
   1. Platform Selection Modal (4 platform: Messenger, Web Live Chat, WhatsApp, Instagram)
   2. WhatsApp Business Setup — multi-step wizard dengan numbered instructions
   3. Web Live Chat Setup — form: Name, Description, Divisions, Agents, FAQ, Social Links
   4. Instagram & Messenger — OAuth connect flow
   5. Inbox Settings — edit name, bot assignment, delete, embed code
   6. Inbox list sidebar — search, platform icons, status badges
   ═══════════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────

type PlatformType = 'whatsapp' | 'instagram' | 'messenger' | 'web_livechat';
type SetupStep = 'select_platform' | 'setup_whatsapp' | 'setup_webchat' | 'setup_instagram' | 'setup_messenger';

interface Inbox {
    id: string;
    name: string;
    platform: PlatformType;
    status: 'active' | 'inactive' | 'pending';
    phoneNumber?: string;
    agents: string[];
    aiAgent?: string;
    createdAt: string;
    description?: string;
    faqQuestions?: string[];
    socialLinks?: { url: string; label: string }[];
    embedCode?: string;
}

// ──────────────────────────────────────────────────
// PLATFORM CONFIG — Icons & Colors
// ──────────────────────────────────────────────────

const platformMeta: Record<PlatformType, { label: string; color: string; bgColor: string }> = {
    messenger: { label: 'Messenger', color: '#0084FF', bgColor: '#E3F2FD' },
    web_livechat: { label: 'Web Live Chat', color: '#6B7280', bgColor: '#F3F4F6' },
    whatsapp: { label: 'WhatsApp Business', color: '#25D366', bgColor: '#E8F5E9' },
    instagram: { label: 'Instagram', color: '#E1306C', bgColor: '#FCE4EC' },
};

// SVG Icons untuk setiap platform (lebih detail daripada generic icon)
function PlatformIcon({ type, size = 48 }: { type: PlatformType; size?: number }) {
    const s = size;
    switch (type) {
        case 'messenger':
            return (
                <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#0084FF" />
                    <path d="M24 13C17.925 13 13 17.477 13 23.09c0 3.175 1.575 6.006 4.038 7.856V35l3.734-2.05c.997.276 2.053.425 3.228.425 6.075 0 11-4.477 11-10.284C35 17.477 30.075 13 24 13z" fill="white" />
                    <path d="M25.176 25.75L22.294 22.7 16.75 25.75l6.088-6.45 2.956 3.05L31.25 19.3l-6.074 6.45z" fill="#0084FF" />
                </svg>
            );
        case 'web_livechat':
            return (
                <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#94A3B8" />
                    <rect x="14" y="15" width="20" height="15" rx="3" fill="white" />
                    <circle cx="20" cy="22.5" r="1.5" fill="#94A3B8" />
                    <circle cx="24" cy="22.5" r="1.5" fill="#94A3B8" />
                    <circle cx="28" cy="22.5" r="1.5" fill="#94A3B8" />
                    <polygon points="18,30 22,30 18,35" fill="white" />
                </svg>
            );
        case 'whatsapp':
            return (
                <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#25D366" />
                    <path d="M33.6 14.34A13.43 13.43 0 0 0 24.06 11C17.6 11 12.33 16.27 12.33 22.73a11.67 11.67 0 0 0 1.56 5.83L12 35l6.61-1.73a13.35 13.35 0 0 0 5.45 1.19h.01c6.46 0 11.73-5.27 11.73-11.73a11.69 11.69 0 0 0-2.2-7.39z" fill="white" />
                    <path d="M24.08 32.56a11.07 11.07 0 0 1-5.1-1.25l-.36-.22-3.78.99 1.01-3.68-.24-.37a11.03 11.03 0 0 1-1.7-5.9c0-5.52 4.5-10.02 10.03-10.02a10 10 0 0 1 7.1 2.94 9.97 9.97 0 0 1 2.93 7.1c0 5.53-4.5 10.03-10.02 10.03l.13-.62zm5.5-7.5c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.68.15s-.78.98-.95 1.17-.35.22-.65.08a8.2 8.2 0 0 1-3.86-3.37c-.29-.5.29-.47.84-1.55.1-.18.05-.35-.02-.48-.08-.15-.68-1.63-.93-2.23-.25-.58-.5-.5-.68-.51l-.58-.01c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35z" fill="#25D366" />
                </svg>
            );
        case 'instagram':
            return (
                <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
                    <defs>
                        <radialGradient id="ig1" cx="17%" cy="100%" r="120%" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#FFDD55" />
                            <stop offset="10%" stopColor="#FFDD55" />
                            <stop offset="50%" stopColor="#FF543E" />
                            <stop offset="100%" stopColor="#C837AB" />
                        </radialGradient>
                    </defs>
                    <circle cx="24" cy="24" r="22" fill="url(#ig1)" />
                    <rect x="14" y="14" width="20" height="20" rx="6" stroke="white" strokeWidth="2.5" fill="none" />
                    <circle cx="24" cy="24" r="5" stroke="white" strokeWidth="2.5" fill="none" />
                    <circle cx="30.5" cy="17.5" r="1.5" fill="white" />
                </svg>
            );
    }
}

// ──────────────────────────────────────────────────
// SAMPLE DATA — Demo inbox yang sudah terkoneksi
// ──────────────────────────────────────────────────

const sampleInboxes: Inbox[] = [
    {
        id: 'inbox-1',
        name: 'ReonShop WhatsApp',
        platform: 'whatsapp',
        status: 'active',
        phoneNumber: '+62 812-3456-7890',
        agents: ['CS 1', 'CS 2'],
        aiAgent: 'Cika',
        createdAt: '20 Feb 2026',
        embedCode: '',
    },
    {
        id: 'inbox-2',
        name: 'Website Livechat',
        platform: 'web_livechat',
        status: 'active',
        agents: ['CS 1'],
        aiAgent: 'Cika',
        createdAt: '22 Feb 2026',
        description: 'Livechat widget for reonshop.com',
        faqQuestions: ['Bagaimana cara order?', 'Berapa ongkos kirim?', 'Apakah bisa COD?'],
        socialLinks: [
            { url: 'https://instagram.com/reonshop', label: 'Instagram' },
            { url: 'https://wa.me/628123456789', label: 'WhatsApp' },
        ],
        embedCode: '<script src="https://widget.cepat.chat/widget.js" data-tenant="reonshop"></script>',
    },
    {
        id: 'inbox-3',
        name: 'ReonShop Instagram',
        platform: 'instagram',
        status: 'active',
        agents: ['CS 1'],
        aiAgent: 'Cika',
        createdAt: '25 Feb 2026',
    },
];

// ──────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────

/* ── Platform Selection Modal ── */
function PlatformModal({ open, onClose, onSelect }: {
    open: boolean;
    onClose: () => void;
    onSelect: (p: PlatformType) => void;
}) {
    if (!open) return null;
    const platforms: PlatformType[] = ['messenger', 'web_livechat', 'whatsapp', 'instagram'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#F9FAFB] rounded-2xl shadow-xl w-[780px] max-w-[90vw] p-8"
            >
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-[20px] font-bold text-foreground">Platform</h2>
                        <p className="text-[13px] text-[#6B7280] mt-1">Select the platform you wish to establish your new inbox</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white">
                        <X className="w-5 h-5 text-[#6B7280]" />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                    {platforms.map(p => (
                        <button
                            key={p}
                            onClick={() => onSelect(p)}
                            className="flex flex-col items-center gap-3 p-6 bg-white border border-[#E5E7EB] rounded-xl hover:border-primary hover:shadow-md transition-all group"
                        >
                            <PlatformIcon type={p} size={56} />
                            <span className="text-[14px] font-medium text-foreground group-hover:text-primary">
                                {platformMeta[p].label}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

/* ── WhatsApp Business Setup Wizard ──
   Penjelasan alur (persis cekat.ai):
   
   Step 1: Pilih/buat WhatsApp Business Account + profile + website
   Step 2: Masukkan nama bisnis + display name + peringatan
   Step 3: Input nomor telepon + kode negara + pilih metode verifikasi (SMS/Phone)
   Step 4: Halaman sukses "Selamat! Inbox berhasil dibuat" + link Meta Business Suite
   
   Fitur:
   - Progress bar di atas (3 step circles + garis penghubung)
   - Country code dropdown (Indonesia +62 default)
   - Verifikasi via SMS atau Phone Call
   - Warning text berwarna merah tentang batasan API
   - Success page dengan icon celebratory + link ke Meta
*/
function WhatsAppSetup({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
    const [step, setStep] = useState(1);
    const [accountType, setAccountType] = useState('create');
    const [profileType, setProfileType] = useState('create');
    const [website, setWebsite] = useState('');
    const [bizName, setBizName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+62');
    const [verifyMethod, setVerifyMethod] = useState<'sms' | 'call'>('sms');

    // Daftar kode negara umum
    const countryCodes = [
        { code: '+62', label: '🇮🇩 Indonesia (+62)' },
        { code: '+60', label: '🇲🇾 Malaysia (+60)' },
        { code: '+65', label: '🇸🇬 Singapore (+65)' },
        { code: '+66', label: '🇹🇭 Thailand (+66)' },
        { code: '+63', label: '🇵🇭 Philippines (+63)' },
        { code: '+1', label: '🇺🇸 USA (+1)' },
        { code: '+44', label: '🇬🇧 UK (+44)' },
        { code: '+91', label: '🇮🇳 India (+91)' },
        { code: '+81', label: '🇯🇵 Japan (+81)' },
        { code: '+61', label: '🇦🇺 Australia (+61)' },
    ];

    // Step 4 = success
    if (step === 4) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F9FAFB]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="text-center max-w-md"
                >
                    {/* Success icon */}
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-[24px] font-bold text-foreground mb-2">
                        🎉 Selamat! Inbox Berhasil Dibuat
                    </h1>
                    <p className="text-[13px] text-[#6B7280] mb-6 leading-relaxed">
                        Inbox WhatsApp Business Anda sudah berhasil dipasang.
                        Sekarang Anda bisa mulai menerima dan menjawab pesan dari pelanggan melalui WhatsApp!
                    </p>

                    {/* Meta links */}
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6 text-left space-y-3">
                        <h3 className="text-[14px] font-semibold text-foreground">Langkah Selanjutnya</h3>
                        <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F4F6] transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <ExternalLink className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[12.5px] font-medium text-foreground group-hover:text-primary">Atur Billing di Meta Business Suite</p>
                                <p className="text-[11px] text-[#9CA3AF]">Tambahkan metode pembayaran untuk mengirim pesan</p>
                            </div>
                        </a>
                        <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F4F6] transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                <ExternalLink className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[12.5px] font-medium text-foreground group-hover:text-primary">Ganti Foto Profil WhatsApp</p>
                                <p className="text-[11px] text-[#9CA3AF]">Ubah foto profil bisnis Anda di Meta Business Suite</p>
                            </div>
                        </a>
                    </div>

                    <button
                        onClick={onFinish}
                        className="px-8 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
                    >
                        Kembali ke Daftar Inbox
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <PlatformIcon type="whatsapp" size={40} />
                    <div>
                        <h1 className="text-[22px] font-bold text-foreground">Instructions</h1>
                        <p className="text-[12px] text-[#6B7280]">Setup WhatsApp Business API</p>
                    </div>
                </div>

                {/* ── Progress Indicator ──
                   3 step circles dengan garis penghubung
                   Warna: active = primary, done = green, pending = gray */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <button
                                onClick={() => s <= step && setStep(s)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${s < step ? 'bg-green-500 text-white' :
                                    s === step ? 'bg-primary text-white shadow-md shadow-primary/30' :
                                        'bg-[#E5E7EB] text-[#9CA3AF]'
                                    }`}
                            >
                                {s < step ? <Check className="w-5 h-5" /> : s}
                            </button>
                            {i < 2 && (
                                <div className={`w-20 h-0.5 mx-1 ${s < step ? 'bg-green-500' : 'bg-[#E5E7EB]'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ═══ Step 1: Business Info ═══ */}
                {step === 1 && (
                    <div className="flex gap-8">
                        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl p-6">
                            <h3 className="text-[15px] font-semibold text-foreground mb-1">
                                Create or select your WhatsApp Business account
                            </h3>
                            <p className="text-[12px] text-[#6B7280] mb-4">
                                This WhatsApp Business account will belong to your business portfolio.
                            </p>

                            <label className="text-[12px] font-medium text-[#374151] block mb-1.5">Choose a WhatsApp Business account</label>
                            <select
                                value={accountType}
                                onChange={e => setAccountType(e.target.value)}
                                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] mb-4 focus:outline-none focus:border-primary"
                            >
                                <option value="create">Create a WhatsApp Business account</option>
                                <option value="existing">Use existing account</option>
                            </select>

                            <label className="text-[12px] font-medium text-[#374151] block mb-1.5">Create or select a WhatsApp Business profile</label>
                            <select
                                value={profileType}
                                onChange={e => setProfileType(e.target.value)}
                                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] mb-4 focus:outline-none focus:border-primary"
                            >
                                <option value="create">Create a new WhatsApp Business profile</option>
                                <option value="existing">Use existing profile</option>
                            </select>

                            <label className="text-[12px] font-medium text-[#374151] block mb-1">Business website or profile page</label>
                            <p className="text-[11px] text-[#9CA3AF] mb-1.5">
                                If you don&apos;t have a business website, you can use a URL from any of your social media profile pages.
                            </p>
                            <input
                                type="text"
                                value={website}
                                onChange={e => setWebsite(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Instruksi kanan */}
                        <div className="w-[260px] flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">1</div>
                                <div>
                                    <h4 className="text-[15px] font-semibold text-foreground mb-2">Tambahkan Info Bisnis Anda</h4>
                                    <p className="text-[12px] text-[#6B7280] leading-relaxed">
                                        Pilih akun business manager atau buat yang baru. Jika anda ingin menghubungkan akun WhatsApp dengan FB Ads, pilih business yang terhubung dengan akun FB Ads anda.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Step 2: Account Name & Display Name ═══ */}
                {step === 2 && (
                    <div className="flex gap-8">
                        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl p-6">
                            <label className="text-[12px] font-medium text-[#374151] block mb-1.5">
                                WhatsApp business account name
                                <span className="ml-1 text-[#9CA3AF]" title="Info">
                                    <AlertCircle className="w-3.5 h-3.5 inline" />
                                </span>
                            </label>
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    value={bizName}
                                    onChange={e => setBizName(e.target.value)}
                                    placeholder="Enter your business name"
                                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF]">{bizName.length}/255</span>
                            </div>

                            <label className="text-[12px] font-medium text-[#374151] block mb-1">WhatsApp business display name</label>
                            <p className="text-[11px] text-[#9CA3AF] mb-1.5">
                                Your display name should match your business name and adhere to WhatsApp Business display name guidelines.
                            </p>
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Display name (visible to customers)"
                                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="w-[260px] flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">2</div>
                                <div>
                                    <h4 className="text-[15px] font-semibold text-foreground mb-2">Buat Akun WhatsApp Bisnis</h4>
                                    <p className="text-[12px] text-[#6B7280] leading-relaxed">
                                        Masukkan nama bisnis anda untuk ditampilkan di WhatsApp Bisnis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Step 3: Phone Number + Verification ═══ */}
                {step === 3 && (
                    <div className="flex gap-8">
                        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl p-6">
                            {/* Phone Number with Country Code */}
                            <label className="text-[12px] font-medium text-[#374151] block mb-1.5">Phone number</label>
                            <p className="text-[11px] text-[#9CA3AF] mb-2">
                                Enter the phone number you want to use for WhatsApp Business API.
                            </p>
                            <div className="flex gap-2 mb-4">
                                <select
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value)}
                                    className="w-[200px] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary bg-white"
                                >
                                    {countryCodes.map(cc => (
                                        <option key={cc.code} value={cc.code}>{cc.label}</option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="812-3456-7890"
                                    className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Verification Method */}
                            <label className="text-[12px] font-medium text-[#374151] block mb-2">Verification method</label>
                            <div className="flex gap-3 mb-5">
                                <button
                                    onClick={() => setVerifyMethod('sms')}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-[13px] font-medium transition-all text-center ${verifyMethod === 'sms'
                                        ? 'border-primary bg-[#EEF2FF] text-primary'
                                        : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]'
                                        }`}
                                >
                                    📱 SMS
                                </button>
                                <button
                                    onClick={() => setVerifyMethod('call')}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-[13px] font-medium transition-all text-center ${verifyMethod === 'call'
                                        ? 'border-primary bg-[#EEF2FF] text-primary'
                                        : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]'
                                        }`}
                                >
                                    📞 Phone Call
                                </button>
                            </div>

                            {/* Warning */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[12px] text-red-600 font-medium mb-1">Perhatian Penting</p>
                                        <p className="text-[11px] text-red-500 leading-relaxed">
                                            Nomor ini <strong>tidak boleh terdaftar</strong> di WhatsApp reguler (personal).
                                            Jika nomor sudah terdaftar di WhatsApp, hapus dulu akun WhatsApp-nya sebelum mendaftar ke API.
                                            Nomor ini akan menjadi nomor WhatsApp Business API dan tidak bisa digunakan di aplikasi WhatsApp biasa.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-[260px] flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">3</div>
                                <div>
                                    <h4 className="text-[15px] font-semibold text-foreground mb-2">Daftarkan Nomor Telepon</h4>
                                    <p className="text-[12px] text-[#6B7280] leading-relaxed">
                                        Nomor ini akan digunakan untuk menerima dan mengirim pesan melalui WhatsApp Business API.
                                        Pastikan nomor belum terdaftar di WhatsApp reguler.
                                    </p>
                                    <p className="text-[11px] text-primary mt-3 font-medium">
                                        💡 Anda akan menerima kode verifikasi via {verifyMethod === 'sms' ? 'SMS' : 'telepon'} ke nomor ini.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons — dinamis per step */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={step === 1 ? onBack : () => setStep(step - 1)}
                        className="px-6 py-2.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                    >
                        {step === 1 ? 'Cancel' : '← Previous'}
                    </button>
                    <button
                        onClick={() => {
                            if (step < 3) {
                                setStep(step + 1);
                            } else {
                                setStep(4); // Go to success page
                            }
                        }}
                        className="px-6 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg flex items-center gap-2 transition-colors"
                    >
                        {step < 3 ? (
                            <>Next Step →</>
                        ) : (
                            <>
                                Connect with WhatsApp
                                <ExternalLink className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Web Live Chat Setup Form ── */
function WebChatSetup({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [faqs, setFaqs] = useState(['']);
    const [links, setLinks] = useState([{ url: '', label: '' }]);

    const addFaq = () => setFaqs([...faqs, '']);
    const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i));
    const updateFaq = (i: number, v: string) => { const n = [...faqs]; n[i] = v; setFaqs(n); };

    const addLink = () => setLinks([...links, { url: '', label: '' }]);
    const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
    const updateLink = (i: number, k: 'url' | 'label', v: string) => {
        const n = [...links]; n[i] = { ...n[i], [k]: v }; setLinks(n);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
                {/* Name */}
                <div className="mb-5">
                    <label className="text-[14px] font-semibold text-foreground block mb-1.5">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter bot name here..."
                        className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                    />
                </div>

                {/* Description */}
                <div className="mb-5">
                    <label className="text-[14px] font-semibold text-foreground block mb-1.5">Description</label>
                    <input
                        type="text"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="ex: Business A Shop"
                        className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                    />
                </div>

                {/* Select Divisions */}
                <div className="mb-5">
                    <label className="text-[14px] font-semibold text-foreground block mb-1.5">Select Divisions</label>
                    <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary text-[#9CA3AF]">
                        <option>Choose divisions...</option>
                        <option>Sales</option>
                        <option>Support</option>
                        <option>Marketing</option>
                    </select>
                </div>

                {/* Select Agents */}
                <div className="mb-5">
                    <label className="text-[14px] font-semibold text-foreground block mb-1.5">Select Agents</label>
                    <div className="border border-[#E5E7EB] rounded-lg p-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-[#D1D5DB] text-primary focus:ring-primary" />
                            <span className="text-[13px] text-foreground px-2 py-0.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded">ReonShop</span>
                        </label>
                    </div>
                </div>

                {/* FAQ Questions — dynamic list */}
                <div className="mb-5">
                    <label className="text-[14px] font-semibold text-foreground block mb-1.5">FAQ Questions</label>
                    {faqs.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                value={q}
                                onChange={e => updateFaq(i, e.target.value)}
                                placeholder={`FAQ Question ${i + 1}`}
                                className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                            />
                            <button onClick={() => removeFaq(i)} className="text-red-500 text-[12px] font-medium hover:underline flex-shrink-0">
                                Remove
                            </button>
                        </div>
                    ))}
                    <button onClick={addFaq} className="text-[12px] text-primary font-medium hover:underline">
                        + Add Question
                    </button>
                </div>

                {/* Social Links — dynamic list */}
                <div className="mb-8">
                    <label className="text-[14px] font-semibold text-foreground block mb-1.5">Social Links</label>
                    {links.map((link, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                value={link.url}
                                onChange={e => updateLink(i, 'url', e.target.value)}
                                placeholder="Link URL"
                                className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                value={link.label}
                                onChange={e => updateLink(i, 'label', e.target.value)}
                                placeholder="Label"
                                className="w-28 border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary"
                            />
                            <button className="px-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                                Choose File
                            </button>
                            <button onClick={() => removeLink(i)} className="px-3 py-2 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 flex-shrink-0">
                                Remove
                            </button>
                        </div>
                    ))}
                    <button onClick={addLink} className="text-[12px] text-primary font-medium hover:underline">
                        + Add New Link
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button onClick={onBack} className="px-6 py-2.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                        Cancel
                    </button>
                    <button onClick={onFinish} className="px-6 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
                        Finish
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Instagram / Messenger OAuth Connect ── */
function OAuthConnect({ platform, onBack, onFinish }: { platform: 'instagram' | 'messenger'; onBack: () => void; onFinish: () => void }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <PlatformIcon type={platform} size={72} />
            <h2 className="text-[20px] font-bold text-foreground mt-6 mb-2">Connect {platformMeta[platform].label}</h2>
            <p className="text-[13px] text-[#6B7280] text-center max-w-md mb-8">
                {platform === 'instagram'
                    ? 'Connect your Instagram Business account to start receiving DMs directly in Cepat Chat. You need a Facebook Page linked to your Instagram account.'
                    : 'Connect your Facebook Page to receive Messenger messages in Cepat Chat. Make sure you have admin access to the Facebook Page.'
                }
            </p>

            <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Prerequisites</h3>
                <ul className="space-y-2">
                    {(platform === 'instagram' ? [
                        'Instagram Business or Creator account',
                        'Facebook Page linked to Instagram',
                        'Admin access to Facebook Page',
                        'Allow access to messages in settings',
                    ] : [
                        'Facebook Page with admin access',
                        'Messenger enabled on the Page',
                        'Business verification (recommended)',
                    ]).map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-[12.5px] text-[#374151]">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex gap-3">
                <button onClick={onBack} className="px-6 py-2.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                    Back
                </button>
                <button
                    onClick={onFinish}
                    className="px-6 py-2.5 text-[13px] font-semibold text-white rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: platformMeta[platform].color }}
                >
                    Connect with {platform === 'instagram' ? 'Instagram' : 'Facebook'}
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

/* ── Inbox Settings Panel (detail view saat inbox dipilih) ── */
function InboxSettings({ inbox }: { inbox: Inbox }) {
    const [copied, setCopied] = useState(false);
    const meta = platformMeta[inbox.platform];

    const copyEmbed = () => {
        if (inbox.embedCode) {
            navigator.clipboard.writeText(inbox.embedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <PlatformIcon type={inbox.platform} size={48} />
                    <div>
                        <h2 className="text-[18px] font-bold text-foreground">{inbox.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12px] text-[#6B7280]">{meta.label}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${inbox.status === 'active'
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : inbox.status === 'pending'
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                {inbox.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="space-y-5">
                    {/* General */}
                    <SettingsCard title="General Information">
                        <SettingsRow label="Inbox Name" value={inbox.name} editable />
                        {inbox.phoneNumber && <SettingsRow label="Phone Number" value={inbox.phoneNumber} />}
                        {inbox.description && <SettingsRow label="Description" value={inbox.description} editable />}
                        <SettingsRow label="Created" value={inbox.createdAt} />
                    </SettingsCard>

                    {/* Agents */}
                    <SettingsCard title="Agent Assignment">
                        <div className="mb-3">
                            <label className="text-[12px] font-medium text-[#6B7280] block mb-1">AI Agent</label>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 text-[12px] bg-[#DBEAFE] text-primary rounded-lg font-medium">
                                    {inbox.aiAgent || 'Not assigned'}
                                </span>
                                <button className="text-[11px] text-primary hover:underline">Change</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[12px] font-medium text-[#6B7280] block mb-1">Human Agents</label>
                            <div className="flex flex-wrap gap-1.5">
                                {inbox.agents.map(a => (
                                    <span key={a} className="px-2.5 py-1 text-[12px] bg-[#F3F4F6] text-foreground rounded-lg">
                                        {a}
                                    </span>
                                ))}
                                <button className="px-2 py-1 text-[11px] text-primary border border-dashed border-[#C7D2FE] rounded-lg hover:bg-[#EEF2FF]">
                                    + Add Agent
                                </button>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* FAQ (Web Chat only) */}
                    {inbox.faqQuestions && inbox.faqQuestions.length > 0 && (
                        <SettingsCard title="FAQ Questions">
                            <div className="space-y-2">
                                {inbox.faqQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                        <span className="text-[12.5px] text-foreground">{q}</span>
                                        <button className="text-[11px] text-[#9CA3AF] hover:text-red-500">Remove</button>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-2 text-[12px] text-primary hover:underline">+ Add Question</button>
                        </SettingsCard>
                    )}

                    {/* Social Links (Web Chat only) */}
                    {inbox.socialLinks && inbox.socialLinks.length > 0 && (
                        <SettingsCard title="Social Links">
                            <div className="space-y-2">
                                {inbox.socialLinks.map((link, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                        <div>
                                            <span className="text-[12px] font-medium text-foreground">{link.label}</span>
                                            <span className="text-[11px] text-[#9CA3AF] ml-2">{link.url}</span>
                                        </div>
                                        <button className="text-[11px] text-[#9CA3AF] hover:text-red-500">Remove</button>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-2 text-[12px] text-primary hover:underline">+ Add Link</button>
                        </SettingsCard>
                    )}

                    {/* Embed Code (Web Chat only) */}
                    {inbox.embedCode && (
                        <SettingsCard title="Embed Code">
                            <p className="text-[12px] text-[#6B7280] mb-2">Add this code snippet to your website to enable the live chat widget.</p>
                            <div className="relative">
                                <pre className="bg-[#1E293B] text-[#E2E8F0] text-[12px] p-4 rounded-lg overflow-x-auto">
                                    <code>{inbox.embedCode}</code>
                                </pre>
                                <button
                                    onClick={copyEmbed}
                                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[11px] text-white bg-white/20 rounded hover:bg-white/30 transition-colors"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </SettingsCard>
                    )}

                    {/* Danger Zone */}
                    <div className="border border-red-200 rounded-xl p-5">
                        <h3 className="text-[14px] font-semibold text-red-600 mb-2">Danger Zone</h3>
                        <p className="text-[12px] text-[#6B7280] mb-3">
                            Deleting this inbox will disconnect the platform and remove all related settings. This action cannot be undone.
                        </p>
                        <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Inbox
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-foreground mb-3">{title}</h3>
            {children}
        </div>
    );
}

function SettingsRow({ label, value, editable }: { label: string; value: string; editable?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
            <span className="text-[12px] text-[#6B7280]">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-foreground font-medium">{value}</span>
                {editable && (
                    <button className="text-[11px] text-primary hover:underline">Edit</button>
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────

export default function ConnectedPlatformsPage() {
    const [inboxes] = useState<Inbox[]>(sampleInboxes);
    const [selectedInboxId, setSelectedInboxId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [setupStep, setSetupStep] = useState<SetupStep | null>(null);

    const selectedInbox = inboxes.find(i => i.id === selectedInboxId) || null;

    const filteredInboxes = inboxes.filter(i =>
        searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectPlatform = (p: PlatformType) => {
        setShowPlatformModal(false);
        switch (p) {
            case 'whatsapp': setSetupStep('setup_whatsapp'); break;
            case 'web_livechat': setSetupStep('setup_webchat'); break;
            case 'instagram': setSetupStep('setup_instagram'); break;
            case 'messenger': setSetupStep('setup_messenger'); break;
        }
    };

    const handleSetupBack = () => setSetupStep(null);
    const handleSetupFinish = () => {
        setSetupStep(null);
        // In real app: create inbox via API then refresh list
    };

    return (
        <div className="flex h-[calc(100vh-52px)]">
            <PlatformModal
                open={showPlatformModal}
                onClose={() => setShowPlatformModal(false)}
                onSelect={handleSelectPlatform}
            />

            {/* ═══════════════════════════════════════
                Inbox Sidebar (kiri) — persis cekat.ai
            ═══════════════════════════════════════ */}
            <div className="w-[380px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">
                {/* Header: "Inboxes" + (+) button */}
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                        <h1 className="text-[18px] font-bold text-foreground">Inboxes</h1>
                        <button
                            onClick={() => setShowPlatformModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-dashed border-primary text-primary hover:bg-[#EEF2FF] transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[12.5px] text-[#6B7280]">This is where you can connect all your platforms</p>
                </div>

                {/* Search */}
                <div className="px-5 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name..."
                            className="w-full pl-10 pr-3 py-2.5 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary placeholder:text-[#9CA3AF]"
                        />
                    </div>
                </div>

                {/* Inbox List */}
                <div className="flex-1 overflow-y-auto px-3">
                    {filteredInboxes.length === 0 ? (
                        /* Empty State — persis cekat.ai */
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-[#D1D5DB] mb-4">
                                <rect x="8" y="12" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 22h48" stroke="currentColor" strokeWidth="2" />
                                <circle cx="14" cy="17" r="2" fill="currentColor" />
                                <circle cx="20" cy="17" r="2" fill="currentColor" />
                                <circle cx="26" cy="17" r="2" fill="currentColor" />
                                <rect x="20" y="30" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
                                <rect x="20" y="37" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
                            </svg>
                            <h3 className="text-[15px] font-bold text-foreground mb-1">Inbox is Empty</h3>
                            <p className="text-[12.5px] text-[#9CA3AF] mb-4">
                                You don&apos;t have any inboxes yet.<br />Click the button below to create one.
                            </p>
                            <button
                                onClick={() => setShowPlatformModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Inbox
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1 py-1">
                            {filteredInboxes.map(inbox => {
                                const meta = platformMeta[inbox.platform];
                                const isActive = inbox.id === selectedInboxId;

                                return (
                                    <button
                                        key={inbox.id}
                                        onClick={() => { setSelectedInboxId(inbox.id); setSetupStep(null); }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${isActive
                                            ? 'bg-[#EEF2FF] border border-[#C7D2FE]'
                                            : 'hover:bg-[#F9FAFB] border border-transparent'
                                            }`}
                                    >
                                        <PlatformIcon type={inbox.platform} size={36} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[13px] font-semibold text-foreground truncate">{inbox.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] text-[#6B7280]">{meta.label}</span>
                                                <span className={`w-1.5 h-1.5 rounded-full ${inbox.status === 'active' ? 'bg-green-400' : 'bg-gray-300'
                                                    }`} />
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-[#D1D5DB]" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                Main Content Panel (kanan)
            ═══════════════════════════════════════ */}
            <div className="flex-1 flex flex-col bg-[#F9FAFB]">
                <AnimatePresence mode="wait">
                    {setupStep === 'setup_whatsapp' ? (
                        <motion.div key="wa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                            <WhatsAppSetup onBack={handleSetupBack} onFinish={handleSetupFinish} />
                        </motion.div>
                    ) : setupStep === 'setup_webchat' ? (
                        <motion.div key="wc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                            <WebChatSetup onBack={handleSetupBack} onFinish={handleSetupFinish} />
                        </motion.div>
                    ) : setupStep === 'setup_instagram' ? (
                        <motion.div key="ig" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                            <OAuthConnect platform="instagram" onBack={handleSetupBack} onFinish={handleSetupFinish} />
                        </motion.div>
                    ) : setupStep === 'setup_messenger' ? (
                        <motion.div key="fb" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                            <OAuthConnect platform="messenger" onBack={handleSetupBack} onFinish={handleSetupFinish} />
                        </motion.div>
                    ) : selectedInbox ? (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                            <InboxSettings inbox={selectedInbox} />
                        </motion.div>
                    ) : (
                        /* Empty State — No Inbox Selected */
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center">
                            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-12 py-10 text-center max-w-md">
                                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-4 text-[#D1D5DB]">
                                    <rect x="4" y="8" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
                                    <path d="M4 18h48" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="10" cy="13" r="2" fill="currentColor" />
                                    <circle cx="16" cy="13" r="2" fill="currentColor" />
                                    <circle cx="22" cy="13" r="2" fill="currentColor" />
                                    <path d="M28 32l-4-4h8l-4 4z" fill="currentColor" opacity="0.4" />
                                </svg>
                                <h2 className="text-[17px] font-bold text-foreground mb-2">No Inbox Selected</h2>
                                <p className="text-[13px] text-[#9CA3AF]">Select an inbox from the list to view and manage its settings.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
