'use client';

import { useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Info, Plus, Minus, X, CreditCard, Zap } from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════
   Billings Page — Persis cekat.ai/billings (FULL FEATURES)
   
   Penjelasan fitur lengkap:
   
   1. 3 TABS: Chat | Marketing | CRM
      - Masing-masing tab punya gradient status cards, pricing plans,
        dan Recent Transactions table
   
   2. TOP UP MODALS:
      - Top Up MAU: Input jumlah MAU + instant price calculation
        (Rp150.000 per 1.000 MAU)
      - Top Up AI Responses: Input jumlah responses + price calculation
        (Rp200.000 per 5.000 responses)
      → Modal muncul saat klik tombol "Top Up MAU" / "Top Up Responses"
   
   3. BUY PACKAGE MODAL:
      - Konfirmasi pembelian paket
      - Menampilkan detail: nama paket, durasi, harga, diskon
      - Tombol "Confirm Purchase" + "Cancel"
      → Modal muncul saat klik "Buy Package" di pricing card
   
   4. DURATION SELECTOR:
      - Monthly (no discount)
      - 3 Months (5% discount)
      - Half Yearly (10% discount)
      - Yearly (20% discount)
      → Harga di semua pricing cards otomatis berubah
   
   5. CRM AGENT COUNTER:
      - +/- buttons untuk menambah agent
      - Rp300.000 per agent/month
      → Hanya muncul di tab CRM
   ═══════════════════════════════════════════════════════════════ */

type BillingTab = 'chat' | 'marketing' | 'crm';
type Duration = 'monthly' | '3months' | 'halfyearly' | 'yearly';
type ModalType = null | 'topup-mau' | 'topup-responses' | 'buy-package';

const formatIDR = (n: number) => `${n.toLocaleString('id-ID')}`;

const gradients = {
    blue: 'bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]',
    teal: 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6]',
    purple: 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
    green: 'bg-gradient-to-r from-[#059669] to-[#34D399]',
};

// ═══ TOP UP MAU MODAL ═══
// Penjelasan: Modal ini memungkinkan user menambah Monthly Active Users (MAU)
// Harga: Rp150.000 per 1.000 MAU (sesuai cekat.ai)
// User bisa input jumlah, dan total harga dihitung otomatis secara real-time
function TopUpMAUModal({ onClose }: { onClose: () => void }) {
    const [amount, setAmount] = useState(1000);
    const pricePerUnit = 150000; // Rp150.000 per 1.000 MAU
    const total = Math.ceil(amount / 1000) * pricePerUnit;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[440px] shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-teal-600" />
                        </div>
                        <h3 className="text-[16px] font-bold text-foreground">Top Up MAU</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                        <X className="w-4 h-4 text-[#9CA3AF]" />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-[12px] text-[#6B7280] mb-4">
                        Tambahkan Monthly Active Users (MAU) tambahan untuk akun Anda. MAU tambahan akan berlaku selama periode billing aktif.
                    </p>

                    <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4 mb-4">
                        <p className="text-[11px] font-semibold text-green-700 mb-1">Harga</p>
                        <p className="text-[14px] font-bold text-green-800">Rp 150.000 <span className="text-[11px] font-normal text-green-600">per 1.000 MAU</span></p>
                    </div>

                    <label className="text-[12px] font-medium text-foreground block mb-1.5">Jumlah MAU</label>
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setAmount(Math.max(1000, amount - 1000))}
                            className="w-10 h-10 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                            <Minus className="w-4 h-4 text-[#6B7280]" />
                        </button>
                        <input type="number" value={amount} onChange={e => setAmount(Math.max(1000, parseInt(e.target.value) || 0))}
                            className="flex-1 h-10 border border-[#E5E7EB] rounded-lg px-3 text-center text-[14px] font-medium focus:outline-none focus:border-primary" />
                        <button onClick={() => setAmount(amount + 1000)}
                            className="w-10 h-10 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                            <Plus className="w-4 h-4 text-[#6B7280]" />
                        </button>
                    </div>

                    <div className="bg-[#F9FAFB] rounded-xl p-4 mb-5">
                        <div className="flex items-center justify-between text-[12px] text-[#6B7280] mb-1">
                            <span>{formatIDR(amount)} MAU × Rp 150 / MAU</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-foreground">Total</span>
                            <span className="text-[18px] font-bold text-primary">Rp {formatIDR(total)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 text-[12px] font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            Cancel
                        </button>
                        <button className="flex-1 py-2.5 text-[12px] font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700">
                            Top Up MAU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ TOP UP AI RESPONSES MODAL ═══
// Penjelasan: Modal ini memungkinkan user menambah AI Responses
// Harga: Rp200.000 per 5.000 responses (sesuai cekat.ai)
// Responses bersifat PERMANENT (tidak reset bulanan)
function TopUpResponsesModal({ onClose }: { onClose: () => void }) {
    const [amount, setAmount] = useState(5000);
    const pricePerUnit = 200000; // Rp200.000 per 5.000 responses
    const total = Math.ceil(amount / 5000) * pricePerUnit;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[440px] shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-[16px] font-bold text-foreground">Top Up AI Responses</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                        <X className="w-4 h-4 text-[#9CA3AF]" />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-[12px] text-[#6B7280] mb-4">
                        Tambahkan AI Responses tambahan untuk akun Anda. AI Responses tambahan bersifat <strong>permanent</strong> dan tidak akan reset setiap bulan.
                    </p>

                    <div className="bg-[#F5F3FF] border border-purple-200 rounded-xl p-4 mb-4">
                        <p className="text-[11px] font-semibold text-purple-700 mb-1">Harga</p>
                        <p className="text-[14px] font-bold text-purple-800">Rp 200.000 <span className="text-[11px] font-normal text-purple-600">per 5.000 responses</span></p>
                        <p className="text-[10px] text-purple-500 mt-1">✨ Permanent — tidak reset bulanan</p>
                    </div>

                    <label className="text-[12px] font-medium text-foreground block mb-1.5">Jumlah AI Responses</label>
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setAmount(Math.max(5000, amount - 5000))}
                            className="w-10 h-10 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                            <Minus className="w-4 h-4 text-[#6B7280]" />
                        </button>
                        <input type="number" value={amount} onChange={e => setAmount(Math.max(5000, parseInt(e.target.value) || 0))}
                            className="flex-1 h-10 border border-[#E5E7EB] rounded-lg px-3 text-center text-[14px] font-medium focus:outline-none focus:border-primary" />
                        <button onClick={() => setAmount(amount + 5000)}
                            className="w-10 h-10 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                            <Plus className="w-4 h-4 text-[#6B7280]" />
                        </button>
                    </div>

                    <div className="bg-[#F9FAFB] rounded-xl p-4 mb-5">
                        <div className="flex items-center justify-between text-[12px] text-[#6B7280] mb-1">
                            <span>{formatIDR(amount)} responses × Rp 40 / response</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-foreground">Total</span>
                            <span className="text-[18px] font-bold text-purple-600">Rp {formatIDR(total)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 text-[12px] font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            Cancel
                        </button>
                        <button className="flex-1 py-2.5 text-[12px] font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                            Top Up Responses
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ BUY PACKAGE MODAL ═══
// Penjelasan: Modal konfirmasi pembelian paket
// Menampilkan ringkasan: nama paket, durasi, harga asli, diskon, total
function BuyPackageModal({ packageName, price, originalPrice, discount, duration, color, onClose }: {
    packageName: string; price: number; originalPrice: number; discount: string; duration: string; color: string; onClose: () => void;
}) {
    const savingsAmount = originalPrice - price;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[480px] shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
                    <h3 className="text-[16px] font-bold text-foreground">Konfirmasi Pembelian</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                        <X className="w-4 h-4 text-[#9CA3AF]" />
                    </button>
                </div>

                <div className="p-5">
                    {/* Package Summary */}
                    <div className="rounded-xl p-4 mb-5 text-white" style={{ backgroundColor: color }}>
                        <p className="text-[11px] opacity-80 mb-1">Paket yang dipilih</p>
                        <h4 className="text-[20px] font-bold">{packageName}</h4>
                        <p className="text-[12px] opacity-80 mt-1">{duration}</p>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 mb-5">
                        <div className="flex justify-between text-[12px]">
                            <span className="text-[#6B7280]">Harga asli</span>
                            <span className="text-[#9CA3AF] line-through">Rp {formatIDR(originalPrice)}/mo</span>
                        </div>
                        {discount && (
                            <div className="flex justify-between text-[12px]">
                                <span className="text-[#6B7280]">Diskon ({discount})</span>
                                <span className="text-green-600 font-medium">-Rp {formatIDR(savingsAmount)}/mo</span>
                            </div>
                        )}
                        <div className="border-t border-[#E5E7EB] pt-2 flex justify-between">
                            <span className="text-[13px] font-bold text-foreground">Harga per bulan</span>
                            <span className="text-[16px] font-bold text-foreground">Rp {formatIDR(price)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-[#F9FAFB] rounded-xl p-4 mb-5">
                        <p className="text-[11px] font-semibold text-foreground mb-2">Metode Pembayaran</p>
                        <div className="space-y-2">
                            {['Bank Transfer (VA)', 'E-Wallet (OVO, GoPay, DANA)', 'Credit Card', 'QRIS'].map((m, i) => (
                                <label key={i} className="flex items-center gap-2 text-[12px] text-[#374151] cursor-pointer">
                                    <input type="radio" name="payment" defaultChecked={i === 0}
                                        className="w-3.5 h-3.5 text-primary accent-primary" />
                                    {m}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 text-[12px] font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            Cancel
                        </button>
                        <button className="flex-1 py-2.5 text-[12px] font-bold text-white rounded-lg"
                            style={{ backgroundColor: color }}>
                            Confirm Purchase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ DURATION SELECTOR ═══
function DurationSelector({ active, onChange }: { active: Duration; onChange: (d: Duration) => void }) {
    const items: { key: Duration; label: string; badge?: string }[] = [
        { key: 'monthly', label: 'Monthly' },
        { key: '3months', label: '3 Months', badge: '5% Discount' },
        { key: 'halfyearly', label: 'Half Yearly', badge: '10% Discount' },
        { key: 'yearly', label: 'Yearly', badge: '20% Discount' },
    ];
    return (
        <div className="flex items-center justify-center gap-0.5 mb-8">
            {items.map(item => (
                <button key={item.key} onClick={() => onChange(item.key)}
                    className={`relative px-5 py-2 text-[12px] font-medium rounded-full transition-all ${active === item.key ? 'bg-primary text-white shadow-md' : 'text-[#6B7280] hover:text-foreground'
                        }`}>
                    {item.badge && active === item.key && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] font-bold text-white bg-green-500 rounded-full whitespace-nowrap">
                            {item.badge}
                        </span>
                    )}
                    {item.label}
                </button>
            ))}
        </div>
    );
}

// ═══ GRADIENT STATUS CARD ═══
function GradientCard({ gradient, label, value, sub, badge, buttonLabel, onButtonClick }: {
    gradient: string; label: string; value: string; sub?: string; badge?: string;
    buttonLabel?: string; onButtonClick?: () => void;
}) {
    return (
        <div className={`${gradient} rounded-xl p-5 text-white flex flex-col justify-between min-h-[130px]`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium opacity-80">{label}</p>
                {badge && <span className="px-2 py-0.5 text-[9px] font-semibold bg-white/20 rounded-full">{badge}</span>}
            </div>
            <div>
                <h3 className="text-[22px] font-bold leading-tight">{value}</h3>
                {sub && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] opacity-70">
                        <Info className="w-3 h-3" /> {sub}
                    </div>
                )}
                {buttonLabel && (
                    <button onClick={onButtonClick}
                        className="mt-2 px-3 py-1 text-[10px] font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                        {buttonLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══ PRICING CARD ═══
// Penjelasan Detail:
// Di cekat.ai, setiap pricing card menunjukkan:
// 1. Harga per bulan (setelah diskon)
// 2. Harga asli (coret) + badge "Save X%"  
// 3. "Duration discount: Rp X" ← TOTAL savings untuk seluruh periode
// 4. "Total: Rp X" ← TOTAL biaya untuk seluruh periode (hijau)
// 5. Label durasi (Monthly/Quarterly/Half-Yearly/Yearly Package)
// 6. Feature checklist
// 7. Additional Agents counter (hanya CRM)
function PricingCard({ name, price, originalPrice, discount, duration, durationMonths, features, color, agentCounter, onBuy }: {
    name: string; price: number; originalPrice?: number; discount?: string; duration: string;
    durationMonths: number; features: string[]; color: string; agentCounter?: boolean; onBuy: () => void;
}) {
    const [agents, setAgents] = useState(0);
    // Total discount = (originalPrice - discountedPrice) × jumlah bulan
    const discountPerMonth = originalPrice ? originalPrice - price : 0;
    const totalDiscount = discountPerMonth * durationMonths;
    // Total harga = harga diskon × jumlah bulan
    const totalPrice = price * durationMonths;

    return (
        <div className="border border-[#E5E7EB] rounded-xl bg-white flex flex-col">
            <div className="p-5 flex-1">
                <h3 className="text-[16px] font-bold text-foreground mb-4">{name}</h3>
                <div className="mb-1">
                    <span className="text-[22px] font-bold text-foreground">{formatIDR(price)}</span>
                    <span className="text-[13px] text-[#6B7280] ml-1">IDR / mo</span>
                </div>
                {originalPrice && (
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] text-[#9CA3AF] line-through">{formatIDR(originalPrice)} IDR / mo</span>
                        {discount && <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-green-500 rounded">Save {discount}</span>}
                    </div>
                )}
                {/* Duration discount — menampilkan total penghematan */}
                {totalDiscount > 0 && (
                    <p className="text-[11px] text-[#6B7280]">Duration discount: Rp {formatIDR(totalDiscount)}</p>
                )}
                {/* Total — menampilkan total biaya (warna hijau) */}
                <p className="text-[11px] text-green-600 font-semibold">Total: Rp {formatIDR(totalPrice)}</p>
                <p className="text-[11px] text-primary mb-4">{duration}</p>

                {agentCounter && (
                    <div className="bg-primary/5 rounded-lg p-3 mb-4">
                        <p className="text-[11px] font-semibold text-foreground mb-2 text-center">Additional Agents</p>
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setAgents(Math.max(0, agents - 1))}
                                className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-16 h-8 border border-[#E5E7EB] rounded-lg flex items-center justify-center text-[13px] font-medium bg-white">
                                {agents}
                            </div>
                            <span className="text-[11px] text-[#6B7280]">agents</span>
                            <button onClick={() => setAgents(agents + 1)}
                                className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-primary text-center mt-1.5">Rp 300.000 per agent/month</p>
                    </div>
                )}

                <p className="text-[12px] font-bold text-foreground mb-2">{name} Features</p>
                <ul className="space-y-1.5">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-[#374151]">
                            <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-5 pt-0">
                <button onClick={onBuy} className="w-full py-2.5 text-[12px] font-bold text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: color }}>
                    Buy Package
                </button>
            </div>
        </div>
    );
}

// ═══ TRANSACTIONS TABLE ═══
function TransactionsTable() {
    return (
        <div className="mt-8">
            <h2 className="text-[15px] font-bold text-foreground text-center mb-4">Recent Transactions</h2>
            <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['PACKAGE', 'DURATION', 'STATUS', 'TRANSACTION DATE', 'ACTION'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#6B7280] uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[#9CA3AF]">
                                No transactions found
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
                    <button className="flex items-center gap-1 text-[12px] text-[#9CA3AF]"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <span className="text-[12px] text-[#6B7280]">Page 1 of 1</span>
                    <button className="flex items-center gap-1 text-[12px] text-[#9CA3AF]"><ChevronRight className="w-3.5 h-3.5" /></button>
                    <span className="text-[12px] text-[#6B7280]">Total: 0</span>
                </div>
            </div>
        </div>
    );
}

// ═══ MAIN PAGE ═══
export default function BillingsPage() {
    const [tab, setTab] = useState<BillingTab>('chat');
    const [duration, setDuration] = useState<Duration>('3months');
    const [modal, setModal] = useState<ModalType>(null);
    const [buyPkg, setBuyPkg] = useState<{ name: string; price: number; orig: number; disc: string; dur: string; color: string } | null>(null);

    const discountMap: Record<Duration, { mult: number; label: string; pct: string; months: number }> = {
        monthly: { mult: 1, label: 'Monthly Package', pct: '', months: 1 },
        '3months': { mult: 0.95, label: 'Quarterly Package', pct: '5%', months: 3 },
        halfyearly: { mult: 0.90, label: 'Half-Yearly Package', pct: '10%', months: 6 },
        yearly: { mult: 0.80, label: 'Yearly Package', pct: '20%', months: 12 },
    };
    const d = discountMap[duration];

    const handleBuy = (name: string, origPrice: number, color: string) => {
        setBuyPkg({
            name,
            price: Math.round(origPrice * d.mult),
            orig: origPrice,
            disc: d.pct,
            dur: d.label,
            color,
        });
    };

    const tabs: { key: BillingTab; label: string; icon: string }[] = [
        { key: 'chat', label: 'Chat', icon: '💬' },
        { key: 'marketing', label: 'Marketing', icon: '📣' },
        { key: 'crm', label: 'CRM', icon: '👥' },
    ];

    return (
        <div className="min-h-[calc(100vh-52px)] overflow-y-auto bg-[#F5F7FA]">
            {/* Modals */}
            {modal === 'topup-mau' && <TopUpMAUModal onClose={() => setModal(null)} />}
            {modal === 'topup-responses' && <TopUpResponsesModal onClose={() => setModal(null)} />}
            {buyPkg && (
                <BuyPackageModal
                    packageName={buyPkg.name} price={buyPkg.price} originalPrice={buyPkg.orig}
                    discount={buyPkg.disc} duration={buyPkg.dur} color={buyPkg.color}
                    onClose={() => setBuyPkg(null)}
                />
            )}

            {/* Back button */}
            <div className="px-6 pt-4">
                <Link href="/dashboard" className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center justify-center gap-1 mt-4 mb-6">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-5 py-2 text-[13px] font-medium rounded-full transition-all ${tab === t.key ? 'bg-primary text-white shadow-md' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                            }`}>
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="px-6 pb-8 max-w-[1200px] mx-auto">
                {/* ═══ CHAT TAB ═══ */}
                {tab === 'chat' && (
                    <>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <GradientCard gradient={gradients.blue} label="Package Details" value="FREE Plan" sub="Expires on March 29, 2026" />
                            <GradientCard gradient={gradients.teal} label="Monthly Active Users (Limit Percakapan)" value="0" badge="20 MAU"
                                sub="Additional MAU: 0" buttonLabel="Top Up MAU" onButtonClick={() => setModal('topup-mau')} />
                            <GradientCard gradient={gradients.purple} label="AI Responses" value="0 Used" badge="100 AI Responses Limit"
                                sub="Reset Setiap Tanggal 1" />
                            <GradientCard gradient={gradients.green} label="Additional AI Responses" value="0 Responses"
                                sub="AI Responses Permanent" buttonLabel="Top Up Responses" onButtonClick={() => setModal('topup-responses')} />
                        </div>

                        <DurationSelector active={duration} onChange={setDuration} />

                        <div className="grid grid-cols-4 gap-4">
                            <PricingCard name="Pro" price={Math.round(1499000 * d.mult)} originalPrice={1499000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#1E3A8A"
                                onBuy={() => handleBuy('Pro', 1499000, '#1E3A8A')}
                                features={['3,000 Monthly Active Users', '5 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '15,000 AI Responses', 'Advanced AI Models']} />
                            <PricingCard name="Business" price={Math.round(3799000 * d.mult)} originalPrice={3799000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#0D9488"
                                onBuy={() => handleBuy('Business', 3799000, '#0D9488')}
                                features={['10,000 Monthly Active Users', '7 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '50,000 AI Responses', 'Advanced AI Models']} />
                            <PricingCard name="Enterprise" price={Math.round(5799000 * d.mult)} originalPrice={5799000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#7C3AED"
                                onBuy={() => handleBuy('Enterprise', 5799000, '#7C3AED')}
                                features={['30,000 Monthly Active Users', '10 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '150,000 AI Responses', 'Advanced AI Models']} />
                            <PricingCard name="Unlimited" price={Math.round(15799000 * d.mult)} originalPrice={15799000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#059669"
                                onBuy={() => handleBuy('Unlimited', 15799000, '#059669')}
                                features={['Unlimited Monthly Active Users', '30 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '500,000 AI Responses', 'Advanced AI Models']} />
                        </div>

                        <TransactionsTable />
                    </>
                )}

                {/* ═══ MARKETING TAB ═══ */}
                {tab === 'marketing' && (
                    <>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <GradientCard gradient={gradients.blue} label="Marketing Package Details" value="No Package" sub="Expires on -" />
                            <GradientCard gradient={gradients.purple} label="Remaining Days" value="0 Days" />
                            <GradientCard gradient={gradients.green} label="Track Limit" value="0" />
                        </div>

                        <DurationSelector active={duration} onChange={setDuration} />

                        <div className="grid grid-cols-3 gap-4">
                            <PricingCard name="Marketing Pro" price={Math.round(2000000 * d.mult)} originalPrice={2000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#1E3A8A"
                                onBuy={() => handleBuy('Marketing Pro', 2000000, '#1E3A8A')}
                                features={['Track up to 3,000 leads per month', 'Automatic Ad Attribution', 'Automatic META CAPI Integration', 'Website Customer Journey', 'Ads Performance Analytics Dashboard', 'Google, Tiktok, and other Ad platforms Coming Soon']} />
                            <PricingCard name="Marketing Business" price={Math.round(4000000 * d.mult)} originalPrice={4000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#7C3AED"
                                onBuy={() => handleBuy('Marketing Business', 4000000, '#7C3AED')}
                                features={['Track up to 10,000 leads per month', 'Automatic Ad Attribution', 'Automatic META CAPI Integration', 'Website Customer Journey', 'Ads Performance Analytics Dashboard', 'Google, Tiktok, and other Ad platforms Coming Soon']} />
                            <PricingCard name="Marketing Enterprise" price={Math.round(5000000 * d.mult)} originalPrice={5000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#059669"
                                onBuy={() => handleBuy('Marketing Enterprise', 5000000, '#059669')}
                                features={['Track up to 30,000 leads per month', 'Automatic Ad Attribution', 'Automatic META CAPI Integration', 'Website Customer Journey', 'Ads Performance Analytics Dashboard', 'Google, Tiktok, and other Ad platforms Coming Soon']} />
                        </div>

                        <TransactionsTable />
                    </>
                )}

                {/* ═══ CRM TAB ═══ */}
                {tab === 'crm' && (
                    <>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <GradientCard gradient={gradients.blue} label="CRM Package Details" value="No CRM Package" sub="Expires on -" />
                            <GradientCard gradient={gradients.teal} label="CRM Agents" value="-" />
                            <GradientCard gradient={gradients.purple} label="CRM Item Limit" value="-" />
                            <GradientCard gradient={gradients.green} label="Additional CRM Agents" value="-" buttonLabel="Package Expired" />
                        </div>

                        <DurationSelector active={duration} onChange={setDuration} />

                        <div className="grid grid-cols-4 gap-4">
                            <PricingCard name="CRM Pro" price={Math.round(1000000 * d.mult)} originalPrice={1000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#1E3A8A" agentCounter
                                onBuy={() => handleBuy('CRM Pro', 1000000, '#1E3A8A')}
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Up to 10,000 Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                            <PricingCard name="CRM Business" price={Math.round(2000000 * d.mult)} originalPrice={2000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#0D9488" agentCounter
                                onBuy={() => handleBuy('CRM Business', 2000000, '#0D9488')}
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Up to 50,000 Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                            <PricingCard name="CRM Enterprise" price={Math.round(3000000 * d.mult)} originalPrice={3000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#7C3AED" agentCounter
                                onBuy={() => handleBuy('CRM Enterprise', 3000000, '#7C3AED')}
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Up to 100,000 Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                            <PricingCard name="CRM Unlimited" price={Math.round(5000000 * d.mult)} originalPrice={5000000}
                                discount={d.pct} duration={d.label} durationMonths={d.months} color="#059669" agentCounter
                                onBuy={() => handleBuy('CRM Unlimited', 5000000, '#059669')}
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Unlimited Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                        </div>

                        <TransactionsTable />
                    </>
                )}
            </div>
        </div>
    );
}
