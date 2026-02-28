'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    IconChat,
    IconTicket,
    IconPhone,
    IconChart,
    IconConversation,
    IconBroadcast,
    IconAIAgent,
    IconPlatform,
    IconFlow,
    IconSettings,
} from './icons';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Sidebar — Collapsible vertical left navigation
   
   Penjelasan fitur collapsible:
   - State collapsed: sidebar menyempit ke ~56px (icon only)
   - State expanded: sidebar lebar ~168px (icon + label)
   - Toggle button di bagian bawah (chevron left/right)
   - Saat collapsed: hover pada icon → tooltip nama muncul
   - Smooth transition menggunakan CSS transition
   
   Di cekat.ai, sidebar bisa di-collapse ke icon-only mode
   sehingga area konten menjadi lebih luas dan bersih.
   ═══════════════════════════════════════════════════════ */

const sidebarItems = [
    { label: 'Chat', icon: IconChat, href: '/dashboard' },
    { label: 'Tickets', icon: IconTicket, href: '/dashboard/tickets' },
    { label: 'Calls', icon: IconPhone, href: '/dashboard/calls' },
    { label: 'Analytics', icon: IconChart, href: '/dashboard/analytics' },
    { label: 'Conversations', icon: IconConversation, href: '/dashboard/conversations' },
    { label: 'Broadcasts', icon: IconBroadcast, href: '/dashboard/broadcasts' },
    { label: 'AI Agents', icon: IconAIAgent, href: '/dashboard/ai-agents' },
    { label: 'Connected Pla...', icon: IconPlatform, href: '/dashboard/platforms' },
    { label: 'Flow', icon: IconFlow, href: '/dashboard/flow' },
];

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const pathname = usePathname();

    return (
        <aside
            className={`fixed left-0 top-[52px] bottom-0 flex flex-col bg-white border-r border-[#E5E7EB] z-40
                transition-all duration-200 ease-in-out ${collapsed ? 'w-[56px]' : 'w-[168px]'}`}
        >
            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 px-1.5">
                <ul className="space-y-0.5">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/dashboard'
                                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/chat')
                                : pathname.startsWith(item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`
                                        flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 
                                        ${collapsed ? 'px-0 py-[9px]' : 'px-3 py-[9px]'} 
                                        rounded-lg text-[13px] transition-all duration-150
                                        ${isActive
                                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                                            : 'text-[#374151] hover:bg-[#F9FAFB] font-normal'
                                        }
                                    `}
                                >
                                    <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'}`} />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom: Settings + Collapse Toggle */}
            <div className="border-t border-[#E5E7EB] p-1.5">
                {/* Settings */}
                <Link
                    href="/dashboard/settings"
                    title={collapsed ? 'Settings' : undefined}
                    className={`
                        flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 
                        ${collapsed ? 'px-0 py-[9px]' : 'px-3 py-[9px]'} 
                        rounded-lg text-[13px] transition-all duration-150
                        ${pathname.startsWith('/dashboard/settings')
                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                            : 'text-[#374151] hover:bg-[#F9FAFB] font-normal'
                        }
                    `}
                >
                    <IconSettings size={18} className={`flex-shrink-0 ${pathname.startsWith('/dashboard/settings') ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'}`} />
                    {!collapsed && <span>Settings</span>}
                </Link>

                {/* Collapse Toggle Button */}
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center gap-2 mt-1 py-2 rounded-lg text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <>
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-[11px]">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
