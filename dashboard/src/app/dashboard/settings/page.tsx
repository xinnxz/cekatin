'use client';

import { useState } from 'react';
import {
    Settings, Users, GitBranch, Ticket, MessageSquare, Zap, Tag,
    Star, Clock, Code, Bot, Timer, Shield, Search, Plus, Trash2,
    Edit, Mail, Phone, Building2, User, ChevronRight, Globe, Key,
    Webhook, Wrench, FileText, ExternalLink, X, Save, Copy,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Settings Page — Persis cekat.ai/settings
   
   Layout: Sidebar kiri (13 menu items) + Content panel kanan
   
   Penjelasan arsitektur:
   ┌──────────────────────────────────────────────────────────┐
   │ Settings           ×│                                    │
   │ ┌──────────────┐    │  ┌──────────────────────────────┐  │
   │ │ 👤 ReonShop  │    │  │  General                     │  │
   │ │ email@...    │    │  │  Manage account & business    │  │
   │ ├──────────────┤    │  │                               │  │
   │ │ 🔍 Search    │    │  │  Account details              │  │
   │ ├──────────────┤    │  │  Business information          │  │
   │ │ ⚙ General    │ ◄──│  │  Account information          │  │
   │ │ 👥 Users     │    │  │                               │  │
   │ │ 🔧 Pipeline  │    │  └──────────────────────────────┘  │
   │ │ 🎫 Tickets   │    │                                    │
   │ │ 📧 Followups │    │                                    │
   │ │ ⚡ Quick Rep  │    │                                    │
   │ │ 🏷 Labels    │    │                                    │
   │ │ ⭐ CSAT      │    │                                    │
   │ │ ⏰ Hours     │    │                                    │
   │ │ </> Dev API  │    │                                    │
   │ │ 🤖 Auto Res  │    │                                    │
   │ │ ⏳ SLA       │    │                                    │
   │ │ 🚫 IP Block  │    │                                    │
   │ └──────────────┘    │                                    │
   └──────────────────────────────────────────────────────────┘
   
   Setiap menu item menampilkan konten yang berbeda di panel kanan.
   Ini menggunakan state management untuk tracking active section.
   ═══════════════════════════════════════════════════════════════ */

type SettingsSection =
    | 'general' | 'users' | 'pipeline' | 'tickets' | 'followups'
    | 'quick-replies' | 'labels' | 'csat' | 'working-hours'
    | 'developers' | 'ai-auto-resolve' | 'sla' | 'ip-blocklist';

// ── Sidebar Menu Items ──
const menuItems: { key: SettingsSection; label: string; icon: React.ElementType }[] = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'pipeline', label: 'Chat Pipeline & Fields', icon: GitBranch },
    { key: 'tickets', label: 'Tickets', icon: Ticket },
    { key: 'followups', label: 'Followups', icon: MessageSquare },
    { key: 'quick-replies', label: 'Quick Replies', icon: Zap },
    { key: 'labels', label: 'Labels', icon: Tag },
    { key: 'csat', label: 'Customer Satisfaction', icon: Star },
    { key: 'working-hours', label: 'Working Hours', icon: Clock },
    { key: 'developers', label: 'Developers & API', icon: Code },
    { key: 'ai-auto-resolve', label: 'Ai Auto Resolve', icon: Bot },
    { key: 'sla', label: 'SLA Management', icon: Timer },
    { key: 'ip-blocklist', label: 'IP Blocklist', icon: Shield },
];

// ── Sample Data ──
const agents = [
    { name: 'ReonShop', email: 'admin@reonshop.com', role: 'Super-Agent', status: 'Online' },
    { name: 'Luthfi', email: 'luthfi@reonshop.com', role: 'Agent', status: 'Online' },
    { name: 'Dina CS', email: 'dina@reonshop.com', role: 'Agent', status: 'Offline' },
];

const labels = [
    { name: 'Billing', color: '#3B82F6' },
    { name: 'Urgent', color: '#EF4444' },
    { name: 'Product Inquiry', color: '#10B981' },
    { name: 'Complaint', color: '#F59E0B' },
    { name: 'Follow Up', color: '#8B5CF6' },
];

const quickReplies = [
    { shortcut: '/greeting', message: 'Halo! Selamat datang di ReonShop. Ada yang bisa kami bantu?' },
    { shortcut: '/thanks', message: 'Terima kasih telah menghubungi ReonShop! Semoga harimu menyenangkan 😊' },
    { shortcut: '/ongkir', message: 'Untuk cek ongkir, silakan kirimkan alamat lengkap dan produk yang ingin dipesan.' },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ══════════════════════════════════════════
// SECTION CONTENT COMPONENTS
// ══════════════════════════════════════════

function GeneralSection() {
    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <Settings className="w-6 h-6 text-[#6B7280]" />
                <h1 className="text-[24px] font-bold text-foreground">General</h1>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-6">Manage your account and business information</p>

            {/* Account details */}
            <div className="border border-[#E5E7EB] rounded-xl p-5 mb-5">
                <h2 className="text-[16px] font-bold text-foreground mb-4">Account details</h2>
                <div className="border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#6B7280] flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-foreground">ReonShop</h3>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                            <Mail className="w-3 h-3" /> admin@reonshop.com
                        </div>
                        <p className="text-[12px] text-[#6B7280]">Super Agent</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[12px] text-green-600 font-medium">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business information */}
            <div className="border border-[#E5E7EB] rounded-xl p-5 mb-5">
                <h2 className="text-[16px] font-bold text-foreground mb-4">Business information</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-[#9CA3AF]" />
                        <div>
                            <p className="text-[11px] text-[#9CA3AF]">Business name</p>
                            <p className="text-[13px] font-medium text-foreground">Reon</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#9CA3AF]" />
                        <div>
                            <p className="text-[11px] text-[#9CA3AF]">Business email</p>
                            <p className="text-[13px] font-medium text-foreground">admin@reonshop.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-[#9CA3AF]" />
                        <div>
                            <p className="text-[11px] text-[#9CA3AF]">Phone number</p>
                            <p className="text-[13px] text-[#9CA3AF]">No phone number</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account information */}
            <div className="border border-[#E5E7EB] rounded-xl p-5">
                <h2 className="text-[16px] font-bold text-foreground mb-4">Account information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Auto Logout (minutes)</label>
                        <input type="number" defaultValue={30} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Timezone</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary">
                            <option>Asia/Jakarta (WIB)</option>
                            <option>Asia/Makassar (WITA)</option>
                            <option>Asia/Jayapura (WIT)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Language</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary">
                            <option>Indonesian</option>
                            <option>English</option>
                        </select>
                    </div>
                </div>
                <button className="mt-4 px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover">
                    Save Changes
                </button>
            </div>
        </div>
    );
}

function UsersSection() {
    const [tab, setTab] = useState<'agent' | 'team'>('agent');
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-[24px] font-bold text-foreground">Users</h1>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                    <Settings className="w-3.5 h-3.5" /> Settings
                </button>
            </div>
            <div className="flex gap-0 border-b border-[#E5E7EB] mb-5">
                {(['agent', 'team'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-medium border-b-2 ${tab === t ? 'text-primary border-primary' : 'text-[#6B7280] border-transparent'}`}>
                        {t === 'agent' ? 'Human Agent' : 'Team'}
                    </button>
                ))}
            </div>

            {tab === 'agent' && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input placeholder="Search Agent" className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-primary" />
                        </div>
                        <button className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold text-white bg-foreground rounded-lg">
                            <Plus className="w-3.5 h-3.5" /> Agent
                        </button>
                    </div>
                    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    {['Agent Name', 'Email', 'Role', 'Status', 'Action'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-primary">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {agents.map((a, i) => (
                                    <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold">
                                                {a.name[0]}
                                            </div>
                                            <span className="text-[12.5px] font-medium text-foreground">{a.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{a.email}</td>
                                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{a.role}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${a.status === 'Online' ? 'bg-green-500' : 'bg-[#D1D5DB]'}`} />
                                                <span className={`text-[12px] ${a.status === 'Online' ? 'text-green-600' : 'text-[#9CA3AF]'}`}>{a.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 flex gap-1">
                                            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Edit className="w-3.5 h-3.5 text-primary" /></button>
                                            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {tab === 'team' && (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                    <p className="text-[14px] font-medium text-foreground mb-1">No teams created yet</p>
                    <p className="text-[12px] text-[#9CA3AF] mb-4">Create teams to organize your agents into divisions</p>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg mx-auto">
                        <Plus className="w-3.5 h-3.5" /> Create Team
                    </button>
                </div>
            )}
        </div>
    );
}

function PipelineSection() {
    const stages = ['New', 'In Progress', 'Qualified', 'Won', 'Lost'];
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">Chat Pipeline & Fields</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Manage your chat pipeline stages and custom fields</p>

            <h2 className="text-[16px] font-bold text-foreground mb-3">Pipeline Stages</h2>
            <div className="space-y-2 mb-6">
                {stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 border border-[#E5E7EB] rounded-lg px-4 py-3 bg-white hover:shadow-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'][i] }} />
                        <span className="text-[13px] font-medium text-foreground flex-1">{s}</span>
                        <button><Edit className="w-3.5 h-3.5 text-[#9CA3AF]" /></button>
                        <button><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                    </div>
                ))}
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Add Stage
            </button>
        </div>
    );
}

function TicketsSection() {
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">Tickets</h1>
            <p className="text-[13px] text-[#6B7280] mb-5">Manage ticket templates and export data</p>
            <div className="flex gap-0 border-b border-[#E5E7EB] mb-5">
                <button className="px-4 py-2.5 text-[13px] font-medium text-primary border-b-2 border-primary">Ticket Templates</button>
                <button className="px-4 py-2.5 text-[13px] font-medium text-[#6B7280] border-b-2 border-transparent">Export Tickets</button>
            </div>
            <div className="text-center py-8">
                <Ticket className="w-10 h-10 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-[13px] text-[#9CA3AF]">No ticket templates yet</p>
                <button className="mt-3 flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg mx-auto">
                    <Plus className="w-3.5 h-3.5" /> Add Template
                </button>
            </div>
        </div>
    );
}

function FollowupsSection() {
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">Followups</h1>
            <p className="text-[13px] text-[#6B7280] mb-5">Configure automated followup messages</p>
            <div className="flex gap-0 border-b border-[#E5E7EB] mb-5">
                <button className="px-4 py-2.5 text-[13px] font-medium text-primary border-b-2 border-primary">Template Message</button>
                <button className="px-4 py-2.5 text-[13px] font-medium text-[#6B7280] border-b-2 border-transparent">Follow Up</button>
            </div>
            <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-[13px] text-[#9CA3AF]">No followup templates configured</p>
                <button className="mt-3 flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg mx-auto">
                    <Plus className="w-3.5 h-3.5" /> Add Template
                </button>
            </div>
        </div>
    );
}

function QuickRepliesSection() {
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground mb-1">Quick Replies</h1>
                    <p className="text-[13px] text-[#6B7280]">Create shortcuts for frequently used messages</p>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Quick Reply
                </button>
            </div>
            <div className="space-y-3">
                {quickReplies.map((qr, i) => (
                    <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 hover:shadow-sm bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-mono font-medium rounded">{qr.shortcut}</span>
                            <div className="flex gap-1">
                                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Edit className="w-3 h-3 text-[#9CA3AF]" /></button>
                                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-300" /></button>
                            </div>
                        </div>
                        <p className="text-[12.5px] text-[#6B7280]">{qr.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LabelsSection() {
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-[24px] font-bold text-foreground mb-1">Labels</h1>
                    <p className="text-[13px] text-[#6B7280]">Manage conversation labels for categorization</p>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Label
                </button>
            </div>
            <div className="space-y-2">
                {labels.map((l, i) => (
                    <div key={i} className="flex items-center gap-3 border border-[#E5E7EB] rounded-lg px-4 py-3 bg-white hover:shadow-sm">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-[13px] font-medium text-foreground flex-1">{l.name}</span>
                        <button><Edit className="w-3.5 h-3.5 text-[#9CA3AF]" /></button>
                        <button><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CSATSection() {
    const [enabled, setEnabled] = useState(true);
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">Customer Satisfaction</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Configure CSAT surveys sent after conversations</p>
            <div className="border border-[#E5E7EB] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[15px] font-bold text-foreground">Enable CSAT Survey</h2>
                    <button onClick={() => setEnabled(!enabled)}
                        className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Survey Message</label>
                        <textarea defaultValue="Bagaimana penilaian Anda terhadap layanan kami?" rows={2}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Send survey after</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white">
                            <option>Chat resolved</option>
                            <option>30 minutes after last message</option>
                            <option>1 hour after last message</option>
                        </select>
                    </div>
                </div>
                <button className="mt-4 px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">Save</button>
            </div>
        </div>
    );
}

function WorkingHoursSection() {
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">Working Hours</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Set your team&apos;s availability schedule</p>
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['Day', 'Enabled', 'Start', 'End'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-primary">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map((day, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6]">
                                <td className="px-4 py-3 text-[13px] font-medium text-foreground">{day}</td>
                                <td className="px-4 py-3">
                                    <input type="checkbox" defaultChecked={i < 5} className="rounded border-[#D1D5DB]" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="time" defaultValue="09:00" className="border border-[#E5E7EB] rounded px-2 py-1 text-[12px]" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="time" defaultValue="17:00" className="border border-[#E5E7EB] rounded px-2 py-1 text-[12px]" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button className="mt-4 px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">Save Working Hours</button>
        </div>
    );
}

function DevelopersSection() {
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">Developers</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Manage your API keys, webhooks, tools, and development integrations</p>
            <div className="space-y-3">
                {[
                    { icon: Key, title: 'API keys', desc: 'Manage your API access tokens', locked: false },
                    { icon: Globe, title: 'Webhooks', desc: 'Configure webhook URLs for real-time notifications', locked: false },
                    { icon: Wrench, title: 'API Tools', desc: 'Manage and configure your API tools for AI agents', locked: false },
                    { icon: MessageSquare, title: 'Messages sent by API', desc: 'View and manage messages sent through the API', locked: false },
                    { icon: ExternalLink, title: 'API Documentation', desc: 'Explore the detailed API documentation with code examples in 15+ programming languages', locked: false },
                ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div key={i} className="border border-[#E5E7EB] rounded-xl px-5 py-4 flex items-center gap-4 bg-white hover:shadow-sm cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                                <Icon className="w-5 h-5 text-[#6B7280]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-semibold text-foreground">{item.title}</h3>
                                <p className="text-[12px] text-[#9CA3AF]">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#9CA3AF]" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AIAutoResolveSection() {
    const [enabled, setEnabled] = useState(false);
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">AI Auto Resolve</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Automatically close conversations when resolved by AI</p>
            <div className="border border-[#E5E7EB] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-[15px] font-bold text-foreground">Enable Auto Resolve</h2>
                        <p className="text-[12px] text-[#9CA3AF]">AI will automatically close chats when customer issues are resolved</p>
                    </div>
                    <button onClick={() => setEnabled(!enabled)}
                        className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Resolve after inactivity (minutes)</label>
                        <input type="number" defaultValue={60} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Closing message</label>
                        <textarea defaultValue="Terima kasih telah menghubungi kami. Chat ini akan ditutup secara otomatis." rows={2}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                </div>
                <button className="mt-4 px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">Save Settings</button>
            </div>
        </div>
    );
}

function SLASection() {
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">SLA Management</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Set service level agreements for response times</p>
            <div className="border border-[#E5E7EB] rounded-xl p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">First Response Time (minutes)</label>
                        <input type="number" defaultValue={5} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Resolution Time (hours)</label>
                        <input type="number" defaultValue={24} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Escalation After (minutes)</label>
                        <input type="number" defaultValue={30} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Notify Agent After (minutes)</label>
                        <input type="number" defaultValue={3} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                </div>
                <button className="mt-4 px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">Save SLA</button>
            </div>
        </div>
    );
}

function IPBlocklistSection() {
    const [ips] = useState(['192.168.1.100', '10.0.0.50']);
    return (
        <div>
            <h1 className="text-[24px] font-bold text-foreground mb-1">IP Blocklist</h1>
            <p className="text-[13px] text-[#6B7280] mb-6">Block specific IP addresses from accessing your chat</p>
            <div className="flex gap-2 mb-5">
                <input placeholder="Enter IP address (e.g. 192.168.1.1)" className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                <button className="px-4 py-2.5 text-[12px] font-semibold text-white bg-primary rounded-lg">Add IP</button>
            </div>
            <div className="space-y-2">
                {ips.map((ip, i) => (
                    <div key={i} className="flex items-center justify-between border border-[#E5E7EB] rounded-lg px-4 py-3 bg-white">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-400" />
                            <span className="text-[13px] font-mono text-foreground">{ip}</span>
                        </div>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════

const sectionComponents: Record<SettingsSection, React.FC> = {
    'general': GeneralSection,
    'users': UsersSection,
    'pipeline': PipelineSection,
    'tickets': TicketsSection,
    'followups': FollowupsSection,
    'quick-replies': QuickRepliesSection,
    'labels': LabelsSection,
    'csat': CSATSection,
    'working-hours': WorkingHoursSection,
    'developers': DevelopersSection,
    'ai-auto-resolve': AIAutoResolveSection,
    'sla': SLASection,
    'ip-blocklist': IPBlocklistSection,
};

export default function SettingsPage() {
    const [active, setActive] = useState<SettingsSection>('general');
    const [search, setSearch] = useState('');

    const ActiveComponent = sectionComponents[active];
    const filteredItems = menuItems.filter(m => m.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-52px)]">
            {/* Sidebar */}
            <div className="w-[260px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">
                {/* Header */}
                <div className="px-4 pt-5 pb-3 border-b border-[#E5E7EB]">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[17px] font-bold text-foreground">Settings</h2>
                        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]">
                            <X className="w-4 h-4 text-[#6B7280]" />
                        </button>
                    </div>
                    {/* User info */}
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-[12px] font-bold">R</span>
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-foreground">Reon</p>
                            <p className="text-[10px] text-[#9CA3AF]">admin@reonshop.com</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                            className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-primary" />
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-2">
                    {filteredItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button key={item.key} onClick={() => setActive(item.key)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${active === item.key
                                        ? 'text-primary bg-primary/5 border-l-3 border-primary'
                                        : 'text-[#6B7280] hover:text-foreground hover:bg-[#F9FAFB]'
                                    }`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                                {active === item.key && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </button>
                        );
                    })}
                </div>

                {/* Bottom user */}
                <div className="border-t border-[#E5E7EB] px-4 py-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#6B7280] flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-foreground">ReonShop</p>
                        <p className="text-[10px] text-[#9CA3AF]">Super Agent</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-medium text-green-600 bg-green-100 rounded-full">Online</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-8">
                <div className="max-w-[800px]">
                    <ActiveComponent />
                </div>
            </div>
        </div>
    );
}
