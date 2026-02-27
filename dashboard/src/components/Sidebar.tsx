'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

/* ═══════════════════════════════════════════════════════
   Sidebar — Vertical left navigation (cekat.ai exact style)
   
   Penjelasan layout reference dari screenshot:
   - Posisi di bawah TopNavBar (bukan full height)
   - Width: ~160px (lebih narrow dari sebelumnya)
   - Menu items: Chat, Tickets, Calls, Analytics,
                 Conversations, Broadcasts, AI Agents,
                 Connected Platforms, Flow, Settings
   - Active state: light blue background + blue text
   - Settings di paling bawah (sticky)
   ═══════════════════════════════════════════════════════ */

const sidebarItems = [
    { label: 'Chat', icon: IconChat, href: '/dashboard' },
    { label: 'Tickets', icon: IconTicket, href: '/dashboard/tickets' },
    { label: 'Calls', icon: IconPhone, href: '/dashboard/calls' },
    { label: 'Analytics', icon: IconChart, href: '/dashboard/analytics' },
    { label: 'Conversations', icon: IconConversation, href: '/dashboard/conversations' },
    { label: 'Broadcasts', icon: IconBroadcast, href: '/dashboard/broadcasts' },
    { label: 'AI Agents', icon: IconAIAgent, href: '/dashboard/ai-agents' },
    { label: 'Connected Platforms', icon: IconPlatform, href: '/dashboard/platforms' },
    { label: 'Flow', icon: IconFlow, href: '/dashboard/flow' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-[52px] bottom-0 w-[168px] flex flex-col bg-white border-r border-[#E5E7EB] z-40">
            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
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
                                    className={`
                    flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px]
                    transition-all duration-150
                    ${isActive
                                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                                            : 'text-[#374151] hover:bg-[#F9FAFB] font-normal'
                                        }
                  `}
                                >
                                    <Icon size={18} className={isActive ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'} />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom: Settings (sticky) */}
            <div className="border-t border-[#E5E7EB] p-2">
                <Link
                    href="/dashboard/settings"
                    className={`
            flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px]
            transition-all duration-150
            ${pathname.startsWith('/dashboard/settings')
                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                            : 'text-[#374151] hover:bg-[#F9FAFB] font-normal'
                        }
          `}
                >
                    <IconSettings size={18} className={pathname.startsWith('/dashboard/settings') ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'} />
                    <span>Settings</span>
                </Link>
            </div>
        </aside>
    );
}
