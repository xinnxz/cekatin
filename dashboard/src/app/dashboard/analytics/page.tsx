'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronDown, Calendar, Info, Clock, Shield, TrendingUp,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Analytics Page — Persis cekat.ai "New Analytics"
   
   Penjelasan layout dari screenshot referensi user:
   
   ┌──────────────────────────────────────────────────────┐
   │ Analytics  [Session] [AI Agent] [Human Agent]  [Old] │
   │ [All Inbox ▾]  [📅 Feb 20 - Feb 27, 2026 ▾]  ⓘ     │
   ├───────────────────────┬──────────────────────────────┤
   │ First Customer Session│ Returning Customer Session   │
   │ (line chart)          │ (line chart)                 │
   ├──────────┬────────────┬─────────────────────────────┤
   │ Session  │ Session    │ Session Label               │
   │ Source   │ Resolution │                             │
   │ (donut)  │ Rate(donut)│ (donut)                     │
   ├──────────┴────────────┴─────────────────────────────┤
   │ Historical MAU        │ Session Status              │
   │ (line chart)          │ (donut)                     │
   ├──────────────────────────────────────────────────────┤
   │ Session Performance                                 │
   │ [Avg Session] [Avg AI] [Avg Agent]  [SLA In] [Out]  │
   ├──────────────────────────────────────────────────────┤
   │ Session List (table with 12 columns)                │
   └──────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────

type AnalyticsTab = 'session' | 'ai_agent' | 'human_agent';

// ──────────────────────────────────────────────────
// MINI CHART COMPONENTS — SVG line charts & donuts
// ──────────────────────────────────────────────────

/**
 * LineChart — Mini SVG line chart dengan date axis
 * Dibuat custom (bukan library) agar lightweight
 * dan bisa dikontrol pixel-level
 */
function LineChart({ data, width = 420, height = 120, color = '#3B82F6' }: {
    data: { label: string; value: number }[];
    width?: number;
    height?: number;
    color?: string;
}) {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const padding = { top: 10, right: 10, bottom: 28, left: 36 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = data.map((d, i) => ({
        x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
        y: padding.top + chartH - (d.value / maxVal) * chartH,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = pathD + ` L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

    // Y-axis labels (3 ticks)
    const yTicks = [0, Math.round(maxVal / 2), maxVal];

    return (
        <svg width={width} height={height} className="w-full">
            {/* Grid lines */}
            {yTicks.map((tick, i) => {
                const y = padding.top + chartH - (tick / maxVal) * chartH;
                return (
                    <g key={i}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                            stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={padding.left - 6} y={y + 4} textAnchor="end"
                            className="text-[10px] fill-[#9CA3AF]">{tick}</text>
                    </g>
                );
            })}
            {/* Area fill */}
            <path d={areaD} fill={color} opacity="0.08" />
            {/* Line */}
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="1.5" />
            ))}
            {/* X-axis labels */}
            {data.map((d, i) => (
                <text key={i} x={points[i].x} y={height - 4} textAnchor="middle"
                    className="text-[9px] fill-[#9CA3AF]">{d.label}</text>
            ))}
        </svg>
    );
}

/**
 * DonutChart — SVG donut/ring chart
 * Untuk Session Source, Resolution Rate, Session Label, Session Status
 */
function DonutChart({ segments, size = 120 }: {
    segments: { label: string; value: number; color: string }[];
    size?: number;
}) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 12;
    const strokeW = 18;

    if (total === 0) return null;

    let startAngle = -90;
    const arcs = segments.map(seg => {
        const angle = (seg.value / total) * 360;
        const endAngle = startAngle + angle;
        const largeArc = angle > 180 ? 1 : 0;

        const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
        const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
        const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
        const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);

        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
        startAngle = endAngle;

        return { ...seg, d };
    });

    return (
        <svg width={size} height={size} className="mx-auto">
            {arcs.map((arc, i) => (
                <path key={i} d={arc.d} fill="none" stroke={arc.color}
                    strokeWidth={strokeW} strokeLinecap="round" />
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" className="text-[16px] font-bold fill-foreground">
                {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" className="text-[10px] fill-[#9CA3AF]">
                Total
            </text>
        </svg>
    );
}

// ──────────────────────────────────────────────────
// CHART CARD — container wrapper
// ──────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, className = '' }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-white border border-[#E5E7EB] rounded-xl p-5 ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            {subtitle && <p className="text-[12px] text-[#9CA3AF] mb-3">{subtitle}</p>}
            <div className="flex items-center justify-center min-h-[120px]">
                {children}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────
// NO DATA STATE — untuk chart kosong
// ──────────────────────────────────────────────────

function NoDataState() {
    return (
        <div className="text-center py-4">
            <p className="text-[13px] font-medium text-foreground mb-0.5">No Data Available</p>
            <p className="text-[11px] text-[#9CA3AF]">There are no charts or data for selected date.</p>
        </div>
    );
}

// ──────────────────────────────────────────────────
// SAMPLE DATA — demo data untuk chart
// ──────────────────────────────────────────────────

const dateLabels = ['Feb 20', 'Feb 21', 'Feb 22', 'Feb 23', 'Feb 24', 'Feb 25', 'Feb 26', 'Feb 27'];

const firstCustomerData = dateLabels.map(label => ({
    label,
    value: Math.floor(Math.random() * 15) + 2,
}));

const returningData = dateLabels.map(label => ({
    label,
    value: Math.floor(Math.random() * 10) + 1,
}));

const mauData = dateLabels.map(label => ({
    label,
    value: Math.floor(Math.random() * 25) + 10,
}));

const sessionSourceData = [
    { label: 'WhatsApp', value: 45, color: '#25D366' },
    { label: 'Instagram', value: 20, color: '#E1306C' },
    { label: 'Web Chat', value: 25, color: '#3B82F6' },
    { label: 'Facebook', value: 10, color: '#1877F2' },
];

const resolutionData = [
    { label: 'AI Resolved', value: 60, color: '#3B82F6' },
    { label: 'Human Resolved', value: 30, color: '#10B981' },
    { label: 'Unresolved', value: 10, color: '#EF4444' },
];

const labelData = [
    { label: 'VIP', value: 15, color: '#8B5CF6' },
    { label: 'Order', value: 25, color: '#3B82F6' },
    { label: 'Complaint', value: 10, color: '#EF4444' },
    { label: 'Inquiry', value: 35, color: '#F59E0B' },
    { label: 'Support', value: 15, color: '#10B981' },
];

const sessionStatusData = [
    { label: 'Assigned', value: 40, color: '#3B82F6' },
    { label: 'Unassigned', value: 20, color: '#F59E0B' },
    { label: 'Resolved', value: 35, color: '#10B981' },
    { label: 'Expired', value: 5, color: '#9CA3AF' },
];

// Session Performance data
const perfMetrics = [
    { label: 'Average Session Duration', value: '02h 15m 30s', icon: Clock },
    { label: 'Average AI Duration', value: '00h 08m 12s', icon: TrendingUp },
    { label: 'Average Agent Session Duration', value: '01h 45m 20s', icon: Clock },
    { label: 'SLA In', value: '85%', icon: Shield },
    { label: 'SLA Out', value: '12%', icon: Shield },
];

// Session List sample data
const sessionListData = [
    { name: 'Budi Santoso', platform: 'WhatsApp', inbox: 'ReonShop WA', phone: '+6281234567890', sessionNum: '#S-001', priority: 'High', agent: 'CS 1', createdAt: '27 Feb 10:30', handedTo: 'CS 1', resolvedAt: '27 Feb 11:15', aiDuration: '00:08:12', agentDuration: '00:37:00' },
    { name: 'Ani Wijaya', platform: 'Instagram', inbox: 'ReonShop IG', phone: '+6285678901234', sessionNum: '#S-002', priority: 'Medium', agent: 'Cika (AI)', createdAt: '27 Feb 09:15', handedTo: '-', resolvedAt: '27 Feb 09:23', aiDuration: '00:08:00', agentDuration: '-' },
    { name: 'Dedi Mulyadi', platform: 'WhatsApp', inbox: 'ReonShop WA', phone: '+6282111223344', sessionNum: '#S-003', priority: 'High', agent: 'CS 2', createdAt: '26 Feb 14:00', handedTo: 'CS 2', resolvedAt: '26 Feb 15:30', aiDuration: '00:05:00', agentDuration: '01:25:00' },
    { name: 'Siti Rahayu', platform: 'Web Chat', inbox: 'Website', phone: '+6287755667788', sessionNum: '#S-004', priority: 'Low', agent: 'Cika (AI)', createdAt: '26 Feb 11:00', handedTo: '-', resolvedAt: '26 Feb 11:05', aiDuration: '00:05:00', agentDuration: '-' },
    { name: 'Hendra Gunawan', platform: 'WhatsApp', inbox: 'ReonShop WA', phone: '+6283399001122', sessionNum: '#S-005', priority: 'Medium', agent: 'CS 1', createdAt: '25 Feb 16:45', handedTo: 'CS 1', resolvedAt: '25 Feb 17:30', aiDuration: '00:10:00', agentDuration: '00:35:00' },
];

// ──────────────────────────────────────────────────
// DONUT LEGEND
// ──────────────────────────────────────────────────

function DonutLegend({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    return (
        <div className="space-y-1.5 ml-4">
            {segments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-[#6B7280]">{seg.label}</span>
                    <span className="font-medium text-foreground ml-auto">
                        {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
                    </span>
                </div>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────────
// PRIORITY BADGE
// ──────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
    const colors: Record<string, string> = {
        High: 'bg-red-50 text-red-600 border-red-200',
        Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        Low: 'bg-green-50 text-green-600 border-green-200',
    };
    return (
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${colors[priority] || colors.Low}`}>
            {priority}
        </span>
    );
}

// ──────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('session');
    const [showData, setShowData] = useState(true); // toggle demo data
    const [currentPage, setCurrentPage] = useState(1);

    const tabs: { key: AnalyticsTab; label: string }[] = [
        { key: 'session', label: 'Session' },
        { key: 'ai_agent', label: 'AI Agent' },
        { key: 'human_agent', label: 'Human Agent' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
            {/* ═══════════════════════════════════════
                Header + Tabs — persis cekat.ai
            ═══════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                <div className="flex items-center gap-6">
                    <h1 className="text-[20px] font-bold text-foreground">Analytics</h1>
                    <div className="flex items-center">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-1.5 text-[13px] font-medium transition-colors relative ${activeTab === tab.key
                                        ? 'text-foreground'
                                        : 'text-[#9CA3AF] hover:text-foreground'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <motion.div layoutId="analytics-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => setShowData(!showData)}
                    className="px-4 py-1.5 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                    {showData ? 'Clear Data' : 'Load Demo Data'}
                </button>
            </div>

            {/* ═══════════════════════════════════════
                Filters — All Inbox + Date Range
            ═══════════════════════════════════════ */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6B7280" strokeWidth="1.3">
                        <rect x="2" y="3" width="12" height="10" rx="1.5" />
                        <path d="M5 1v3M11 1v3" strokeLinecap="round" />
                    </svg>
                    All Inbox
                    <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                    <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                    Feb 20, 2026 – Feb 27, 2026
                    <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center text-primary hover:bg-[#EEF2FF] rounded-full">
                    <Info className="w-4 h-4" />
                </button>
            </div>

            {/* ═══════════════════════════════════════
                Main Scrollable Content
            ═══════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                {/* ── Row 1: Line Charts (2 columns) ── */}
                <div className="grid grid-cols-2 gap-4">
                    <ChartCard title="First Customer Session" subtitle={`${showData ? firstCustomerData.reduce((s, d) => s + d.value, 0) : 0} Total Sessions`}>
                        {showData ? (
                            <LineChart data={firstCustomerData} color="#3B82F6" />
                        ) : <NoDataState />}
                    </ChartCard>
                    <ChartCard title="Returning Customer Session" subtitle={`${showData ? returningData.reduce((s, d) => s + d.value, 0) : 0} Total Sessions`}>
                        {showData ? (
                            <LineChart data={returningData} color="#10B981" />
                        ) : <NoDataState />}
                    </ChartCard>
                </div>

                {/* ── Row 2: Donut Charts (3 columns) ── */}
                <div className="grid grid-cols-3 gap-4">
                    <ChartCard title="Session Source" subtitle={`${showData ? sessionSourceData.reduce((s, d) => s + d.value, 0) : 0} Total Sessions`}>
                        {showData ? (
                            <div className="flex items-center">
                                <DonutChart segments={sessionSourceData} size={110} />
                                <DonutLegend segments={sessionSourceData} />
                            </div>
                        ) : <NoDataState />}
                    </ChartCard>
                    <ChartCard title="Session Resolution Rate" subtitle={`${showData ? resolutionData.reduce((s, d) => s + d.value, 0) : 0} Total Sessions`}>
                        {showData ? (
                            <div className="flex items-center">
                                <DonutChart segments={resolutionData} size={110} />
                                <DonutLegend segments={resolutionData} />
                            </div>
                        ) : <NoDataState />}
                    </ChartCard>
                    <ChartCard title="Session Label" subtitle={`${showData ? labelData.reduce((s, d) => s + d.value, 0) : 0} Total label assigned`}>
                        {showData ? (
                            <div className="flex items-center">
                                <DonutChart segments={labelData} size={110} />
                                <DonutLegend segments={labelData} />
                            </div>
                        ) : <NoDataState />}
                    </ChartCard>
                </div>

                {/* ── Row 3: Historical MAU + Session Status (2 columns) ── */}
                <div className="grid grid-cols-2 gap-4">
                    <ChartCard title="Historical MAU" subtitle={`${showData ? mauData[mauData.length - 1].value : 0} MAU`}>
                        {showData ? (
                            <LineChart data={mauData} color="#8B5CF6" />
                        ) : <NoDataState />}
                    </ChartCard>
                    <ChartCard title="Session Status" subtitle={`${showData ? sessionStatusData.reduce((s, d) => s + d.value, 0) : 0} Total Session`}>
                        {showData ? (
                            <div className="flex items-center">
                                <DonutChart segments={sessionStatusData} size={110} />
                                <DonutLegend segments={sessionStatusData} />
                            </div>
                        ) : <NoDataState />}
                    </ChartCard>
                </div>

                {/* ══════════════════════════════════════════
                    Session Performance — 5 KPI cards
                ══════════════════════════════════════════ */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-[14px] font-semibold text-foreground">Session Performance</h3>
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                        {perfMetrics.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <div key={i} className="text-center">
                                    <p className="text-[22px] font-bold text-foreground mb-1">
                                        {showData ? m.value : (m.label.includes('SLA') ? '0%' : '00h 00m 00s')}
                                    </p>
                                    <p className="text-[11px] text-[#9CA3AF] leading-tight">{m.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    Session List — table with 12 columns
                    Persis dari screenshot: Name, Platform,
                    Inbox Name, Phone, Session Number,
                    Priority, Agent Assigned, Create At,
                    Handed to Human Agent, Resolve At,
                    AI session duration, Agent session duration
                ══════════════════════════════════════════ */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E5E7EB]">
                        <h3 className="text-[14px] font-semibold text-foreground">Session List</h3>
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px]">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    {['Name', 'Platform', 'Inbox Name', 'Phone', 'Session Number', 'Priority',
                                        'Agent Assigned', 'Create At', 'Handed to Human Agent', 'Resolve At',
                                        'AI session duration', 'Agent session duration'].map(col => (
                                            <th key={col} className="px-3 py-2.5 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {showData && sessionListData.length > 0 ? (
                                    sessionListData.map((row, i) => (
                                        <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                            <td className="px-3 py-2.5 text-[12px] font-medium text-foreground whitespace-nowrap">{row.name}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] whitespace-nowrap">{row.platform}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] whitespace-nowrap">{row.inbox}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] font-mono whitespace-nowrap">{row.phone}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-primary font-medium whitespace-nowrap">{row.sessionNum}</td>
                                            <td className="px-3 py-2.5 whitespace-nowrap"><PriorityBadge priority={row.priority} /></td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] whitespace-nowrap">{row.agent}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] whitespace-nowrap">{row.createdAt}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] whitespace-nowrap">{row.handedTo}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] whitespace-nowrap">{row.resolvedAt}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] font-mono whitespace-nowrap">{row.aiDuration}</td>
                                            <td className="px-3 py-2.5 text-[12px] text-[#6B7280] font-mono whitespace-nowrap">{row.agentDuration}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="px-6 py-12 text-center">
                                            <p className="text-[13px] font-medium text-foreground">No Data Available</p>
                                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">There are no charts or data for selected date.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination inside Session List — kecil mirip cekat.ai */}
                    <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-[#E5E7EB]">
                        <button disabled className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] disabled:opacity-30">
                            <ChevronsLeft className="w-3 h-3 text-[#6B7280]" />
                        </button>
                        <button disabled className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] disabled:opacity-30">
                            <ChevronLeft className="w-3 h-3 text-[#6B7280]" />
                        </button>
                        <span className="w-7 h-7 flex items-center justify-center rounded border border-primary text-[12px] font-semibold text-primary">1</span>
                        <button disabled className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] disabled:opacity-30">
                            <ChevronRight className="w-3 h-3 text-[#6B7280]" />
                        </button>
                        <button disabled className="w-7 h-7 flex items-center justify-center rounded border border-[#E5E7EB] disabled:opacity-30">
                            <ChevronsRight className="w-3 h-3 text-[#6B7280]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
