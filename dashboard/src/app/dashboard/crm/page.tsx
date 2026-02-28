'use client';

import { useState } from 'react';
import {
    Search, Plus, Download, Upload, Filter, Edit, Trash2, Users, Building2,
    LayoutDashboard, Tag, ChevronRight, MoreHorizontal, User, Mail, Phone,
    Calendar, ArrowUpDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CRM Page — Persis cekat.ai/crm
   
   Penjelasan arsitektur:
   ┌──────────────────────────────────────────────────────────┐
   │ [📋] [👤] [🏢]  ← icon sidebar (Boards/Contacts/Comp)  │
   │                                                          │
   │  Contacts                                                │
   │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       │
   │ │Total│ │Lead │ │Opp. │ │Cust.│  ← 4 KPI summary cards │
   │ │ 15  │ │  5  │ │  4  │ │  6  │                        │
   │ └─────┘ └─────┘ └─────┘ └─────┘                        │
   │                                                          │
   │ [Bulk Import] [Export] [+ Add Contact]                   │
   │ ┌──────────────────────────────────────────────────────┐ │
   │ │ Name │ Boards │ Label │ Channel │ Tags │ Owner │Date│ │
   │ │ ...  │ ...    │ ...   │ ...     │ ...  │ ...   │...│ │
   │ └──────────────────────────────────────────────────────┘ │
   └──────────────────────────────────────────────────────────┘
   
   Sidebar icon kiri: Boards, Contacts, Companies
   ═══════════════════════════════════════════════════════════════ */

type CRMView = 'boards' | 'contacts' | 'companies';

// ── Sample Data ──
const contacts = [
    { name: 'Andi Pratama', board: 'Sales Pipeline', label: 'Hot Lead', channel: 'WhatsApp', tags: ['VIP'], owner: 'Luthfi', date: '28 Feb 2026', type: 'Lead' },
    { name: 'Budi Santoso', board: 'Support', label: 'Active', channel: 'WebChat', tags: ['Returning'], owner: 'Dina', date: '27 Feb 2026', type: 'Customer' },
    { name: 'Citra Dewi', board: 'Sales Pipeline', label: 'Qualified', channel: 'Instagram', tags: ['B2B'], owner: 'Luthfi', date: '27 Feb 2026', type: 'Opportunity' },
    { name: 'Diana Putri', board: 'Sales Pipeline', label: 'New', channel: 'WhatsApp', tags: [], owner: 'Admin', date: '26 Feb 2026', type: 'Lead' },
    { name: 'Eko Wijaya', board: 'Support', label: 'Resolved', channel: 'Shopee', tags: ['Premium'], owner: 'Dina', date: '26 Feb 2026', type: 'Customer' },
    { name: 'Fani Rahma', board: 'Sales Pipeline', label: 'Negotiation', channel: 'WhatsApp', tags: ['Enterprise'], owner: 'Luthfi', date: '25 Feb 2026', type: 'Opportunity' },
    { name: 'Galih Prasetya', board: 'Support', label: 'Active', channel: 'Email', tags: [], owner: 'Admin', date: '24 Feb 2026', type: 'Customer' },
];

const companies = [
    { name: 'PT Maju Jaya', channel: 'WhatsApp', tags: ['Enterprise', 'B2B'], date: '28 Feb 2026' },
    { name: 'CV Berkah Mandiri', channel: 'Email', tags: ['SME'], date: '25 Feb 2026' },
    { name: 'Toko Sejahtera', channel: 'WebChat', tags: ['Retail'], date: '22 Feb 2026' },
];

// ═══ SIDEBAR ═══
function CRMSidebar({ active, onChange }: { active: CRMView; onChange: (v: CRMView) => void }) {
    const items: { key: CRMView; icon: React.ElementType; label: string }[] = [
        { key: 'boards', icon: LayoutDashboard, label: 'Boards' },
        { key: 'contacts', icon: Users, label: 'Contacts' },
        { key: 'companies', icon: Building2, label: 'Companies' },
    ];
    return (
        <div className="w-[52px] bg-white border-r border-[#E5E7EB] flex flex-col items-center py-4 gap-2 flex-shrink-0">
            {items.map(item => {
                const Icon = item.icon;
                return (
                    <button key={item.key} onClick={() => onChange(item.key)} title={item.label}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${active === item.key ? 'bg-primary/10 text-primary' : 'text-[#9CA3AF] hover:text-foreground hover:bg-[#F3F4F6]'}`}>
                        <Icon className="w-[18px] h-[18px]" />
                    </button>
                );
            })}
        </div>
    );
}

// ═══ BOARDS VIEW ═══
function BoardsView() {
    const boards = [
        { name: 'Sales Pipeline', stages: 5, contacts: 12, color: '#4F46E5' },
        { name: 'Support', stages: 3, contacts: 8, color: '#10B981' },
    ];
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-[20px] font-bold text-foreground">Boards</h1>
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Create Board
                </button>
            </div>
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input placeholder="Search boards..." className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-3">
                {boards.map((b, i) => (
                    <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 bg-white hover:shadow-sm cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-8 rounded-full" style={{ backgroundColor: b.color }} />
                            <div className="flex-1">
                                <h3 className="text-[14px] font-semibold text-foreground">{b.name}</h3>
                                <p className="text-[11px] text-[#9CA3AF]">{b.stages} stages · {b.contacts} contacts</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#9CA3AF]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══ CONTACTS VIEW ═══
function ContactsView() {
    const leads = contacts.filter(c => c.type === 'Lead').length;
    const opportunities = contacts.filter(c => c.type === 'Opportunity').length;
    const customers = contacts.filter(c => c.type === 'Customer').length;

    return (
        <div>
            <h1 className="text-[20px] font-bold text-foreground mb-5">Contacts</h1>

            {/* KPI Summary */}
            <div className="grid grid-cols-4 gap-4 mb-5">
                {[
                    { label: 'Total Contacts', value: contacts.length, color: '#4F46E5' },
                    { label: 'Lead', value: leads, color: '#F59E0B' },
                    { label: 'Opportunity', value: opportunities, color: '#8B5CF6' },
                    { label: 'Customer', value: customers, color: '#10B981' },
                ].map((kpi, i) => (
                    <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
                        <p className="text-[11px] text-[#6B7280] mb-1">{kpi.label}</p>
                        <p className="text-[22px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative w-[260px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                    <input placeholder="Search contacts..." className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                        <Upload className="w-3.5 h-3.5" /> Bulk Import
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                        <Plus className="w-3.5 h-3.5" /> Add Contact
                    </button>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['Name', 'Boards', 'Label', 'Active Channel', 'Tags', 'Owner', 'Created Date'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-primary">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((c, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer">
                                <td className="px-4 py-2.5 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <span className="text-[12.5px] font-medium text-foreground">{c.name}</span>
                                </td>
                                <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.board}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${c.label === 'Hot Lead' ? 'bg-red-100 text-red-700' :
                                            c.label === 'Active' ? 'bg-green-100 text-green-700' :
                                                c.label === 'Qualified' ? 'bg-blue-100 text-blue-700' :
                                                    c.label === 'New' ? 'bg-purple-100 text-purple-700' :
                                                        c.label === 'Negotiation' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-[#F3F4F6] text-[#6B7280]'
                                        }`}>{c.label}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[#EEF2FF] text-primary rounded-full">{c.channel}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex gap-1">
                                        {c.tags.map((t, j) => (
                                            <span key={j} className="px-1.5 py-0.5 text-[9px] bg-[#F3F4F6] text-[#6B7280] rounded">{t}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.owner}</td>
                                <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{c.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ═══ COMPANIES VIEW ═══
function CompaniesView() {
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-[20px] font-bold text-foreground">Companies</h1>
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Company
                </button>
            </div>
            <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['Name', 'Active Channel', 'Tags', 'Created Date'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-primary">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((c, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                <td className="px-4 py-3 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-[12.5px] font-medium text-foreground">{c.name}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[#EEF2FF] text-primary rounded-full">{c.channel}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                        {c.tags.map((t, j) => (
                                            <span key={j} className="px-1.5 py-0.5 text-[9px] bg-[#F3F4F6] text-[#6B7280] rounded">{t}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[12px] text-[#6B7280]">{c.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ═══ MAIN PAGE ═══
export default function CRMPage() {
    const [sidebar, setSidebar] = useState<CRMView>('contacts');

    const views: Record<CRMView, React.FC> = {
        'boards': BoardsView,
        'contacts': ContactsView,
        'companies': CompaniesView,
    };
    const View = views[sidebar];

    return (
        <div className="flex h-[calc(100vh-52px)]">
            <CRMSidebar active={sidebar} onChange={setSidebar} />
            <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
                <View />
            </div>
        </div>
    );
}
