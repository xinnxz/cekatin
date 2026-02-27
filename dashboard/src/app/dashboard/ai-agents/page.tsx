'use client';

import { useState } from 'react';
import { Search, Clock } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   AI Agents Page — mirip chat.cekat.ai/chatbots/chatbot-list
   
   Layout (empty state):
   - Large centered title "AI Agents"
   - Subtitle description
   - Search bar + clock history icon
   - Big empty state illustration (SVG robot)
   - "No AI Agents Found" text
   - "Create Your First Agent" CTA button
   
   Saat sudah ada agent → tampilkan grid card agent
   ═══════════════════════════════════════════════════ */

export default function AIAgentsPage() {
    const [search, setSearch] = useState('');

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
            {/* ── Main Content: Empty State Layout (persis seperti cekat.ai) ── */}
            <div className="flex-1 flex flex-col items-center justify-start pt-12 px-6">

                {/* Title & Description */}
                <h1 className="text-[28px] font-bold text-foreground mb-3 text-center">AI Agents</h1>
                <p className="text-[13.5px] text-[#6B7280] text-center max-w-lg leading-relaxed">
                    Ini adalah halaman di mana Anda dapat mengunjungi AI yang telah Anda buat sebelumnya.<br />
                    Jangan ragu untuk membuat perubahan dan membuat chatbot sebanyak yang Anda inginkan kapan saja!
                </p>

                {/* Search + History */}
                <div className="flex items-center gap-2 mt-8 w-full max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search AI agents..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-[13px] border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-[#9CA3AF]"
                        />
                    </div>
                    {/* History icon button */}
                    <button className="w-10 h-10 flex items-center justify-center border border-[#E5E7EB] bg-white rounded-xl hover:bg-[#F3F4F6] transition-colors text-[#6B7280]">
                        <Clock className="w-4 h-4" />
                    </button>
                </div>

                {/* Empty State Illustration — SVG custom (bukan emoji) */}
                <div className="mt-14 flex flex-col items-center">
                    {/* Robot/Agent SVG illustration */}
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-[#9CA3AF] mb-5">
                        {/* Head */}
                        <rect x="20" y="20" width="40" height="32" rx="8" stroke="currentColor" strokeWidth="2.5" />
                        {/* Eyes */}
                        <circle cx="31" cy="34" r="3.5" stroke="currentColor" strokeWidth="2" />
                        <circle cx="49" cy="34" r="3.5" stroke="currentColor" strokeWidth="2" />
                        {/* Mouth */}
                        <path d="M32 42 Q40 47 48 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        {/* Antenna */}
                        <line x1="40" y1="20" x2="40" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="40" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
                        {/* Body */}
                        <rect x="25" y="54" width="30" height="18" rx="5" stroke="currentColor" strokeWidth="2.5" />
                        {/* Arms */}
                        <rect x="10" y="56" width="13" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
                        <rect x="57" y="56" width="13" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
                        {/* Ear */}
                        <rect x="14" y="28" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
                        <rect x="60" y="28" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
                    </svg>

                    <h2 className="text-[16px] font-semibold text-foreground mb-2">No AI Agents Found</h2>
                    <p className="text-[13px] text-[#9CA3AF] text-center max-w-xs">
                        You haven&apos;t created any AI agents yet. Create your first one to get started!
                    </p>

                    {/* CTA Button */}
                    <button className="mt-6 px-6 py-2.5 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm hover:shadow-md active:scale-95">
                        Create Your First Agent
                    </button>
                </div>
            </div>
        </div>
    );
}
