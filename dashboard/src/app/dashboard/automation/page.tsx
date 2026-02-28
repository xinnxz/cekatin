'use client';

import { useState } from 'react';
import {
    Search, Plus, Filter, Edit, Trash2, Eye, Zap, GitBranch, Clock,
    Play, Pause, CheckCircle2, AlertCircle, ArrowRight, Settings,
    LayoutGrid, List, Bot, Mail, MessageSquare, UserPlus, Tag,
    Target, Workflow,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Automation Page — Persis cekat.ai/automation
   
   Penjelasan arsitektur:
   ┌──────────────────────────────────────────────────────────┐
   │  Automation                                              │
   │  Workflows   Templates   Activity Log                    │
   │  ──────────                                              │
   │                                                          │
   │  Workflows Tab:                                          │
   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
   │  │Total │ │Active│ │Paused│ │Error │  ← 4 KPI cards     │
   │  │  6   │ │  3   │ │  2   │ │  1   │                    │
   │  └──────┘ └──────┘ └──────┘ └──────┘                    │
   │  [+ Create Workflow]                   [Grid] [List]     │
   │                                                          │
   │  Workflow Cards grid or list view                        │
   │                                                          │
   │  Templates Tab:                                          │
   │  Pre-built automation templates                          │
   │                                                          │
   │  Activity Log Tab:                                       │
   │  Execution history of automations                        │
   └──────────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════ */

// ── Sample Data ──
const workflows = [
    { name: 'Welcome Message', desc: 'Kirim pesan sambutan untuk customer baru', trigger: 'New Contact', status: 'Active', runs: 1250, lastRun: '5 min ago', steps: 3 },
    { name: 'Order Confirmation', desc: 'Kirim konfirmasi otomatis setelah pembayaran', trigger: 'Payment Received', status: 'Active', runs: 890, lastRun: '12 min ago', steps: 5 },
    { name: 'Abandoned Cart Reminder', desc: 'Reminder untuk customer yang meninggalkan keranjang', trigger: 'Cart Abandoned (30min)', status: 'Paused', runs: 345, lastRun: '2 hours ago', steps: 4 },
    { name: 'Feedback Request', desc: 'Minta review setelah order selesai', trigger: 'Order Completed', status: 'Active', runs: 560, lastRun: '28 min ago', steps: 2 },
    { name: 'Re-engagement Campaign', desc: 'Jangkau kembali customer yang tidak aktif', trigger: 'Inactive (14 days)', status: 'Paused', runs: 120, lastRun: '1 day ago', steps: 6 },
    { name: 'VIP Upgrade Notification', desc: 'Notifikasi ketika customer naik level VIP', trigger: 'Spend Threshold', status: 'Error', runs: 45, lastRun: '3 hours ago', steps: 3 },
];

const templates = [
    { name: 'Welcome Series', desc: 'Seri pesan sambutan 3 hari untuk customer baru', icon: UserPlus, category: 'Onboarding', steps: 5 },
    { name: 'Birthday Greeting', desc: 'Kirim ucapan ulang tahun otomatis', icon: Mail, category: 'Engagement', steps: 2 },
    { name: 'Order Follow-up', desc: 'Follow up setelah pengiriman selesai', icon: MessageSquare, category: 'Sales', steps: 4 },
    { name: 'Lead Scoring', desc: 'Scoring otomatis berdasarkan aktivitas', icon: Target, category: 'CRM', steps: 6 },
    { name: 'Label Assignment', desc: 'Auto-assign label berdasarkan kata kunci', icon: Tag, category: 'Organization', steps: 3 },
    { name: 'AI Auto-Reply', desc: 'Balasan AI otomatis di luar jam kerja', icon: Bot, category: 'Support', steps: 3 },
];

const activityLog = [
    { workflow: 'Welcome Message', contact: 'Andi Pratama', status: 'Success', time: '5 min ago', steps: '3/3' },
    { workflow: 'Order Confirmation', contact: 'Budi Santoso', status: 'Success', time: '12 min ago', steps: '5/5' },
    { workflow: 'Feedback Request', contact: 'Citra Dewi', status: 'Success', time: '28 min ago', steps: '2/2' },
    { workflow: 'VIP Upgrade Notification', contact: 'Diana Putri', status: 'Failed', time: '3 hours ago', steps: '1/3' },
    { workflow: 'Welcome Message', contact: 'Eko Wijaya', status: 'Success', time: '4 hours ago', steps: '3/3' },
    { workflow: 'Re-engagement Campaign', contact: 'Fani Rahma', status: 'Skipped', time: '1 day ago', steps: '0/6' },
];

export default function AutomationPage() {
    const [tab, setTab] = useState<'workflows' | 'templates' | 'activity'>('workflows');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const activeCount = workflows.filter(w => w.status === 'Active').length;
    const pausedCount = workflows.filter(w => w.status === 'Paused').length;
    const errorCount = workflows.filter(w => w.status === 'Error').length;

    return (
        <div className="h-[calc(100vh-52px)] overflow-y-auto p-6 bg-[#F9FAFB]">
            {/* Header */}
            <h1 className="text-[22px] font-bold text-foreground mb-1">Automation</h1>
            <p className="text-[13px] text-[#6B7280] mb-5">Create and manage automated workflows for your business</p>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-[#E5E7EB] mb-6">
                {([['workflows', 'Workflows'], ['templates', 'Templates'], ['activity', 'Activity Log']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k as typeof tab)}
                        className={`px-4 py-2.5 text-[13px] font-medium border-b-2 ${tab === k ? 'text-primary border-primary' : 'text-[#6B7280] border-transparent'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {/* ═══ WORKFLOWS TAB ═══ */}
            {tab === 'workflows' && (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-5">
                        {[
                            { label: 'Total Workflows', value: workflows.length, icon: Workflow, color: '#4F46E5' },
                            { label: 'Active', value: activeCount, icon: Play, color: '#10B981' },
                            { label: 'Paused', value: pausedCount, icon: Pause, color: '#F59E0B' },
                            { label: 'Error', value: errorCount, icon: AlertCircle, color: '#EF4444' },
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

                    {/* Actions bar */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                            <input placeholder="Search workflows..." className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex border border-[#E5E7EB] rounded-lg overflow-hidden">
                                <button onClick={() => setViewMode('grid')} className={`w-8 h-8 flex items-center justify-center ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-[#9CA3AF]'}`}>
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`w-8 h-8 flex items-center justify-center ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-[#9CA3AF]'}`}>
                                    <List className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                                <Plus className="w-3.5 h-3.5" /> Create Workflow
                            </button>
                        </div>
                    </div>

                    {/* Workflow Cards */}
                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
                        {workflows.map((w, i) => (
                            <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 bg-white hover:shadow-sm group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${w.status === 'Active' ? 'bg-green-100' : w.status === 'Paused' ? 'bg-yellow-100' : 'bg-red-100'
                                            }`}>
                                            <Zap className={`w-4 h-4 ${w.status === 'Active' ? 'text-green-600' : w.status === 'Paused' ? 'text-yellow-600' : 'text-red-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-semibold text-foreground">{w.name}</h3>
                                            <p className="text-[11px] text-[#9CA3AF]">{w.desc}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${w.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            w.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>{w.status}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF]">
                                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {w.steps} steps</span>
                                    <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {w.runs} runs</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {w.lastRun}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#F3F4F6]">
                                    <span className="px-2 py-0.5 text-[9px] bg-[#EEF2FF] text-primary rounded font-medium">Trigger: {w.trigger}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ TEMPLATES TAB ═══ */}
            {tab === 'templates' && (
                <div>
                    <p className="text-[13px] text-[#6B7280] mb-5">Use pre-built templates to quickly set up automation workflows</p>
                    <div className="grid grid-cols-3 gap-4">
                        {templates.map((t, i) => {
                            const Icon = t.icon;
                            return (
                                <div key={i} className="border border-[#E5E7EB] rounded-xl p-5 bg-white hover:shadow-md hover:border-primary/30 cursor-pointer transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="text-[13px] font-semibold text-foreground mb-1">{t.name}</h3>
                                    <p className="text-[11px] text-[#9CA3AF] mb-3">{t.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 text-[9px] bg-[#F3F4F6] text-[#6B7280] rounded-full">{t.category}</span>
                                        <span className="text-[10px] text-[#9CA3AF]">{t.steps} steps</span>
                                    </div>
                                    <button className="w-full mt-3 py-1.5 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        Use Template
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ ACTIVITY LOG TAB ═══ */}
            {tab === 'activity' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                            <input placeholder="Search activity..." className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            <Filter className="w-3.5 h-3.5" /> Filter
                        </button>
                    </div>
                    <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    {['Workflow', 'Contact', 'Status', 'Steps', 'Time'].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-primary">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {activityLog.map((log, i) => (
                                    <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[12.5px] font-medium text-foreground">{log.workflow}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{log.contact}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${log.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'Failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-[#F3F4F6] text-[#6B7280]'
                                                }`}>{log.status}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{log.steps}</td>
                                        <td className="px-4 py-2.5 text-[12px] text-[#9CA3AF]">{log.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
