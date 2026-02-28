'use client';

import { useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Info, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════
   Billings Page — Persis cekat.ai/billings
   
   Penjelasan arsitektur:
   ┌──────────────────────────────────────────────────────────┐
   │  ← Back                                                  │
   │                                                          │
   │          [💬 Chat]  [📣 Marketing]  [👥 CRM]            │
   │                                                          │
   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
   │  │gradient│ │gradient│ │gradient│ │gradient│  ← Status  │
   │  │ card 1 │ │ card 2 │ │ card 3 │ │ card 4 │    cards   │
   │  └────────┘ └────────┘ └────────┘ └────────┘           │
   │                                                          │
   │  [Monthly] [3 Months★] [Half Yearly] [Yearly]          │
   │                                                          │
   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
   │  │ Pro  │ │Busi. │ │Enter.│ │Unlim.│  ← Pricing plans  │
   │  │price │ │price │ │price │ │price │                    │
   │  │feats │ │feats │ │feats │ │feats │                    │
   │  │[Buy] │ │[Buy] │ │[Buy] │ │[Buy] │                    │
   │  └──────┘ └──────┘ └──────┘ └──────┘                    │
   │                                                          │
   │  Recent Transactions                                     │
   │  ┌──────────────────────────────────────────────────────┐│
   │  │ PACKAGE │ DURATION │ STATUS │ DATE │ ACTION          ││
   │  └──────────────────────────────────────────────────────┘│
   └──────────────────────────────────────────────────────────┘
   
   Tab Chat: 4 gradient cards + 4 pricing plans (Pro/Business/Enterprise/Unlimited)
   Tab Marketing: 3 gradient cards + 3 pricing plans (Pro/Business/Enterprise)
   Tab CRM: 4 gradient cards + 4 pricing plans + Additional Agents counter
   ═══════════════════════════════════════════════════════════════ */

type BillingTab = 'chat' | 'marketing' | 'crm';
type Duration = 'monthly' | '3months' | 'halfyearly' | 'yearly';

// ── Gradient Presets ──
const gradients = {
    blue: 'bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]',
    teal: 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6]',
    purple: 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
    green: 'bg-gradient-to-r from-[#059669] to-[#34D399]',
};

const formatIDR = (n: number) => `${n.toLocaleString('id-ID')}`;

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
                    className={`relative px-5 py-2 text-[12px] font-medium rounded-full transition-all ${active === item.key
                            ? 'bg-primary text-white shadow-md'
                            : 'text-[#6B7280] hover:text-foreground'
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
function GradientCard({ gradient, label, value, sub, badge, buttonLabel }: {
    gradient: string; label: string; value: string; sub?: string; badge?: string; buttonLabel?: string;
}) {
    return (
        <div className={`${gradient} rounded-xl p-5 text-white flex flex-col justify-between min-h-[130px]`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium opacity-80">{label}</p>
                {badge && (
                    <span className="px-2 py-0.5 text-[9px] font-semibold bg-white/20 rounded-full">{badge}</span>
                )}
            </div>
            <div>
                <h3 className="text-[22px] font-bold leading-tight">{value}</h3>
                {sub && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] opacity-70">
                        <Info className="w-3 h-3" /> {sub}
                    </div>
                )}
                {buttonLabel && (
                    <button className="mt-2 px-3 py-1 text-[10px] font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                        {buttonLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══ PRICING CARD ═══
function PricingCard({ name, price, originalPrice, discount, duration, features, color, agentCounter }: {
    name: string; price: number; originalPrice?: number; discount?: string; duration: string;
    features: string[]; color: string; agentCounter?: boolean;
}) {
    const [agents, setAgents] = useState(0);
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
                        <span className="text-[11px] text-[#9CA3AF] line-through">{formatIDR(originalPrice)} IDR</span>
                        {discount && <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded">Save {discount}</span>}
                    </div>
                )}
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
                <button className="w-full py-2.5 text-[12px] font-bold text-white rounded-lg transition-colors"
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
                    <button className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[12px] text-[#6B7280]">Page 1 of 1</span>
                    <button className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
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

    // ── Discount multiplier ──
    const discountMap: Record<Duration, { mult: number; label: string; pct: string }> = {
        monthly: { mult: 1, label: 'Monthly Package', pct: '' },
        '3months': { mult: 0.95, label: 'Quarterly Package', pct: '5%' },
        halfyearly: { mult: 0.90, label: 'Half-Yearly Package', pct: '10%' },
        yearly: { mult: 0.80, label: 'Yearly Package', pct: '20%' },
    };
    const d = discountMap[duration];

    // ── Tabs config ──
    const tabs: { key: BillingTab; label: string; icon: string }[] = [
        { key: 'chat', label: 'Chat', icon: '💬' },
        { key: 'marketing', label: 'Marketing', icon: '📣' },
        { key: 'crm', label: 'CRM', icon: '👥' },
    ];

    return (
        <div className="min-h-[calc(100vh-52px)] overflow-y-auto bg-[#F5F7FA]">
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
                        className={`flex items-center gap-1.5 px-5 py-2 text-[13px] font-medium rounded-full transition-all ${tab === t.key
                                ? 'bg-primary text-white shadow-md'
                                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                            }`}>
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="px-6 pb-8 max-w-[1200px] mx-auto">
                {/* ═══════════ CHAT TAB ═══════════ */}
                {tab === 'chat' && (
                    <>
                        {/* Status Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <GradientCard gradient={gradients.blue} label="Package Details" value="FREE Plan" sub="Expires on March 29, 2026" />
                            <GradientCard gradient={gradients.teal} label="Monthly Active Users (Limit Percakapan)" value="0" badge="20 MAU"
                                sub="Additional MAU: 0" buttonLabel="Top Up MAU" />
                            <GradientCard gradient={gradients.purple} label="AI Responses" value="0 Used" badge="100 AI Responses Limit"
                                sub="Reset Setiap Tanggal 1" />
                            <GradientCard gradient={gradients.green} label="Additional AI Responses" value="0 Responses"
                                sub="AI Responses Permanent" buttonLabel="Top Up Responses" />
                        </div>

                        <DurationSelector active={duration} onChange={setDuration} />

                        {/* Pricing Plans */}
                        <div className="grid grid-cols-4 gap-4">
                            <PricingCard name="Pro" price={Math.round(1499000 * d.mult)} originalPrice={1499000}
                                discount={d.pct} duration={d.label} color="#1E3A8A"
                                features={['3,000 Monthly Active Users', '5 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '15,000 AI Responses', 'Advanced AI Models']} />
                            <PricingCard name="Business" price={Math.round(3799000 * d.mult)} originalPrice={3799000}
                                discount={d.pct} duration={d.label} color="#0D9488"
                                features={['10,000 Monthly Active Users', '7 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '50,000 AI Responses', 'Advanced AI Models']} />
                            <PricingCard name="Enterprise" price={Math.round(5799000 * d.mult)} originalPrice={5799000}
                                discount={d.pct} duration={d.label} color="#7C3AED"
                                features={['30,000 Monthly Active Users', '10 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '150,000 AI Responses', 'Advanced AI Models']} />
                            <PricingCard name="Unlimited" price={Math.round(15799000 * d.mult)} originalPrice={15799000}
                                discount={d.pct} duration={d.label} color="#059669"
                                features={['Unlimited Monthly Active Users', '30 Human Agents', 'Unlimited AI Agents', 'Unlimited Connected Platforms', '500,000 AI Responses', 'Advanced AI Models']} />
                        </div>

                        <TransactionsTable />
                    </>
                )}

                {/* ═══════════ MARKETING TAB ═══════════ */}
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
                                discount={d.pct} duration={d.label} color="#1E3A8A"
                                features={['Track up to 3,000 leads per month', 'Automatic Ad Attribution', 'Automatic META CAPI Integration', 'Website Customer Journey', 'Ads Performance Analytics Dashboard', 'Google, Tiktok, and other Ad platforms Coming Soon']} />
                            <PricingCard name="Marketing Business" price={Math.round(4000000 * d.mult)} originalPrice={4000000}
                                discount={d.pct} duration={d.label} color="#7C3AED"
                                features={['Track up to 10,000 leads per month', 'Automatic Ad Attribution', 'Automatic META CAPI Integration', 'Website Customer Journey', 'Ads Performance Analytics Dashboard', 'Google, Tiktok, and other Ad platforms Coming Soon']} />
                            <PricingCard name="Marketing Enterprise" price={Math.round(5000000 * d.mult)} originalPrice={5000000}
                                discount={d.pct} duration={d.label} color="#059669"
                                features={['Track up to 30,000 leads per month', 'Automatic Ad Attribution', 'Automatic META CAPI Integration', 'Website Customer Journey', 'Ads Performance Analytics Dashboard', 'Google, Tiktok, and other Ad platforms Coming Soon']} />
                        </div>

                        <TransactionsTable />
                    </>
                )}

                {/* ═══════════ CRM TAB ═══════════ */}
                {tab === 'crm' && (
                    <>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <GradientCard gradient={gradients.blue} label="CRM Package Details" value="No CRM Package" sub="Expires on -" />
                            <GradientCard gradient={gradients.teal} label="CRM Agents" value="-" />
                            <GradientCard gradient={gradients.purple} label="CRM Item Limit" value="-" />
                            <GradientCard gradient={gradients.green} label="Additional CRM Agents" value="-"
                                buttonLabel="Package Expired" />
                        </div>

                        <DurationSelector active={duration} onChange={setDuration} />

                        <div className="grid grid-cols-4 gap-4">
                            <PricingCard name="CRM Pro" price={Math.round(1000000 * d.mult)} originalPrice={1000000}
                                discount={d.pct} duration={d.label} color="#1E3A8A" agentCounter
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Up to 10,000 Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                            <PricingCard name="CRM Business" price={Math.round(2000000 * d.mult)} originalPrice={2000000}
                                discount={d.pct} duration={d.label} color="#0D9488" agentCounter
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Up to 50,000 Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                            <PricingCard name="CRM Enterprise" price={Math.round(3000000 * d.mult)} originalPrice={3000000}
                                discount={d.pct} duration={d.label} color="#7C3AED" agentCounter
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Up to 100,000 Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                            <PricingCard name="CRM Unlimited" price={Math.round(5000000 * d.mult)} originalPrice={5000000}
                                discount={d.pct} duration={d.label} color="#059669" agentCounter
                                features={['CRM Contacts and Company List', 'Unified Customer Data Platform', 'Unlimited Boards', 'Unlimited Views', 'Unlimited Items per Board', 'Up to 3 Agents (can be upgraded)', 'CRM Automations', 'CRM OpenAPI']} />
                        </div>

                        <TransactionsTable />
                    </>
                )}
            </div>
        </div>
    );
}
