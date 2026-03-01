'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, SlidersHorizontal, Plus, ListChecks, RefreshCw, Check,
    ChevronDown, X, Send, Paperclip, Smile, MoreVertical,
    Phone, User, Clock, Tag, FileText, Shield, Ticket, ArrowRight,
    Wifi, WifiOff,
} from 'lucide-react';
import { backend, type Conversation as BackendConv, type ChatMessage as BackendMsg, type WSMessage } from '@/lib/api';

/* ═══════════════════════════════════════════════════
   Chat Page — 3 Panel Layout (persis chat.cekat.ai)
   
   Penjelasan arsitektur:
   - Panel 1 (kiri ~300px): Conversation List
     → Toolbar: All Agents dropdown, Search, Filter, +New, Bulk, Refresh
     → Tabs: Assigned / Unassigned / ✓ (Resolved)
     → Daftar conversation cards
   
   - Panel 2 (tengah, flex-1): Chat Box
     → Header: nama customer, platform, status, tombol aksi
     → Bubble chat: Customer (kiri/gray), AI (kanan/biru muda), Human (kanan/biru tua)
     → Input area: Reply/Private Note toggle, textarea, tools
   
   - Panel 3 (kanan ~300px): Conversation Details
     → Informasi kontak, labels, handled by, AI summary, notes, tickets
   ═══════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────

type MessageSender = 'customer' | 'ai' | 'agent' | 'note';
type ConvStatus = 'assigned' | 'unassigned' | 'resolved';
type Platform = 'whatsapp' | 'instagram' | 'web' | 'facebook';

interface ChatMessage {
    id: string;
    sender: MessageSender;
    senderName: string;
    text: string;
    time: string;
    status?: 'sent' | 'delivered' | 'read'; // for read receipts
    waMessageId?: string;
}

interface Conversation {
    id: string;
    customerName: string;
    phone: string;
    platform: Platform;
    status: ConvStatus;
    lastMessage: string;
    lastTime: string;
    unread: number;
    agent: string;
    labels: string[];
    messages: ChatMessage[];
    aiSummary: string;
    pipelineStatus: string;
    createdAt: string;
    assignedAt: string;
    aiEnabled?: boolean;
}

// ──────────────────────────────────────────────────
// SAMPLE DATA — Contoh conversation untuk demo
// ──────────────────────────────────────────────────

const sampleConversations: Conversation[] = [
    {
        id: 'c1',
        customerName: 'Budi Santoso',
        phone: '0812-3456-7890',
        platform: 'whatsapp',
        status: 'assigned',
        lastMessage: 'Baik kak, saya tunggu info trackingnya ya',
        lastTime: '14:23',
        unread: 0,
        agent: 'CS 1',
        labels: ['VIP', 'Order'],
        pipelineStatus: 'Follow Up',
        createdAt: '27 Feb 2026, 10:15',
        assignedAt: '27 Feb 2026, 10:16',
        aiSummary: 'Customer menanyakan status pengiriman order #12345. Sudah dikonfirmasi bahwa paket sedang dalam proses pengiriman via JNE.',
        messages: [
            { id: 'm1', sender: 'customer', senderName: 'Budi Santoso', text: 'Halo, saya mau tanya pesanan saya sudah sampai mana ya?', time: '10:15' },
            { id: 'm2', sender: 'ai', senderName: 'Cika (AI)', text: 'Halo Kak Budi! Terima kasih sudah menghubungi ReonShop. Boleh kirimkan nomor order-nya?', time: '10:15' },
            { id: 'm3', sender: 'customer', senderName: 'Budi Santoso', text: 'Nomor ordernya #12345', time: '10:18' },
            { id: 'm4', sender: 'ai', senderName: 'Cika (AI)', text: 'Baik kak, pesanan #12345 sedang dalam pengiriman via JNE. Estimasi tiba 1-2 hari kerja. Ada yang lain?', time: '10:18' },
            { id: 'm5', sender: 'customer', senderName: 'Budi Santoso', text: 'Bisa kasih tracking numbernya?', time: '14:20' },
            { id: 'm6', sender: 'agent', senderName: 'CS 1', text: 'Halo Kak Budi, tracking JNE-nya: JNE1234567890. Bisa dicek di jne.co.id ya kak.', time: '14:22' },
            { id: 'm7', sender: 'customer', senderName: 'Budi Santoso', text: 'Baik kak, saya tunggu info trackingnya ya', time: '14:23' },
        ],
    },
    {
        id: 'c2',
        customerName: 'Ani Wijaya',
        phone: '0856-7890-1234',
        platform: 'instagram',
        status: 'assigned',
        lastMessage: 'Ada warna hitam ga kak?',
        lastTime: '13:55',
        unread: 1,
        agent: 'Cika (AI)',
        labels: ['Inquiry'],
        pipelineStatus: 'New Lead',
        createdAt: '27 Feb 2026, 13:50',
        assignedAt: '27 Feb 2026, 13:50',
        aiSummary: 'Customer bertanya tentang ketersediaan warna untuk produk earphone bluetooth.',
        messages: [
            { id: 'm1', sender: 'customer', senderName: 'Ani Wijaya', text: 'Halo, earphone bluetooth yang di post kemarin masih ada?', time: '13:50' },
            { id: 'm2', sender: 'ai', senderName: 'Cika (AI)', text: 'Halo Kak Ani! Earphone Bluetooth XR-500 masih tersedia kak. Harga Rp 199.000. Mau order?', time: '13:50' },
            { id: 'm3', sender: 'customer', senderName: 'Ani Wijaya', text: 'Ada warna hitam ga kak?', time: '13:55' },
        ],
    },
    {
        id: 'c3',
        customerName: 'Dedi Mulyadi',
        phone: '0821-1122-3344',
        platform: 'whatsapp',
        status: 'unassigned',
        lastMessage: 'Mau komplain barang rusak',
        lastTime: '12:30',
        unread: 3,
        agent: '',
        labels: ['Complaint'],
        pipelineStatus: 'Pending',
        createdAt: '27 Feb 2026, 12:28',
        assignedAt: '-',
        aiSummary: 'Customer ingin melaporkan produk yang diterima dalam kondisi rusak dan menanyakan proses return.',
        messages: [
            { id: 'm1', sender: 'customer', senderName: 'Dedi Mulyadi', text: 'Halo admin, saya terima paket tapi barangnya rusak', time: '12:28' },
            { id: 'm2', sender: 'ai', senderName: 'Cika (AI)', text: 'Mohon maaf atas ketidaknyamanannya, Kak Dedi. Bisa kirimkan foto kondisi barangnya? Kami akan proses pengembalian.', time: '12:28' },
            { id: 'm3', sender: 'customer', senderName: 'Dedi Mulyadi', text: 'Mau komplain barang rusak', time: '12:30' },
        ],
    },
    {
        id: 'c4',
        customerName: 'Siti Rahayu',
        phone: '0877-5566-7788',
        platform: 'web',
        status: 'unassigned',
        lastMessage: 'Apakah bisa COD?',
        lastTime: '11:45',
        unread: 1,
        agent: '',
        labels: [],
        pipelineStatus: 'New Lead',
        createdAt: '27 Feb 2026, 11:40',
        assignedAt: '-',
        aiSummary: 'Customer menanyakan apakah tersedia opsi Cash on Delivery (COD).',
        messages: [
            { id: 'm1', sender: 'customer', senderName: 'Siti Rahayu', text: 'Apakah bisa COD?', time: '11:45' },
        ],
    },
    {
        id: 'c5',
        customerName: 'Hendra Gunawan',
        phone: '0833-9900-1122',
        platform: 'whatsapp',
        status: 'resolved',
        lastMessage: 'Terima kasih banyak kak!',
        lastTime: 'Kemarin',
        unread: 0,
        agent: 'CS 2',
        labels: ['Order', 'Completed'],
        pipelineStatus: 'Closed Won',
        createdAt: '26 Feb 2026, 09:00',
        assignedAt: '26 Feb 2026, 09:01',
        aiSummary: 'Customer sudah berhasil melakukan order Samsung Galaxy A15 dan pembayaran sudah terkonfirmasi.',
        messages: [
            { id: 'm1', sender: 'customer', senderName: 'Hendra Gunawan', text: 'Halo, mau order Samsung Galaxy A15', time: '09:00' },
            { id: 'm2', sender: 'ai', senderName: 'Cika (AI)', text: 'Samsung Galaxy A15 tersedia kak, Rp 2.499.000. Mau langsung order?', time: '09:00' },
            { id: 'm3', sender: 'customer', senderName: 'Hendra Gunawan', text: 'Iya mau order', time: '09:05' },
            { id: 'm4', sender: 'agent', senderName: 'CS 2', text: 'Baik kak, order sudah diproses. Invoice dikirim via WA ya. Terima kasih!', time: '09:10' },
            { id: 'm5', sender: 'customer', senderName: 'Hendra Gunawan', text: 'Terima kasih banyak kak!', time: '09:12' },
        ],
    },
];

// ──────────────────────────────────────────────────
// PLATFORM ICONS & COLORS
// ──────────────────────────────────────────────────

const platformConfig: Record<Platform, { label: string; color: string }> = {
    whatsapp: { label: 'WhatsApp', color: '#25D366' },
    instagram: { label: 'Instagram', color: '#E1306C' },
    web: { label: 'Web Chat', color: '#4F46E5' },
    facebook: { label: 'Facebook', color: '#1877F2' },
};

function PlatformDot({ platform }: { platform: Platform }) {
    return (
        <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: platformConfig[platform].color }}
            title={platformConfig[platform].label}
        />
    );
}

// ──────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────

/* ── Filter Modal ── */
function FilterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl w-[720px] max-w-[90vw] p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[18px] font-bold text-foreground">Filter</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                        <X className="w-5 h-5 text-[#6B7280]" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {/* Date Range */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Date Range</label>
                        <div className="flex items-center border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-[#9CA3AF]">
                            <span>DD-MM-YYYY - DD-MM-YYYY</span>
                            <svg className="w-4 h-4 ml-auto text-[#9CA3AF]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                                <rect x="2" y="3" width="12" height="11" rx="1.5" />
                                <path d="M2 6h12M5 1.5v2M11 1.5v2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                    {/* Inbox */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Inbox</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>All Inboxes</option>
                        </select>
                    </div>
                    {/* Label */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Label</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>Choose Labels</option>
                        </select>
                    </div>
                    {/* Resolved By */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Resolved By</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>Choose Agent</option>
                        </select>
                    </div>
                    {/* Agent */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Agent</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>Choose Agent(s)</option>
                        </select>
                    </div>
                    {/* AI Agent */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">AI Agent</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>Choose AI Agent</option>
                        </select>
                    </div>
                    {/* Status */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Status</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>All Statuses</option>
                        </select>
                    </div>
                    {/* Pipeline Status */}
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Pipeline Status</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-foreground bg-white">
                            <option>All Statuses</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-2 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                        Reset
                    </button>
                    <button onClick={onClose} className="px-6 py-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
                        Apply
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ── Conversation Card ── */
function ConvCard({
    conv,
    isActive,
    onClick,
}: {
    conv: Conversation;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`px-3 py-2.5 cursor-pointer border-b border-[#F3F4F6] transition-colors ${isActive ? 'bg-[#EEF2FF]' : 'hover:bg-[#F9FAFB]'
                }`}
        >
            <div className="flex items-start gap-2.5">
                {/* Avatar circle */}
                <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[13px] font-semibold text-[#6B7280] flex-shrink-0 mt-0.5">
                    {conv.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <PlatformDot platform={conv.platform} />
                            <span className="text-[13px] font-semibold text-foreground truncate">{conv.customerName}</span>
                        </div>
                        <span className="text-[11px] text-[#9CA3AF] flex-shrink-0 ml-2">{conv.lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[12px] text-[#6B7280] truncate pr-2">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                {conv.unread}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Onboarding SVG Icons ── */
const OnboardingIcons = {
    platform: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    aiAgent: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16.01" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
            <line x1="16" y1="16" x2="16" y2="16.01" />
        </svg>
    ),
    team: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    connect: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
};

/* ── Chat Bubble ── */
function ChatBubble({ msg }: { msg: ChatMessage }) {
    const isCustomer = msg.sender === 'customer';
    const isNote = msg.sender === 'note';

    // Warna berbeda per sender sesuai cekat.ai docs:
    // AI → biru muda (#DBEAFE), Human Agent → biru tua (#4F46E5), Customer → abu (#F3F4F6), Note → kuning
    const bubbleStyles: Record<MessageSender, string> = {
        customer: 'bg-[#F3F4F6] text-foreground',
        ai: 'bg-[#DBEAFE] text-foreground',
        agent: 'bg-[#4F46E5] text-white',
        note: 'bg-[#FEF3C7] text-foreground border border-[#FDE68A]',
    };

    if (isNote) {
        return (
            <div className="flex justify-center my-2">
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-[12.5px] ${bubbleStyles.note}`}>
                    <p className="text-[10px] font-semibold text-[#92400E] mb-1">Private Note</p>
                    <p>{msg.text}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex mb-3 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%]`}>
                <div className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed ${bubbleStyles[msg.sender]}`}>
                    {msg.text}
                </div>
                <p className={`text-[10.5px] mt-0.5 ${isCustomer ? 'text-left' : 'text-right'} text-[#9CA3AF]`}>
                    {msg.senderName} · {msg.time}
                    {!isCustomer && msg.status && (
                        <span className={`ml-1 ${msg.status === 'read' ? 'text-[#3B82F6]' : ''}`}>
                            {msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'read' ? '✓✓' : ''}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

/* ── Conversation Details Panel ── */
function DetailsPanel({ conv }: { conv: Conversation }) {
    const [contact, setContact] = useState<{ name: string; email: string; notes: string; tags: string; id: string } | null>(null);
    const [editEmail, setEditEmail] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    // Fetch contact data when conversation changes
    useEffect(() => {
        const fetchContact = async () => {
            try {
                const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                const res = await fetch(`${BACKEND}/api/contacts/phone/${conv.phone}`);
                if (res.ok) {
                    const data = await res.json();
                    setContact(data.contact);
                    setEditEmail(data.contact.email || '');
                    setEditNotes(data.contact.notes || '');
                }
            } catch { /* not found — contact belum ada */ }
        };
        fetchContact();
    }, [conv.phone]);

    // Auto-save notes/email (debounced 1s)
    const autoSave = useCallback((field: string, value: string) => {
        if (!contact?.id) return;
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(async () => {
            try {
                const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                await fetch(`${BACKEND}/api/contacts/${contact.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: value }),
                });
            } catch { /* silent */ }
        }, 1000);
    }, [contact?.id]);

    const tags = contact?.tags ? contact.tags.split(',').filter(Boolean) : conv.labels || [];

    return (
        <div className="w-[300px] bg-white border-l border-[#E5E7EB] flex flex-col flex-shrink-0 overflow-y-auto">
            {/* Contact Info Header */}
            <div className="p-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[15px] font-bold text-[#6B7280]">
                        {conv.customerName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold text-foreground">{conv.customerName}</h3>
                        <p className="text-[12px] text-[#6B7280]">{conv.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <PlatformDot platform={conv.platform} />
                    <span>{platformConfig[conv.platform].label}</span>
                    {(conv.aiEnabled ?? true)
                        ? <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-[#DBEAFE] text-[#2563EB] rounded">🤖 AI On</span>
                        : <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-[#F3F4F6] text-[#9CA3AF] rounded">⏸️ AI Off</span>
                    }
                </div>
            </div>

            {/* Email */}
            <DetailSection title="Email">
                <input
                    type="email"
                    value={editEmail}
                    onChange={e => { setEditEmail(e.target.value); autoSave('email', e.target.value); }}
                    placeholder="customer@email.com"
                    className="w-full text-[12.5px] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                />
            </DetailSection>

            {/* Pipeline Status */}
            <DetailSection title="Pipeline Status">
                <select className="w-full text-[12.5px] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 bg-white text-foreground">
                    <option>{conv.pipelineStatus}</option>
                    <option>New Lead</option>
                    <option>Follow Up</option>
                    <option>Negotiation</option>
                    <option>Closed Won</option>
                    <option>Closed Lost</option>
                </select>
            </DetailSection>

            {/* Labels / Tags */}
            <DetailSection title="Labels">
                <div className="flex flex-wrap gap-1.5">
                    {tags.map(l => (
                        <span key={l} className="px-2 py-0.5 text-[11px] font-medium bg-[#EEF2FF] text-primary border border-[#C7D2FE] rounded-full">
                            {l.trim()}
                        </span>
                    ))}
                    <button className="px-2 py-0.5 text-[11px] text-[#9CA3AF] border border-dashed border-[#D1D5DB] rounded-full hover:border-primary hover:text-primary">
                        + Add
                    </button>
                </div>
            </DetailSection>

            {/* Handled By */}
            <DetailSection title="Handled By">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[10px] font-bold text-primary">
                        {conv.agent ? conv.agent.charAt(0) : '?'}
                    </div>
                    <span className="text-[12.5px] text-foreground">{conv.agent || 'Not assigned'}</span>
                </div>
            </DetailSection>

            {/* Notes */}
            <DetailSection title="Notes">
                <textarea
                    value={editNotes}
                    onChange={e => { setEditNotes(e.target.value); autoSave('notes', e.target.value); }}
                    placeholder="Add internal note about this customer..."
                    className="w-full text-[12px] border border-[#E5E7EB] rounded-lg px-2.5 py-2 resize-none h-20 focus:outline-none focus:border-primary"
                />
                {editNotes !== (contact?.notes || '') && (
                    <p className="text-[10px] text-[#9CA3AF] mt-1">Saving...</p>
                )}
            </DetailSection>

            {/* AI Summary */}
            <DetailSection title="AI Summary">
                <p className="text-[12px] text-[#6B7280] leading-relaxed bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB]">
                    {conv.aiSummary || 'No AI summary yet'}
                </p>
            </DetailSection>

            {/* Conversation Details */}
            <DetailSection title="Conversation Details">
                <div className="space-y-1.5 text-[12px]">
                    <DetailRow label="Created" value={conv.createdAt} />
                    <DetailRow label="Assigned" value={conv.assignedAt} />
                    <DetailRow label="Status" value={conv.status} />
                </div>
            </DetailSection>

            {/* Block */}
            <div className="p-4 border-t border-[#E5E7EB]">
                <button className="w-full text-[12px] text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors">
                    Block Conversation
                </button>
            </div>
        </div>
    );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
            <h4 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">{title}</h4>
            {children}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-[#9CA3AF]">{label}</span>
            <span className="text-foreground font-medium capitalize">{value}</span>
        </div>
    );
}

// ──────────────────────────────────────────────────
// MAIN CHAT PAGE COMPONENT
// ──────────────────────────────────────────────────

export default function ChatPage() {
    type TabKey = 'assigned' | 'unassigned' | 'resolved';

    const [activeTab, setActiveTab] = useState<TabKey>('assigned');
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputMode, setInputMode] = useState<'reply' | 'note'>('reply');
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);

    // ── Backend state (dual mode: backend → fallback ke sample data) ──
    const [backendConnected, setBackendConnected] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>(sampleConversations);
    const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // ── Load conversations dari Go backend (jika tersedia) ──
    const loadConversations = useCallback(async () => {
        try {
            const convs = await backend.getConversations();
            if (convs && convs.length > 0) {
                setConversations(convs.map(c => ({
                    id: c.id,
                    customerName: c.customer_name || c.customer_phone,
                    phone: c.customer_phone,
                    platform: (c.platform as Platform) || 'whatsapp',
                    status: (c.status === 'open' ? 'assigned' : c.status === 'resolved' ? 'resolved' : 'unassigned') as ConvStatus,
                    lastMessage: c.last_message || '',
                    lastTime: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
                    unread: 0,
                    agent: '',
                    labels: [],
                    messages: [],
                    aiSummary: '',
                    pipelineStatus: 'New Lead',
                    createdAt: new Date(c.created_at).toLocaleString('id-ID'),
                    assignedAt: '-',
                    aiEnabled: c.ai_enabled !== false,
                })));
                setBackendConnected(true);
            } else {
                // Backend tersedia tapi kosong → tetap gunakan sample + flag connected
                setBackendConnected(true);
                setConversations(sampleConversations);
            }
        } catch {
            // Backend tidak tersedia → gunakan sample data
            setBackendConnected(false);
            setConversations(sampleConversations);
        }
    }, []);

    // ── Load messages saat conversation dipilih ──
    const loadMessages = useCallback(async (convId: string) => {
        if (!backendConnected) return;
        try {
            const msgs = await backend.getMessages(convId);
            if (msgs) {
                setLiveMessages(msgs.map(m => {
                    const isAI = m.message_type === 'ai';
                    const isInbound = m.direction === 'inbound';
                    return {
                        id: m.id,
                        sender: isInbound ? 'customer' as MessageSender : isAI ? 'ai' as MessageSender : 'agent' as MessageSender,
                        senderName: isInbound ? 'Customer' : isAI ? 'Cika (AI)' : 'Agent',
                        text: m.content,
                        time: new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    };
                }));
            }
        } catch {
            setLiveMessages([]);
        }
    }, [backendConnected]);

    // ── Send message via Go backend ──
    const handleSend = useCallback(async () => {
        if (!messageText.trim() || !selectedConvId) return;
        const text = messageText.trim();
        setMessageText('');

        if (inputMode === 'note') {
            // Private note — hanya local (tidak kirim ke WhatsApp)
            const noteMsg: ChatMessage = {
                id: `note-${Date.now()}`,
                sender: 'note',
                senderName: 'Agent',
                text,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            };
            setConversations(prev => prev.map(c =>
                c.id === selectedConvId ? { ...c, messages: [...c.messages, noteMsg] } : c
            ));
            setLiveMessages(prev => [...prev, noteMsg]);
            return;
        }

        // Optimistic UI — langsung tampilkan bubble
        const optimisticMsg: ChatMessage = {
            id: `sending-${Date.now()}`,
            sender: 'agent',
            senderName: 'Agent',
            text,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setLiveMessages(prev => [...prev, optimisticMsg]);
        setConversations(prev => prev.map(c =>
            c.id === selectedConvId ? { ...c, messages: [...c.messages, optimisticMsg], lastMessage: text } : c
        ));

        // Kirim ke backend (jika connected)
        if (backendConnected) {
            setSending(true);
            try {
                await backend.sendMessage(selectedConvId, text);
            } catch (err) {
                console.error('Gagal kirim pesan:', err);
            } finally {
                setSending(false);
            }
        }
    }, [messageText, selectedConvId, inputMode, backendConnected]);

    // ── Init: coba connect ke backend saat mount ──
    useEffect(() => {
        loadConversations();

        // Connect WebSocket untuk real-time updates
        const ws = backend.connectWebSocket((msg: WSMessage) => {
            if (msg.type === 'new_message' && msg.message) {
                const isAI = msg.message.message_type === 'ai';
                const isInbound = msg.message.direction === 'inbound';
                const newMsg: ChatMessage = {
                    id: msg.message.id,
                    sender: isInbound ? 'customer' : isAI ? 'ai' : 'agent',
                    senderName: isInbound ? 'Customer' : isAI ? 'Cika (AI)' : 'Agent',
                    text: msg.message.content,
                    time: new Date(msg.message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    status: msg.message.status as ChatMessage['status'],
                    waMessageId: msg.message.wa_message_id,
                };
                setLiveMessages(prev => [...prev, newMsg]);
                loadConversations();
            }
            // Handle read receipts (status_update)
            if (msg.type === 'status_update' && msg.message) {
                const waId = msg.message.wa_message_id;
                const newStatus = msg.message.status as ChatMessage['status'];
                setLiveMessages(prev => prev.map(m =>
                    m.waMessageId === waId ? { ...m, status: newStatus } : m
                ));
            }
        });
        wsRef.current = ws;

        // Auto-polling tiap 5 detik sebagai backup WebSocket
        const pollInterval = setInterval(() => {
            loadConversations();
        }, 5000);

        return () => { ws?.close(); clearInterval(pollInterval); };
    }, [loadConversations]);

    // ── Load messages saat pilih conversation ──
    useEffect(() => {
        if (selectedConvId) {
            loadMessages(selectedConvId);
        }
    }, [selectedConvId, loadMessages]);

    // Filter conversations berdasarkan tab & search
    const filteredConvs = conversations.filter(c => {
        const matchTab = c.status === activeTab;
        const matchSearch = searchQuery === '' ||
            c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    const selectedConv = conversations.find(c => c.id === selectedConvId) || null;

    // Tentukan messages yang ditampilkan: dari backend (liveMessages) atau sample data
    const displayMessages = (backendConnected && liveMessages.length > 0) ? liveMessages : (selectedConv?.messages || []);

    // Auto-scroll ke bawah saat conversation dipilih atau ada pesan baru
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConvId, displayMessages.length]);

    const tabs: { key: TabKey; label: string; icon?: React.ReactNode }[] = [
        { key: 'assigned', label: 'Assigned' },
        { key: 'unassigned', label: 'Unassigned' },
        { key: 'resolved', label: '', icon: <Check className="w-4 h-4" /> },
    ];

    return (
        <div className="flex h-[calc(100vh-52px)]">
            <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />

            {/* ═══════════════════════════════════════════
                Panel 1: Conversation List (kiri)
                Width ~300px, persis cekat.ai
            ═══════════════════════════════════════════ */}
            <div className="w-[300px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">

                {/* Toolbar — persis urutan cekat.ai: All Agents | Search | Filter | + | Bulk | Refresh */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-[#E5E7EB]">
                    {/* All Agents dropdown */}
                    <button className="flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                        All Agents
                        <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
                    </button>

                    {/* Search toggle */}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    {/* Filter */}
                    <button
                        onClick={() => setFilterOpen(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>

                    {/* + New */}
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>

                    {/* Bulk select */}
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
                        <ListChecks className="w-4 h-4" />
                    </button>

                    {/* Refresh — reload dari backend */}
                    <button onClick={() => loadConversations()} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Backend status indicator */}
                    <div className="flex items-center gap-1 ml-auto" title={backendConnected ? 'Backend connected' : 'Using demo data'}>
                        {backendConnected ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-[#D1D5DB]" />}
                    </div>
                </div>

                {/* Search bar (expandable) */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-[#E5E7EB]"
                        >
                            <div className="px-3 py-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search conversations..."
                                        className="w-full pl-8 pr-3 py-1.5 text-[12.5px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs: Assigned / Unassigned / Resolved (✓) */}
                <div className="flex items-center border-b border-[#E5E7EB]">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSelectedConvId(null); }}
                            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[#6B7280] hover:text-foreground'
                                }`}
                        >
                            {tab.icon || tab.label}
                        </button>
                    ))}
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConvs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 4H20V16H6L4 18V4Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className="text-[13px] text-[#9CA3AF]">No conversations for now...</p>
                        </div>
                    )}
                    {filteredConvs.map(conv => (
                        <ConvCard
                            key={conv.id}
                            conv={conv}
                            isActive={conv.id === selectedConvId}
                            onClick={() => setSelectedConvId(conv.id)}
                        />
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                Panel 2: Chat Box (tengah) / Welcome (jika belum pilih conversation)
            ═══════════════════════════════════════════ */}
            {!selectedConv ? (
                /* Welcome / Onboarding — enhanced cekat.ai style
                   Penjelasan desain:
                   - Greeting area dengan emoji robot + gradient subtle
                   - Step cards dengan numbered badges berwarna
                   - Hover efek lebih ekspresif (border + shadow)
                   - Tutorial link tetap di bawah */
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#F0F1FF]/60 to-[#F9FAFB] overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-lg w-full px-6"
                    >
                        {/* Robot Greeting Illustration */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-[#8B5CF6]/20 flex items-center justify-center mb-4 border border-primary/10">
                                <span className="text-3xl">🤖</span>
                            </div>
                            <h1 className="text-xl font-semibold text-center text-foreground">
                                Selamat datang kembali di CekatIn!
                            </h1>
                            <p className="text-[13px] text-[#9CA3AF] mt-1">Ikuti langkah-langkah berikut untuk memulai</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: OnboardingIcons.platform, title: 'Hubungkan Platform', desc: 'Mulai terima pesan dari WhatsApp, IG, dan FB Anda!', color: '#FEF3C7', iconColor: '#D97706', num: '1' },
                                { icon: OnboardingIcons.aiAgent, title: 'Buat AI Agent', desc: 'Jawab pesan masuk dengan Agent AI anda', color: '#DBEAFE', iconColor: '#2563EB', num: '2' },
                                { icon: OnboardingIcons.team, title: 'Undang Agen Manusia', desc: 'Undang tim Anda untuk membantu menjawab chat', color: '#E0E7FF', iconColor: '#4F46E5', num: '3' },
                                { icon: OnboardingIcons.connect, title: 'Konek AI Agent ke Inbox', desc: 'Hubungkan AI Agent dan Human Agent ke Platform', color: '#FCE7F3', iconColor: '#DB2777', num: '4' },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5E7EB] hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative" style={{ backgroundColor: step.color, color: step.iconColor }}>
                                        {step.icon}
                                        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                            {step.num}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{step.title}</h3>
                                        <p className="text-[12.5px] text-[#6B7280] mt-0.5 italic">{step.desc}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </motion.div>
                            ))}
                        </div>
                        <p className="text-center mt-6 text-[12.5px] text-primary underline underline-offset-2 cursor-pointer hover:text-primary-hover">
                            Butuh bantuan lebih? Lihat Tutorial Youtube kami
                        </p>
                    </motion.div>
                </div>
            ) : (
                /* Chat Box — tampilan chat aktif */
                <>
                    <div className="flex-1 flex flex-col bg-[#F9FAFB]">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[13px] font-bold text-[#6B7280]">
                                    {selectedConv.customerName.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-[14px] font-semibold text-foreground">{selectedConv.customerName}</h2>
                                        <PlatformDot platform={selectedConv.platform} />
                                        <span className="text-[11px] text-[#6B7280]">{platformConfig[selectedConv.platform].label}</span>
                                    </div>
                                    <p className="text-[11.5px] text-[#9CA3AF]">{selectedConv.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {/* AI Toggle Button */}
                                <button
                                    onClick={async () => {
                                        const newVal = !(selectedConv.aiEnabled ?? true);
                                        try {
                                            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/conversations/${selectedConv.id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ ai_enabled: newVal }),
                                            });
                                            setConversations(prev => prev.map(c =>
                                                c.id === selectedConv.id ? { ...c, aiEnabled: newVal } : c
                                            ));
                                        } catch { /* silent */ }
                                    }}
                                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${(selectedConv.aiEnabled ?? true)
                                        ? 'bg-[#DBEAFE] text-[#2563EB] hover:bg-[#BFDBFE]'
                                        : 'bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]'
                                        }`}
                                    title={(selectedConv.aiEnabled ?? true) ? 'Cika AI aktif — klik untuk nonaktifkan' : 'Cika AI nonaktif — klik untuk aktifkan'}
                                >
                                    <span>{(selectedConv.aiEnabled ?? true) ? '🤖' : '⏸️'}</span>
                                    <span>{(selectedConv.aiEnabled ?? true) ? 'Cika ON' : 'Cika OFF'}</span>
                                </button>
                                {selectedConv.status === 'unassigned' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/conversations/${selectedConv.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ status: 'open' }),
                                                });
                                                setConversations(prev => prev.map(c =>
                                                    c.id === selectedConv.id ? { ...c, status: 'assigned' as ConvStatus } : c
                                                ));
                                            } catch { /* silent */ }
                                        }}
                                        className="px-3 py-1.5 text-[12px] font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        Takeover
                                    </button>
                                )}
                                {selectedConv.status === 'assigned' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/conversations/${selectedConv.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ status: 'resolved' }),
                                                });
                                                setConversations(prev => prev.map(c =>
                                                    c.id === selectedConv.id ? { ...c, status: 'resolved' as ConvStatus } : c
                                                ));
                                            } catch { /* silent */ }
                                        }}
                                        className="px-3 py-1.5 text-[12px] font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        ✓ Resolve
                                    </button>
                                )}
                                {selectedConv.status === 'resolved' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/conversations/${selectedConv.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ status: 'open' }),
                                                });
                                                setConversations(prev => prev.map(c =>
                                                    c.id === selectedConv.id ? { ...c, status: 'assigned' as ConvStatus } : c
                                                ));
                                            } catch { /* silent */ }
                                        }}
                                        className="px-3 py-1.5 text-[12px] font-semibold text-[#6B7280] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors"
                                    >
                                        ↩ Reopen
                                    </button>
                                )}
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280]">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {displayMessages.map(msg => (
                                <ChatBubble key={msg.id} msg={msg} />
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-white border-t border-[#E5E7EB] flex-shrink-0">
                            {/* Reply / Private Note toggle */}
                            <div className="flex items-center border-b border-[#F3F4F6]">
                                <button
                                    onClick={() => setInputMode('reply')}
                                    className={`px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${inputMode === 'reply' ? 'border-primary text-primary' : 'border-transparent text-[#6B7280]'
                                        }`}
                                >
                                    Reply
                                </button>
                                <button
                                    onClick={() => setInputMode('note')}
                                    className={`px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${inputMode === 'note' ? 'border-[#F59E0B] text-[#92400E]' : 'border-transparent text-[#6B7280]'
                                        }`}
                                >
                                    Private Note
                                </button>
                            </div>

                            {/* Input + tools */}
                            <div className={`p-3 ${inputMode === 'note' ? 'bg-[#FFFBEB]' : ''}`}>
                                <textarea
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder={inputMode === 'reply' ? 'Type a message...' : 'Write a private note for your team...'}
                                    className={`w-full text-[13px] resize-none h-16 focus:outline-none bg-transparent placeholder:text-[#9CA3AF]`}
                                />
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-1">
                                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#9CA3AF]">
                                            <Paperclip className="w-4 h-4" />
                                        </button>
                                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#9CA3AF]">
                                            <Smile className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !messageText.trim()}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${inputMode === 'note'
                                            ? 'bg-[#F59E0B] hover:bg-[#D97706]'
                                            : 'bg-primary hover:bg-primary-hover'
                                            }`}
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        {sending ? 'Sending...' : inputMode === 'note' ? 'Send Note' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════
                        Panel 3: Conversation Details (kanan)
                    ═══════════════════════════════════════════ */}
                    <DetailsPanel conv={selectedConv} />
                </>
            )}
        </div>
    );
}
