'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, SlidersHorizontal, Download, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    MoreHorizontal, X, Pencil, Users, Send,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Conversations Page — Persis chat.cekat.ai/contacts?activeTab=conversation
   
   Penjelasan layout dari screenshot referensi:
   
   ┌─────────────────────────────────────────────────────────────┐
   │  Conversation              [Search] [Filter] [Recipient/   │
   │                             Campaign][Edit Selected][Export]│
   │                             [Action ▾]                     │
   ├────┬──────────┬────────┬──────────┬──────┬─────────┬───────┤
   │ □  │ Name  ↕  │Inbox ↕ │Phone   ↕ │Note ↕│Label ↕  │Pipeln │Action│
   ├────┼──────────┼────────┼──────────┼──────┼─────────┼───────┤
   │    │          │        │          │      │         │       │
   │    │  (data rows / empty state)                    │       │
   ├────┴──────────┴────────┴──────────┴──────┴─────────┴───────┤
   │ Total Data: N   |  << < [1] > >>  | Show per Page: 100 ▾  │
   └─────────────────────────────────────────────────────────────┘
   
   Fitur:
   1. Sortable columns (klik header → ascending/descending)
   2. Checkbox row selection (select all / individual)
   3. Search bar
   4. Filter modal (Date Range, Inbox, Label, etc.)
   5. Pagination (page nav + rows per page dropdown)
   6. Action menu per row (View, Edit, Delete)
   7. Bulk actions (Edit Selected)
   8. Export functionality
   ═══════════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────

type SortDir = 'asc' | 'desc' | null;
type SortKey = 'name' | 'inbox' | 'phone' | 'note' | 'labelNames' | 'pipelineStatus';

interface ConversationRow {
    id: string;
    name: string;
    inbox: string;
    phone: string;
    note: string;
    labelNames: string[];
    pipelineStatus: string;
}

// ──────────────────────────────────────────────────
// SAMPLE DATA — Contoh data conversations
// ──────────────────────────────────────────────────

const sampleData: ConversationRow[] = [
    {
        id: '1',
        name: 'Budi Santoso',
        inbox: 'WhatsApp',
        phone: '+6281234567890',
        note: 'Follow up order #12345',
        labelNames: ['VIP', 'Order'],
        pipelineStatus: 'Follow Up',
    },
    {
        id: '2',
        name: 'Ani Wijaya',
        inbox: 'Instagram',
        phone: '+6285678901234',
        note: 'Tanya warna earphone',
        labelNames: ['Inquiry'],
        pipelineStatus: 'New Lead',
    },
    {
        id: '3',
        name: 'Dedi Mulyadi',
        inbox: 'WhatsApp',
        phone: '+6282111223344',
        note: 'Komplain barang rusak',
        labelNames: ['Complaint'],
        pipelineStatus: 'Pending',
    },
    {
        id: '4',
        name: 'Siti Rahayu',
        inbox: 'Web Chat',
        phone: '+6287755667788',
        note: '',
        labelNames: [],
        pipelineStatus: 'New Lead',
    },
    {
        id: '5',
        name: 'Hendra Gunawan',
        inbox: 'WhatsApp',
        phone: '+6283399001122',
        note: 'Order Samsung A15 completed',
        labelNames: ['Order', 'Completed'],
        pipelineStatus: 'Closed Won',
    },
    {
        id: '6',
        name: 'Rina Marlina',
        inbox: 'Instagram',
        phone: '+6285544332211',
        note: 'Minta katalog produk terbaru',
        labelNames: ['Inquiry'],
        pipelineStatus: 'New Lead',
    },
    {
        id: '7',
        name: 'Agus Prabowo',
        inbox: 'WhatsApp',
        phone: '+6281199887766',
        note: 'Nego harga grosir',
        labelNames: ['B2B', 'Negotiation'],
        pipelineStatus: 'Negotiation',
    },
    {
        id: '8',
        name: 'Dewi Lestari',
        inbox: 'Facebook',
        phone: '+6289900112233',
        note: 'Tanya garansi produk',
        labelNames: ['Support'],
        pipelineStatus: 'Follow Up',
    },
    {
        id: '9',
        name: 'Bambang Suryadi',
        inbox: 'WhatsApp',
        phone: '+6282255443311',
        note: 'Return produk cacat',
        labelNames: ['Complaint', 'Return'],
        pipelineStatus: 'Pending',
    },
    {
        id: '10',
        name: 'Fitri Handayani',
        inbox: 'Web Chat',
        phone: '+6287766554433',
        note: 'Tanya jam operasional',
        labelNames: [],
        pipelineStatus: 'New Lead',
    },
];

// ──────────────────────────────────────────────────
// FILTER MODAL
// ──────────────────────────────────────────────────

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
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Inbox</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white">
                            <option>All Inboxes</option>
                            <option>WhatsApp</option>
                            <option>Instagram</option>
                            <option>Web Chat</option>
                            <option>Facebook</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Label</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white">
                            <option>All Labels</option>
                            <option>VIP</option>
                            <option>Order</option>
                            <option>Complaint</option>
                            <option>Inquiry</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Pipeline Status</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white">
                            <option>All Statuses</option>
                            <option>New Lead</option>
                            <option>Follow Up</option>
                            <option>Negotiation</option>
                            <option>Pending</option>
                            <option>Closed Won</option>
                            <option>Closed Lost</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Agent</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-white">
                            <option>All Agents</option>
                            <option>CS 1</option>
                            <option>CS 2</option>
                            <option>Cika (AI)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Note</label>
                        <input
                            type="text"
                            placeholder="Search by note..."
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary"
                        />
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

// ──────────────────────────────────────────────────
// ACTION DROPDOWN (per row)
// ──────────────────────────────────────────────────

function RowActionMenu({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-30 py-1"
        >
            <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-foreground hover:bg-[#F3F4F6] flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                View Chat
            </button>
            <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-foreground hover:bg-[#F3F4F6] flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Edit Note
            </button>
            <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-foreground hover:bg-[#F3F4F6] flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Send Message
            </button>
            <hr className="my-1 border-[#F3F4F6]" />
            <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-red-500 hover:bg-red-50 flex items-center gap-2">
                <X className="w-3.5 h-3.5" />
                Delete
            </button>
        </motion.div>
    );
}

// ──────────────────────────────────────────────────
// SORT ICON — header column sort indicator
// ──────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
    return (
        <span className="inline-flex flex-col ml-1">
            <ChevronUp className={`w-3 h-3 -mb-1 ${dir === 'asc' ? 'text-primary' : 'text-[#D1D5DB]'}`} />
            <ChevronDown className={`w-3 h-3 ${dir === 'desc' ? 'text-primary' : 'text-[#D1D5DB]'}`} />
        </span>
    );
}

// ──────────────────────────────────────────────────
// PIPELINE STATUS BADGE — warna berbeda tiap status
// ──────────────────────────────────────────────────

/** Penjelasan: setiap pipeline status punya warna khasnya sendiri
 *  sehingga user bisa langsung mengenali stage dari visual */
const pipelineColors: Record<string, { bg: string; text: string; border: string }> = {
    'New Lead': { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
    'Follow Up': { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
    'Negotiation': { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
    'Pending': { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
    'Closed Won': { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
    'Closed Lost': { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

function PipelineBadge({ status }: { status: string }) {
    const c = pipelineColors[status] || pipelineColors['Pending'];
    return (
        <span
            className="px-2 py-0.5 text-[11px] font-medium rounded-full border"
            style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
        >
            {status}
        </span>
    );
}

// ──────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────

export default function ConversationsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState(false);

    // ── Sorting logic ──
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Toggle: asc → desc → null
            if (sortDir === 'asc') setSortDir('desc');
            else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    // ── Filter + Sort data ──
    const processedData = useMemo(() => {
        let data = [...sampleData];

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.phone.includes(q) ||
                r.inbox.toLowerCase().includes(q) ||
                r.note.toLowerCase().includes(q) ||
                r.labelNames.some(l => l.toLowerCase().includes(q))
            );
        }

        // Sort
        if (sortKey && sortDir) {
            data.sort((a, b) => {
                let va = ''; let vb = '';
                if (sortKey === 'labelNames') {
                    va = a.labelNames.join(', ');
                    vb = b.labelNames.join(', ');
                } else {
                    va = a[sortKey];
                    vb = b[sortKey];
                }
                const cmp = va.localeCompare(vb);
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }

        return data;
    }, [searchQuery, sortKey, sortDir]);

    // ── Pagination ──
    const totalData = processedData.length;
    const totalPages = Math.max(1, Math.ceil(totalData / rowsPerPage));
    const pagedData = processedData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // ── Selection ──
    const allSelected = pagedData.length > 0 && pagedData.every(r => selectedIds.has(r.id));

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pagedData.map(r => r.id)));
        }
    };

    const toggleOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    // ── Table columns config ──
    const columns: { key: SortKey; label: string; width: string }[] = [
        { key: 'name', label: 'Name', width: 'w-[180px]' },
        { key: 'inbox', label: 'Inbox', width: 'w-[120px]' },
        { key: 'phone', label: 'Phone', width: 'w-[160px]' },
        { key: 'note', label: 'Note', width: 'w-[200px]' },
        { key: 'labelNames', label: 'Label Names', width: 'w-[160px]' },
        { key: 'pipelineStatus', label: 'Pipeline Status', width: 'w-[130px]' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
            <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />

            {/* ═══════════════════════════════════════
                Toolbar — persis cekat.ai screenshot
                Title kiri, action buttons kanan
            ═══════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                <h1 className="text-[20px] font-bold text-primary">Conversation</h1>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder="Search"
                            className="pl-8 pr-3 py-2 w-[180px] text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary placeholder:text-[#9CA3AF]"
                        />
                    </div>

                    {/* Filter */}
                    <button
                        onClick={() => setFilterOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7280]" />
                        Filter
                    </button>

                    {/* Recipient/Campaign */}
                    <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                        <Users className="w-3.5 h-3.5 text-[#6B7280]" />
                        Recipient/Campaign
                    </button>

                    {/* Edit Selected */}
                    <button
                        disabled={selectedIds.size === 0}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border rounded-lg ${selectedIds.size > 0
                                ? 'text-primary border-primary hover:bg-[#EEF2FF]'
                                : 'text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                            }`}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Selected{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </button>

                    {/* Export */}
                    <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                        <Download className="w-3.5 h-3.5 text-[#6B7280]" />
                        Export
                    </button>

                    {/* Action dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setActionMenuOpen(!actionMenuOpen)}
                            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
                        >
                            Action
                            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        </button>
                        <AnimatePresence>
                            {actionMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-30 py-1"
                                >
                                    <button onClick={() => setActionMenuOpen(false)} className="w-full text-left px-3 py-2 text-[12.5px] text-foreground hover:bg-[#F3F4F6]">
                                        Import Contacts
                                    </button>
                                    <button onClick={() => setActionMenuOpen(false)} className="w-full text-left px-3 py-2 text-[12.5px] text-foreground hover:bg-[#F3F4F6]">
                                        Merge Duplicates
                                    </button>
                                    <button onClick={() => setActionMenuOpen(false)} className="w-full text-left px-3 py-2 text-[12.5px] text-foreground hover:bg-[#F3F4F6]">
                                        Delete Selected
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                Table — sortable columns, checkbox rows
            ═══════════════════════════════════════ */}
            <div className="flex-1 overflow-auto px-6 pt-2">
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E5E7EB]">
                                {/* Checkbox header */}
                                <th className="w-[48px] px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-[#D1D5DB] text-primary focus:ring-primary cursor-pointer"
                                    />
                                </th>
                                {/* Column headers with sort */}
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className={`${col.width} px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-foreground select-none`}
                                    >
                                        <span className="flex items-center">
                                            {col.label}
                                            <SortIcon dir={sortKey === col.key ? sortDir : null} />
                                        </span>
                                    </th>
                                ))}
                                {/* Action column */}
                                <th className="w-[80px] px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 2} className="px-6 py-16 text-center">
                                        <h3 className="text-[15px] font-semibold text-foreground mb-1">No conversations found</h3>
                                        <p className="text-[13px] text-[#9CA3AF]">No conversations available at the moment.</p>
                                    </td>
                                </tr>
                            ) : (
                                pagedData.map(row => (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors ${selectedIds.has(row.id) ? 'bg-[#EEF2FF]' : ''
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(row.id)}
                                                onChange={() => toggleOne(row.id)}
                                                className="w-4 h-4 rounded border-[#D1D5DB] text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </td>

                                        {/* Name */}
                                        <td className="px-3 py-3">
                                            <span className="text-[13px] font-medium text-foreground">{row.name}</span>
                                        </td>

                                        {/* Inbox */}
                                        <td className="px-3 py-3">
                                            <span className="text-[12.5px] text-[#6B7280]">{row.inbox}</span>
                                        </td>

                                        {/* Phone */}
                                        <td className="px-3 py-3">
                                            <span className="text-[12.5px] text-[#6B7280] font-mono">{row.phone}</span>
                                        </td>

                                        {/* Note */}
                                        <td className="px-3 py-3">
                                            <span className="text-[12.5px] text-[#6B7280] truncate block max-w-[200px]">{row.note || '-'}</span>
                                        </td>

                                        {/* Label Names */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {row.labelNames.length > 0 ? (
                                                    row.labelNames.map(l => (
                                                        <span key={l} className="px-1.5 py-0.5 text-[10px] font-medium bg-[#EEF2FF] text-primary border border-[#C7D2FE] rounded">
                                                            {l}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[12px] text-[#D1D5DB]">-</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Pipeline Status */}
                                        <td className="px-3 py-3">
                                            <PipelineBadge status={row.pipelineStatus} />
                                        </td>

                                        {/* Action */}
                                        <td className="px-3 py-3">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenActionId(openActionId === row.id ? null : row.id)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF]"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                                <AnimatePresence>
                                                    {openActionId === row.id && (
                                                        <RowActionMenu onClose={() => setOpenActionId(null)} />
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                Pagination Bar — persis cekat.ai
                Total Data: N  | << < [page] > >> | Show per Page: N ▾
            ═══════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-[#E5E7EB] flex-shrink-0">
                {/* Total Data */}
                <span className="text-[13px] text-[#6B7280]">
                    Total Data: <span className="font-semibold text-foreground">{totalData}</span>
                </span>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronsLeft className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <span className="w-8 h-8 flex items-center justify-center rounded border border-primary bg-white text-[13px] font-semibold text-primary">
                        {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronsRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                </div>

                {/* Rows per Page */}
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#6B7280]">Show per Page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-primary"
                    >
                        <option value={10}>10 rows</option>
                        <option value={25}>25 rows</option>
                        <option value={50}>50 rows</option>
                        <option value={100}>100 rows</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
