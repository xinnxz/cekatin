'use client';

import { motion } from 'framer-motion';
import {
    Plus,
    Filter,
    RefreshCw,
    Check,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Chat Page — Main dashboard page (cekat.ai style)
   
   Penjelasan:
   Ini adalah halaman utama saat user akses /dashboard.
   Mirip cekat.ai, ada 3 column layout:
   - Sidebar (sudah di layout)
   - Chat list panel (secondary sidebar)
   - Main content area (welcome message / chat detail)
   
   Welcome screen menampilkan 4 onboarding steps
   persis seperti screenshot cekat.ai.
   ═══════════════════════════════════════════════════════ */

const onboardingSteps = [
    {
        number: 1,
        title: 'Hubungkan Platform',
        description: 'Mulai terima pesan dari WhatsApp, IG, dan FB Anda!',
        emoji: '🤝',
        color: '#FEF3C7',
    },
    {
        number: 2,
        title: 'Buat AI Agent',
        description: 'Jawab pesan masuk dengan Agent AI anda',
        emoji: '🤖',
        color: '#DBEAFE',
    },
    {
        number: 3,
        title: 'Undang Agen Manusia',
        description: 'Undang tim Anda untuk membantu menjawab chat',
        emoji: '👥',
        color: '#E0E7FF',
    },
    {
        number: 4,
        title: 'Konek AI Agent ke Inbox',
        description: 'Hubungkan AI Agent dan Human Agent ke Platform',
        emoji: '🔗',
        color: '#FCE7F3',
    },
];

export default function ChatPage() {
    return (
        <div className="flex h-[calc(100vh-52px)]">
            {/* ═══ Chat List Panel (secondary sidebar) ═══ */}
            <div className="w-[280px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">
                {/* Panel Header */}
                <div className="h-[52px] flex items-center justify-between px-4 border-b border-[#E5E7EB]">
                    {/* Kebab menu */}
                    <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="3" r="1.2" />
                            <circle cx="8" cy="8" r="1.2" />
                            <circle cx="8" cy="13" r="1.2" />
                        </svg>
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                        <button className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors border border-[#E5E7EB]">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF] border border-[#E5E7EB]">
                            <Filter className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF] border border-[#E5E7EB]">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Tab: Assigned */}
                <div className="px-3 py-2">
                    <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[#F3F4F6] text-[13px] font-medium text-foreground">
                        <span>Assigned</span>
                        <Check className="w-3.5 h-3.5 text-[#9CA3AF] ml-auto" />
                    </button>
                </div>

                {/* Empty state */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4H20V16H6L4 18V4Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="text-[13px] text-[#9CA3AF]">No conversations for now...</p>
                </div>
            </div>

            {/* ═══ Main Content Area ═══ */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
                {/* Welcome Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-lg w-full px-6"
                >
                    <h1 className="text-xl font-semibold text-center text-foreground mb-8">
                        Selamat datang kembali di CekatIn!
                    </h1>

                    {/* Onboarding Steps */}
                    <div className="space-y-3">
                        {onboardingSteps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:shadow-sm transition-all cursor-pointer group"
                            >
                                {/* Emoji icon */}
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                    style={{ backgroundColor: step.color }}
                                >
                                    {step.emoji}
                                </div>

                                {/* Text */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {step.number}. {step.title}
                                    </h3>
                                    <p className="text-[12.5px] text-[#6B7280] mt-0.5 italic">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Help link */}
                    <p className="text-center mt-6 text-[12.5px] text-primary underline underline-offset-2 cursor-pointer hover:text-primary-hover">
                        Butuh bantuan lebih? Lihat Tutorial Youtube kami
                    </p>
                </motion.div>

                {/* Bottom-right float button (AI button) */}
                <button className="fixed bottom-6 right-6 w-10 h-10 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] flex items-center justify-center hover:bg-white hover:shadow-md transition-all">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="4" y="3" width="12" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="1" fill="#9CA3AF" />
                        <circle cx="12" cy="8" r="1" fill="#9CA3AF" />
                        <path d="M10 13V16M8 16H12" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
