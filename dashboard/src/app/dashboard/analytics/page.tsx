'use client';

import { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Analytics Page — mirip chat.cekat.ai analytics
   
   Layout:
   - Header: "Analytics" + Sub-tabs (Session | AI Agent | Human Agent) + Old Analytics btn
   - Filter Bar: All Inbox + Date Range
   - 2x2 Chart Cards: First Customer Session, Returning Customer Session  
   - 3 Summary Cards: Session Source, Resolution Rate, Session Label
   ═══════════════════════════════════════════════════ */

type AnalyticsTab = 'session' | 'ai_agent' | 'human_agent';

// Komponen mini line chart (SVG sederhana untuk empty state)
function EmptyChart({ label }: { label: string }) {
    return (
        <div className="relative h-40 flex items-end">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-full pr-3 text-[11px] text-[#9CA3AF] text-right">
                <span>30</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
            </div>
            {/* Chart area */}
            <div className="flex-1 relative border-l border-b border-[#E5E7EB]">
                {/* Empty state overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <p className="text-[13px] font-semibold text-foreground">No Data Available</p>
                    <p className="text-[12px] text-[#9CA3AF]">There are no charts or data for selected date.</p>
                </div>
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-40">
                    {[0, 1, 2].map(i => <div key={i} className="border-t border-dashed border-[#E5E7EB] w-full" />)}
                </div>
            </div>
        </div>
    );
}

// X-axis dates
function XAxis() {
    const dates = ['Feb 20', 'Feb 21', 'Feb 22', 'Feb 23', 'Feb 24', 'Feb 25', 'Feb 26', 'Feb 27'];
    return (
        <div className="flex justify-between px-10 mt-1">
            {dates.map(d => (
                <span key={d} className="text-[10px] text-[#9CA3AF]">{d}</span>
            ))}
        </div>
    );
}

// Scrollbar for chart (UI dekoratif)
function ScrollBar() {
    return (
        <div className="flex items-center gap-2 px-4 mt-2">
            <button className="w-4 h-4 flex items-center justify-center text-[#9CA3AF]">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M6 2L4 5l2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
            <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full">
                <div className="h-full w-3/4 bg-[#D1D5DB] rounded-full" />
            </div>
            <button className="w-4 h-4 flex items-center justify-center text-[#9CA3AF]">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M4 2l2 3-2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
        </div>
    );
}

// Kartu chart besar (First Customer Session / Returning Customer Session)
function BigChartCard({ title }: { title: string }) {
    return (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[15px] font-semibold text-foreground">{title}</span>
                <Info className="w-3.5 h-3.5 text-primary cursor-pointer" />
            </div>
            <p className="text-[13px] text-[#6B7280] mb-4">
                <span className="text-[22px] font-bold text-foreground">0</span> Total Sessions
            </p>
            <EmptyChart label={title} />
            <XAxis />
            <ScrollBar />
        </div>
    );
}

// Kartu summary kecil (Session Source, Resolution Rate, Session Label)
function SummaryCard({ title, value, unit }: { title: string; value: number; unit: string }) {
    return (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[14px] font-semibold text-foreground">{title}</span>
                <Info className="w-3.5 h-3.5 text-primary cursor-pointer" />
            </div>
            <p className="text-[13px] text-[#6B7280]">
                <span className="text-[22px] font-bold text-foreground">{value}</span> {unit}
            </p>
            <div className="mt-6 flex items-center justify-center h-20 text-[12px] text-[#9CA3AF]">
                No data available
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('session');

    const tabList: { key: AnalyticsTab; label: string }[] = [
        { key: 'session', label: 'Session' },
        { key: 'ai_agent', label: 'AI Agent' },
        { key: 'human_agent', label: 'Human Agent' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB] overflow-y-auto">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 bg-[#F9FAFB]">
                <div className="flex items-center gap-6">
                    <h1 className="text-[22px] font-bold text-foreground">Analytics</h1>
                    {/* Sub-tabs inline dengan judul */}
                    <div className="flex items-center border-b border-[#E5E7EB]">
                        {tabList.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-[#6B7280] hover:text-foreground'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="px-4 py-1.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors">
                    Old Analytics
                </button>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 px-6 py-4">
                {/* All Inbox */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="1" y="3" width="12" height="9" rx="1.5" />
                        <path d="M1 5.5l6 4 6-4" />
                    </svg>
                    All Inbox
                    <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
                {/* Date Range */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="1" y="2" width="12" height="11" rx="1.5" />
                        <path d="M1 5h12M4 1v2M10 1v2" strokeLinecap="round" />
                    </svg>
                    Feb 20, 2026 ~ Feb 27, 2026
                    <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
                {/* Info icon */}
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors">
                    i
                </button>
            </div>

            {/* ── Content area ── */}
            <div className="flex-1 px-6 pb-6 space-y-4">
                {/* Row 1: 2 big chart cards */}
                <div className="grid grid-cols-2 gap-4">
                    <BigChartCard title="First Customer Session" />
                    <BigChartCard title="Returning Customer Session" />
                </div>

                {/* Row 2: 3 summary cards */}
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard title="Session Source" value={0} unit="Total Sessions" />
                    <SummaryCard title="Session Resolution Rate" value={0} unit="Total Sessions" />
                    <SummaryCard title="Session Label" value={0} unit="Total label assigned" />
                </div>
            </div>
        </div>
    );
}
