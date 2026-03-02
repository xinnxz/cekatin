'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { X, Send, Bot } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Dashboard Layout — cekat.ai style
   
   Struktur:
   ┌─────────────────────────────────┐
   │ TopNavBar (52px, full width)     │
   ├──────────┬──────────────────────┤
   │ Sidebar  │  Content Area        │
   │(56/168px)│  (scrollable)        │
   │          │                      │
   └──────────┴──────────────────────┘
   
   Fitur:
   - Sidebar collapsible (56px/168px)
   - Clara AI floating assistant (bottom-right)
   ═══════════════════════════════════════════════════════ */

/* ── Clara AI Floating Assistant ── 
   Penjelasan:
   - FAB (Floating Action Button) di pojok kanan bawah
   - Klik → pop-up chat kecil muncul
   - Bisa tanya bantuan tentang fitur Cepat Chat
   - Mirip fitur "Clara" di cekat.ai yang ada di pojok kanan bawah */
function ClaraAssistant() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    return (
        <>
            {/* Chat Popup */}
            {open && (
                <div className="fixed bottom-20 right-6 w-[340px] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-[#6366F1] px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[13px] font-semibold text-white">Clara</h3>
                            <p className="text-[10px] text-white/70">Cepat Chat AI Assistant</p>
                        </div>
                        <button onClick={() => setOpen(false)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                            <X className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-[280px] overflow-y-auto p-4 bg-[#F9FAFB] space-y-3">
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-3 h-3 text-primary" />
                            </div>
                            <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 shadow-sm border border-[#E5E7EB] max-w-[85%]">
                                <p className="text-[12px] text-foreground leading-relaxed">
                                    Halo! 👋 Saya <strong>Clara</strong>, asisten AI Cepat Chat.
                                    Saya bisa membantu Anda dengan:
                                </p>
                                <ul className="text-[11px] text-[#6B7280] mt-2 space-y-1 list-disc list-inside">
                                    <li>Menghubungkan platform (WhatsApp, IG)</li>
                                    <li>Mengatur AI Agent</li>
                                    <li>Tips & trik Cepat Chat</li>
                                    <li>Pertanyaan billing & fitur</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="bg-white border-t border-[#E5E7EB] px-3 py-2.5 flex items-center gap-2">
                        <input
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Tanya Clara..."
                            className="flex-1 text-[12px] bg-[#F3F4F6] rounded-full px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-[#9CA3AF]"
                        />
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors">
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#6366F1] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center justify-center group"
                title="Clara AI Assistant"
            >
                {open ? (
                    <X className="w-5 h-5" />
                ) : (
                    <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {/* Pulse indicator */}
                {!open && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                )}
            </button>
        </>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#FAFBFC]">
            {/* Top Navigation Bar — full width, fixed */}
            <Topbar />

            {/* Fixed Left Sidebar — collapsible */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content — margin-left dynamis sesuai sidebar */}
            <main
                className="mt-0 min-h-[calc(100vh-52px)] transition-all duration-200 ease-in-out"
                style={{ marginLeft: sidebarCollapsed ? '56px' : '168px' }}
            >
                {children}
            </main>

            {/* Clara AI Floating Assistant — bottom right */}
            <ClaraAssistant />
        </div>
    );
}
