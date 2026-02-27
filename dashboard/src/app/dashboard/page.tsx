'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import {
    LayoutDashboard,
    MessageSquare,
    Brain,
    Zap,
    Clock,
    TrendingUp,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import { fetcher } from '@/lib/api';

/* ═══════════════════════════════════════════════════════
   Overview Page — Dashboard home
   
   Penjelasan:
   - Mengambil data dari GET /api/dashboard/stats
   - Menampilkan 4 stats cards, line chart, bar chart, recent chats
   - Jika API belum jalan, tampilkan fallback data
   ═══════════════════════════════════════════════════════ */

// TypeScript interface for API response
interface ChatEntry { id: number; message: string; intent: string; confidence: number; time: string }
interface DashboardStats {
    total_chats: number;
    nlp_accuracy: number;
    avg_response_ms: number;
    total_intents: number;
    chat_volume: { day: string; chats: number }[];
    top_intents: { name: string; count: number; fill: string }[];
    recent_chats: ChatEntry[];
}

// Fallback data saat API belum tersedia
const fallbackData: DashboardStats = {
    total_chats: 0,
    nlp_accuracy: 0,
    avg_response_ms: 0,
    total_intents: 0,
    chat_volume: [
        { day: 'Sen', chats: 0 },
        { day: 'Sel', chats: 0 },
        { day: 'Rab', chats: 0 },
        { day: 'Kam', chats: 0 },
        { day: 'Jum', chats: 0 },
        { day: 'Sab', chats: 0 },
        { day: 'Min', chats: 0 },
    ],
    top_intents: [],
    recent_chats: [],
};

export default function OverviewPage() {
    // SWR: fetch data dari backend Flask
    // Penjelasan: useSWR otomatis cache, revalidate, dan handle loading state
    const { data, error } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
        fallbackData,
        refreshInterval: 30000, // Refresh setiap 30 detik
        onError: () => { }, // Suppress error toast
    });

    const stats = data || fallbackData;

    // Format response time: ms → seconds atau tetap ms
    const formatResponseTime = (ms: number) => {
        if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
        return `${ms}ms`;
    };

    return (
        <div>
            <PageHeader
                title="Overview"
                description="Ringkasan performa chatbot Anda hari ini"
                icon={LayoutDashboard}
            />

            {/* API Connection Status */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 px-4 py-3 bg-warning-light border border-warning/30 rounded-xl text-sm text-warning flex items-center gap-2"
                >
                    <span>⚠️</span>
                    <span>Backend API belum terhubung. Jalankan Flask server di port 5000 untuk data live.</span>
                </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    label="Total Chats"
                    value={stats.total_chats?.toLocaleString() || '0'}
                    icon={MessageSquare}
                    trend={{ value: 12.5, label: 'vs kemarin' }}
                    color="primary"
                    index={0}
                />
                <StatsCard
                    label="NLP Accuracy"
                    value={`${stats.nlp_accuracy || 0}%`}
                    icon={Brain}
                    trend={{ value: 2.1, label: 'vs minggu lalu' }}
                    color="success"
                    index={1}
                />
                <StatsCard
                    label="Avg Response"
                    value={formatResponseTime(stats.avg_response_ms || 0)}
                    icon={Zap}
                    trend={{ value: -8.3, label: 'lebih cepat' }}
                    color="warning"
                    index={2}
                />
                <StatsCard
                    label="Active Intents"
                    value={stats.total_intents || 0}
                    icon={TrendingUp}
                    trend={{ value: 3, label: 'baru ditambah' }}
                    color="primary"
                    index={3}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chat Volume Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-border p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-foreground">Chat Volume</h3>
                            <p className="text-sm text-text-secondary">7 hari terakhir</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-xs font-medium bg-primary-light text-primary rounded-lg">
                                7D
                            </button>
                            <button className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-background rounded-lg transition-colors">
                                30D
                            </button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={stats.chat_volume || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748B' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748B' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="chats"
                                stroke="#2563EB"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: 'white' }}
                                activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: 'white' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Top Intents */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-2xl border border-border p-6"
                >
                    <h3 className="font-semibold text-foreground mb-1">Top Intents</h3>
                    <p className="text-sm text-text-secondary mb-6">Yang paling sering ditanyakan</p>
                    {(stats.top_intents?.length || 0) > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.top_intents} layout="vertical" barSize={20}>
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    width={90}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">
                            Belum ada data intent
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Recent Chats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white rounded-2xl border border-border"
            >
                <div className="p-6 border-b border-border">
                    <h3 className="font-semibold text-foreground">Chat Terbaru</h3>
                    <p className="text-sm text-text-secondary">5 percakapan terakhir</p>
                </div>
                <div className="divide-y divide-border">
                    {(stats.recent_chats?.length || 0) > 0 ? (
                        stats.recent_chats.map((chat: ChatEntry, i: number) => (
                            <motion.div
                                key={chat.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className="flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{chat.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium">
                                                {chat.intent}
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                {(chat.confidence * 100).toFixed(0)}% confidence
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs">{chat.time}</span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="px-6 py-12 text-center text-text-muted text-sm">
                            Belum ada percakapan. Mulai chat untuk melihat data di sini.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
