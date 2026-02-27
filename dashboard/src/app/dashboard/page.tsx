'use client';

import { motion } from 'framer-motion';
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

/* ═══════════════════════════════════════════════════════
   Overview Page — Dashboard home
   Stats cards + Chat volume chart + Top intents
   ═══════════════════════════════════════════════════════ */

// Mock data — nanti diganti dengan SWR fetch dari API
const chatVolumeData = [
    { day: 'Sen', chats: 120 },
    { day: 'Sel', chats: 180 },
    { day: 'Rab', chats: 250 },
    { day: 'Kam', chats: 200 },
    { day: 'Jum', chats: 310 },
    { day: 'Sab', chats: 280 },
    { day: 'Min', chats: 150 },
];

const topIntentsData = [
    { name: 'tanya_harga', count: 342, fill: '#2563EB' },
    { name: 'greeting', count: 289, fill: '#3B82F6' },
    { name: 'tanya_stok', count: 198, fill: '#60A5FA' },
    { name: 'tanya_promo', count: 156, fill: '#93C5FD' },
    { name: 'goodbye', count: 120, fill: '#BFDBFE' },
];

const recentChats = [
    { id: 1, message: 'Harga iPhone 15 berapa ya?', intent: 'tanya_harga', confidence: 0.95, time: '2 min ago' },
    { id: 2, message: 'Hai kak, mau tanya dongg', intent: 'greeting', confidence: 0.88, time: '5 min ago' },
    { id: 3, message: 'Stok Samsung S24 masih ada?', intent: 'tanya_stok', confidence: 0.92, time: '8 min ago' },
    { id: 4, message: 'Ada promo apa hari ini?', intent: 'tanya_promo', confidence: 0.87, time: '12 min ago' },
    { id: 5, message: 'Makasih ya kak', intent: 'goodbye', confidence: 0.91, time: '15 min ago' },
];

export default function OverviewPage() {
    return (
        <div>
            <PageHeader
                title="Overview"
                description="Ringkasan performa chatbot Anda hari ini"
                icon={LayoutDashboard}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    label="Total Chats"
                    value="1,523"
                    icon={MessageSquare}
                    trend={{ value: 12.5, label: 'vs kemarin' }}
                    color="primary"
                    index={0}
                />
                <StatsCard
                    label="NLP Accuracy"
                    value="91.2%"
                    icon={Brain}
                    trend={{ value: 2.1, label: 'vs minggu lalu' }}
                    color="success"
                    index={1}
                />
                <StatsCard
                    label="Avg Response"
                    value="1.2s"
                    icon={Zap}
                    trend={{ value: -8.3, label: 'lebih cepat' }}
                    color="warning"
                    index={2}
                />
                <StatsCard
                    label="Active Intents"
                    value="25"
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
                        <LineChart data={chatVolumeData}>
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
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topIntentsData} layout="vertical" barSize={20}>
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
                    {recentChats.map((chat, i) => (
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
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
