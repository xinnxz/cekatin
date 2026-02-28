'use client';

import { useState } from 'react';
import {
    Search, Plus, Filter, ArrowUpDown, Download, Edit, Trash2, Eye,
    Send, Users, BarChart3, Target, Mail, Calendar, Clock, CheckCircle2,
    TrendingUp, Megaphone, Zap, FileText, MousePointerClick,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Marketing Page — Persis cekat.ai/marketing
   
   Penjelasan arsitektur:
   ┌──────────────────────────────────────────────────────────┐
   │  Marketing                                               │
   │  Campaigns   Audience   Analytics                        │
   │  ──────────                                              │
   │                                                          │
   │  Campaigns Tab:                                          │
   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
   │  │Total │ │Active│ │Draft │ │Sent  │  ← 4 KPI cards     │
   │  │  5   │ │  2   │ │  1   │ │  2   │                    │
   │  └──────┘ └──────┘ └──────┘ └──────┘                    │
   │  [+ Create Campaign]                                     │
   │  ┌──────────────────────────────────────────────────────┐│
   │  │ Campaign │ Type │ Status │ Sent │ Opens │ Clicks│Date││
   │  └──────────────────────────────────────────────────────┘│
   │                                                          │
   │  Audience Tab:                                           │
   │  Segment management with audience groups                 │
   │                                                          │
   │  Analytics Tab:                                          │
   │  Marketing performance metrics                           │
   └──────────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════ */

// ── Sample Data ──
const campaigns = [
    { name: 'Promo Akhir Bulan', type: 'Broadcast', status: 'Sent', sent: 1250, opens: 890, clicks: 234, date: '28 Feb 2026' },
    { name: 'Welcome Series', type: 'Automated', status: 'Active', sent: 3400, opens: 2800, clicks: 560, date: '15 Feb 2026' },
    { name: 'Flash Sale Weekend', type: 'Broadcast', status: 'Sent', sent: 2100, opens: 1650, clicks: 412, date: '22 Feb 2026' },
    { name: 'Re-engagement Q1', type: 'Automated', status: 'Active', sent: 800, opens: 520, clicks: 98, date: '01 Feb 2026' },
    { name: 'New Product Launch', type: 'Broadcast', status: 'Draft', sent: 0, opens: 0, clicks: 0, date: '28 Feb 2026' },
];

const audiences = [
    { name: 'All Contacts', count: 5420, desc: 'Semua kontak yang terdaftar', type: 'Default' },
    { name: 'Active Customers', count: 1230, desc: 'Customer yang aktif dalam 30 hari terakhir', type: 'Dynamic' },
    { name: 'VIP Members', count: 245, desc: 'Member dengan total pembelian >Rp1jt', type: 'Dynamic' },
    { name: 'Newsletter Subscribers', count: 3800, desc: 'Subscriber newsletter via website', type: 'Static' },
    { name: 'Cart Abandoners', count: 412, desc: 'Customer yang meninggalkan keranjang belanja', type: 'Dynamic' },
];

export default function MarketingPage() {
    const [tab, setTab] = useState<'campaigns' | 'audience' | 'analytics'>('campaigns');

    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const draftCampaigns = campaigns.filter(c => c.status === 'Draft').length;
    const sentCampaigns = campaigns.filter(c => c.status === 'Sent').length;
    const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
    const totalOpens = campaigns.reduce((s, c) => s + c.opens, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);

    return (
        <div className="h-[calc(100vh-52px)] overflow-y-auto p-6 bg-[#F9FAFB]">
            {/* Header */}
            <h1 className="text-[22px] font-bold text-foreground mb-1">Marketing</h1>
            <p className="text-[13px] text-[#6B7280] mb-5">Manage campaigns, audiences, and track performance</p>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-[#E5E7EB] mb-6">
                {(['campaigns', 'audience', 'analytics'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-medium border-b-2 capitalize ${tab === t ? 'text-primary border-primary' : 'text-[#6B7280] border-transparent'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* ═══ CAMPAIGNS TAB ═══ */}
            {tab === 'campaigns' && (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-5">
                        {[
                            { label: 'Total Campaigns', value: campaigns.length, icon: Megaphone, color: '#4F46E5' },
                            { label: 'Active', value: activeCampaigns, icon: Zap, color: '#10B981' },
                            { label: 'Draft', value: draftCampaigns, icon: FileText, color: '#F59E0B' },
                            { label: 'Sent', value: sentCampaigns, icon: Send, color: '#8B5CF6' },
                        ].map((kpi, i) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                                            <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                        </div>
                                        <p className="text-[12px] text-[#6B7280]">{kpi.label}</p>
                                    </div>
                                    <p className="text-[22px] font-bold text-foreground">{kpi.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                            <input placeholder="Search campaigns..." className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                        <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                            <Plus className="w-3.5 h-3.5" /> Create Campaign
                        </button>
                    </div>

                    {/* Table */}
                    <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    {['Campaign', 'Type', 'Status', 'Sent', 'Opens', 'Clicks', 'Date', 'Action'].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-primary">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c, i) => (
                                    <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Megaphone className="w-4 h-4 text-primary" />
                                                <span className="text-[12.5px] font-medium text-foreground">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${c.type === 'Broadcast' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {c.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    c.status === 'Sent' ? 'bg-[#EEF2FF] text-primary' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>{c.status}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.sent.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.opens.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.clicks.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.date}</td>
                                        <td className="px-4 py-2.5 flex gap-1">
                                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Eye className="w-3 h-3 text-[#9CA3AF]" /></button>
                                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Edit className="w-3 h-3 text-[#9CA3AF]" /></button>
                                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-300" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ AUDIENCE TAB ═══ */}
            {tab === 'audience' && (
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <div className="relative w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                            <input placeholder="Search audience segments..." className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                        <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                            <Plus className="w-3.5 h-3.5" /> Create Segment
                        </button>
                    </div>
                    <div className="space-y-3">
                        {audiences.map((a, i) => (
                            <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 bg-white hover:shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-semibold text-foreground">{a.name}</h3>
                                            <p className="text-[11px] text-[#9CA3AF]">{a.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[15px] font-bold text-foreground">{a.count.toLocaleString()}</p>
                                            <span className={`px-2 py-0.5 text-[9px] font-medium rounded-full ${a.type === 'Default' ? 'bg-[#F3F4F6] text-[#6B7280]' :
                                                    a.type === 'Dynamic' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>{a.type}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ ANALYTICS TAB ═══ */}
            {tab === 'analytics' && (
                <div>
                    {/* Performance KPIs */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total Sent', value: totalSent.toLocaleString(), icon: Send, color: '#4F46E5' },
                            { label: 'Total Opens', value: totalOpens.toLocaleString(), sub: `${((totalOpens / totalSent) * 100).toFixed(1)}% open rate`, icon: Mail, color: '#10B981' },
                            { label: 'Total Clicks', value: totalClicks.toLocaleString(), sub: `${((totalClicks / totalSent) * 100).toFixed(1)}% click rate`, icon: MousePointerClick, color: '#F59E0B' },
                        ].map((kpi, i) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={i} className="border border-[#E5E7EB] rounded-xl p-5 bg-white">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                                            <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
                                        </div>
                                        <p className="text-[12px] text-[#6B7280]">{kpi.label}</p>
                                    </div>
                                    <p className="text-[26px] font-bold text-foreground">{kpi.value}</p>
                                    {kpi.sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{kpi.sub}</p>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Performance by Campaign */}
                    <div className="border border-[#E5E7EB] rounded-xl bg-white p-5">
                        <h2 className="text-[15px] font-bold text-foreground mb-4">Campaign Performance</h2>
                        <div className="space-y-3">
                            {campaigns.filter(c => c.sent > 0).map((c, i) => {
                                const openRate = ((c.opens / c.sent) * 100).toFixed(1);
                                const clickRate = ((c.clicks / c.sent) * 100).toFixed(1);
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 border border-[#F3F4F6] rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-[13px] font-medium text-foreground">{c.name}</p>
                                            <p className="text-[11px] text-[#9CA3AF]">{c.date}</p>
                                        </div>
                                        <div className="text-center px-3">
                                            <p className="text-[14px] font-bold text-foreground">{c.sent.toLocaleString()}</p>
                                            <p className="text-[10px] text-[#9CA3AF]">Sent</p>
                                        </div>
                                        <div className="text-center px-3">
                                            <p className="text-[14px] font-bold text-green-600">{openRate}%</p>
                                            <p className="text-[10px] text-[#9CA3AF]">Open Rate</p>
                                        </div>
                                        <div className="text-center px-3">
                                            <p className="text-[14px] font-bold text-primary">{clickRate}%</p>
                                            <p className="text-[10px] text-[#9CA3AF]">Click Rate</p>
                                        </div>
                                        {/* Mini progress bar */}
                                        <div className="w-24">
                                            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${openRate}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
