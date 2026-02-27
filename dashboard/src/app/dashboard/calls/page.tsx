'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Download, ChevronDown, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Calls Page — Table dengan tab filter dan pagination
   Mirip chat.cekat.ai/calls
   
   Layout:
   - Header: "Calls" + Search + Filter + Sort + Export
   - Tabs: All | Incoming call | Outgoing call | Missed call | Cancelled
   - Table: Customer, Phone, Type, Duration, Date, Status, Agent
   - Footer: Showing X of Y results + Previous/Next
   ═══════════════════════════════════════════════════ */

type CallType = 'incoming' | 'outgoing' | 'missed' | 'cancelled';

type Call = {
    id: string;
    customer: string;
    phone: string;
    type: CallType;
    duration: string;
    date: string;
    agent: string;
    status: 'completed' | 'missed' | 'cancelled';
};

// Data contoh panggilan
const sampleCalls: Call[] = [
    { id: '1', customer: 'Budi Santoso', phone: '0812-3456-7890', type: 'incoming', duration: '3:42', date: '27 Feb 2026, 14:23', agent: 'Cika (AI)', status: 'completed' },
    { id: '2', customer: 'Ani Wijaya', phone: '0856-7890-1234', type: 'outgoing', duration: '1:15', date: '27 Feb 2026, 13:10', agent: 'CS 1', status: 'completed' },
    { id: '3', customer: 'Dedi Mulyadi', phone: '0821-1122-3344', type: 'missed', duration: '-', date: '27 Feb 2026, 11:05', agent: '-', status: 'missed' },
    { id: '4', customer: 'Siti Rahayu', phone: '0877-5566-7788', type: 'incoming', duration: '7:30', date: '26 Feb 2026, 16:45', agent: 'CS 2', status: 'completed' },
    { id: '5', customer: 'Hendra Gunawan', phone: '0833-9900-1122', type: 'cancelled', duration: '-', date: '26 Feb 2026, 15:30', agent: '-', status: 'cancelled' },
    { id: '6', customer: 'Dewi Lestari', phone: '0815-3344-5566', type: 'outgoing', duration: '2:55', date: '26 Feb 2026, 10:20', agent: 'CS 1', status: 'completed' },
    { id: '7', customer: 'Irwan Kusuma', phone: '0858-2233-4455', type: 'incoming', duration: '5:10', date: '25 Feb 2026, 09:15', agent: 'Cika (AI)', status: 'completed' },
    { id: '8', customer: 'Maya Sari', phone: '0822-6677-8899', type: 'missed', duration: '-', date: '25 Feb 2026, 08:50', agent: '-', status: 'missed' },
];

type TabKey = 'all' | CallType;

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Phone className="w-3.5 h-3.5" /> },
    { key: 'incoming', label: 'Incoming call', icon: <PhoneIncoming className="w-3.5 h-3.5" /> },
    { key: 'outgoing', label: 'Outgoing call', icon: <PhoneOutgoing className="w-3.5 h-3.5" /> },
    { key: 'missed', label: 'Missed call', icon: <PhoneMissed className="w-3.5 h-3.5" /> },
    { key: 'cancelled', label: 'Cancelled', icon: <PhoneOff className="w-3.5 h-3.5" /> },
];

// Warna/style per tipe panggilan
const typeConfig: Record<CallType, { label: string; cls: string }> = {
    incoming: { label: 'Incoming', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
    outgoing: { label: 'Outgoing', cls: 'bg-green-50 text-green-700 border border-green-200' },
    missed: { label: 'Missed', cls: 'bg-red-50 text-red-600 border border-red-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

const PAGE_SIZE = 50;

export default function CallsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [search, setSearch] = useState('');

    // Filter data berdasarkan tab aktif dan search
    const filtered = sampleCalls.filter(c => {
        const matchTab = activeTab === 'all' || c.type === activeTab;
        const matchSearch = search === '' ||
            c.customer.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search);
        return matchTab && matchSearch;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 bg-[#F9FAFB]">
                <h1 className="text-[22px] font-bold text-foreground">Calls</h1>
                <div className="flex items-center gap-2">
                    {/* Search Customer */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search Customer"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-3 py-1.5 w-52 text-[13px] border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-[#9CA3AF]"
                        />
                    </div>
                    {/* Filter By */}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F9FAFB] transition-colors">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        Filter By
                        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    </button>
                    {/* Newest Call */}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F9FAFB] transition-colors">
                        <svg className="w-3.5 h-3.5 text-[#9CA3AF]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                            <path d="M8 4v4l2.5 2.5M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" strokeLinecap="round" />
                        </svg>
                        Newest Call
                        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    </button>
                    {/* Export */}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#374151] border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F9FAFB] transition-colors">
                        <Download className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        Export
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-0 px-6 mt-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[#6B7280] hover:text-foreground'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-auto px-6 pt-4">
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Customer</th>
                                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Phone</th>
                                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Type</th>
                                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Duration</th>
                                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Date</th>
                                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280]">Agent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-[#9CA3AF]">
                                        No data available
                                    </td>
                                </tr>
                            )}
                            {filtered.map((call, i) => (
                                <tr
                                    key={call.id}
                                    className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''
                                        }`}
                                >
                                    <td className="px-4 py-3 font-medium text-foreground">{call.customer}</td>
                                    <td className="px-4 py-3 text-[#6B7280]">{call.phone}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeConfig[call.type].cls}`}>
                                            {typeConfig[call.type].label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[#6B7280]">{call.duration}</td>
                                    <td className="px-4 py-3 text-[#6B7280]">{call.date}</td>
                                    <td className="px-4 py-3 text-[#6B7280]">{call.agent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination Footer ── */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex-shrink-0">
                <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                    <span>Showing</span>
                    <select className="border border-[#E5E7EB] rounded-lg px-2 py-1 text-[13px] text-foreground bg-white focus:outline-none">
                        <option>50</option>
                        <option>25</option>
                        <option>10</option>
                    </select>
                    <span>of {filtered.length} results</span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-[#6B7280] border border-[#E5E7EB] rounded-lg bg-white hover:bg-[#F3F4F6] transition-colors disabled:opacity-40" disabled>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 10.5L5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Previous
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-[#6B7280] border border-[#E5E7EB] rounded-lg bg-white hover:bg-[#F3F4F6] transition-colors disabled:opacity-40" disabled>
                        Next
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 3.5L9 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
