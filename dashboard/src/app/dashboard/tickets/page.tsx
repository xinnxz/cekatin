'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Plus, LayoutGrid, List, MoreVertical } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Tickets Page — Kanban Board (mirip chat.cekat.ai/tickets)
   
   Layout:
   - Toolbar: Kanban/List toggle | Default Board | Search | Filter | Sort | Create Ticket
   - Content: Kanban board dengan kolom-kolom status
   - Setiap kolom bisa punya banyak ticket card
   ═══════════════════════════════════════════════════ */

// Tipe data untuk ticket
type Ticket = {
    id: string;
    title: string;
    customer: string;
    priority: 'high' | 'medium' | 'low';
    assignee: string;
    createdAt: string;
};

// Tipe data untuk kolom kanban
type KanbanColumn = {
    id: string;
    title: string;
    tickets: Ticket[];
};

// Data contoh kolom kanban (persis seperti cekat.ai — ada kolom Done + Add Status)
const initialColumns: KanbanColumn[] = [
    {
        id: 'open',
        title: 'Open',
        tickets: [
            { id: 't1', title: 'Keluhan produk rusak', customer: 'Budi Santoso', priority: 'high', assignee: 'CS 1', createdAt: '27 Feb 2026' },
            { id: 't2', title: 'Pertanyaan garansi', customer: 'Ani Wijaya', priority: 'medium', assignee: 'CS 2', createdAt: '26 Feb 2026' },
        ],
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        tickets: [
            { id: 't3', title: 'Retur barang Samsung', customer: 'Dedi Mulyadi', priority: 'high', assignee: 'CS 1', createdAt: '25 Feb 2026' },
        ],
    },
    {
        id: 'done',
        title: 'Done',
        tickets: [],
    },
];

// Warna badge priority
const priorityConfig = {
    high: { label: 'High', cls: 'bg-red-50 text-red-600 border border-red-200' },
    medium: { label: 'Medium', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
    low: { label: 'Low', cls: 'bg-green-50 text-green-700 border border-green-200' },
};

export default function TicketsPage() {
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [columns] = useState<KanbanColumn[]>(initialColumns);
    const [search, setSearch] = useState('');

    const totalTickets = columns.reduce((sum, col) => sum + col.tickets.length, 0);

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-[#E5E7EB] flex-shrink-0">

                {/* View Toggle */}
                <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
                    <button
                        onClick={() => setView('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors ${view === 'kanban' ? 'bg-[#F3F4F6] text-foreground' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                            }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Kanban View
                    </button>
                    <div className="w-px h-6 bg-[#E5E7EB]" />
                    <button
                        onClick={() => setView('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors ${view === 'list' ? 'bg-[#F3F4F6] text-foreground' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                            }`}
                    >
                        <List className="w-3.5 h-3.5" />
                        List View
                    </button>
                </div>

                {/* Default Board */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <LayoutGrid className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    Default Board
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#9CA3AF]">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Search — grows to fill */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                    <input
                        type="text"
                        placeholder="Search Tickets"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-[#9CA3AF]"
                    />
                </div>

                {/* Filter By */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    Filter By
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#9CA3AF]">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Sort By */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    Sort By
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#9CA3AF]">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Create Ticket */}
                <button className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Create Ticket
                </button>
            </div>

            {/* ── Kanban Board ── */}
            {view === 'kanban' && (
                <div className="flex-1 overflow-x-auto p-5">
                    <div className="flex gap-4 h-full min-w-max">
                        {columns.map(col => (
                            <div key={col.id} className="w-[300px] flex flex-col flex-shrink-0">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-3 py-2.5 bg-[#F3F4F6] rounded-t-xl border border-b-0 border-[#E5E7EB]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-semibold text-foreground">{col.title}</span>
                                        <span className="min-w-[20px] h-5 px-1.5 bg-white border border-[#E5E7EB] rounded-full text-[11px] font-medium text-[#6B7280] flex items-center justify-center">
                                            {col.tickets.length}
                                        </span>
                                    </div>
                                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white transition-colors text-[#9CA3AF]">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Column Body */}
                                <div className="flex-1 bg-[#F3F4F6] border border-t-0 border-[#E5E7EB] rounded-b-xl p-2 space-y-2 min-h-[400px]">
                                    {col.tickets.length === 0 && (
                                        <div className="flex items-center justify-center h-24 text-[12px] text-[#9CA3AF]">
                                            No tickets
                                        </div>
                                    )}
                                    {col.tickets.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            className="bg-white rounded-lg border border-[#E5E7EB] p-3 cursor-pointer hover:shadow-sm hover:border-[#C7D2FE] transition-all"
                                        >
                                            <p className="text-[13px] font-medium text-foreground mb-2 leading-snug">{ticket.title}</p>
                                            <p className="text-[11.5px] text-[#6B7280] mb-3">{ticket.customer}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityConfig[ticket.priority].cls}`}>
                                                    {priorityConfig[ticket.priority].label}
                                                </span>
                                                <span className="text-[11px] text-[#9CA3AF]">{ticket.createdAt}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Add Status column */}
                        <div className="w-[200px] flex-shrink-0">
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-dashed border-[#D1D5DB] rounded-xl text-[13px] font-medium text-[#6B7280] hover:border-primary hover:text-primary transition-all">
                                <Plus className="w-4 h-4" />
                                Add Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── List View ── */}
            {view === 'list' && (
                <div className="flex-1 overflow-auto p-5">
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Ticket</th>
                                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Customer</th>
                                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Priority</th>
                                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Status</th>
                                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Assignee</th>
                                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {columns.flatMap(col =>
                                    col.tickets.map(ticket => (
                                        <tr key={ticket.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground">{ticket.title}</td>
                                            <td className="px-4 py-3 text-[#6B7280]">{ticket.customer}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityConfig[ticket.priority].cls}`}>
                                                    {priorityConfig[ticket.priority].label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#6B7280]">{col.title}</td>
                                            <td className="px-4 py-3 text-[#6B7280]">{ticket.assignee}</td>
                                            <td className="px-4 py-3 text-[#6B7280]">{ticket.createdAt}</td>
                                        </tr>
                                    ))
                                )}
                                {totalTickets === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-[#9CA3AF]">No tickets found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
