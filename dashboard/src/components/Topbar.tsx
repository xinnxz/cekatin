'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CekatInLogo,
    IconChat,
    IconOrders,
    IconCRM,
    IconMarketing,
    IconAutomation,
    IconSettings,
    IconAssistant,
} from './icons';
import { ChevronDown, HelpCircle, Settings } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Topbar — Horizontal navigation bar (cekat.ai style)
   
   Layout reference dari screenshot:
   [Logo] [Chat] [Orders] [CRM] [Marketing] [Automation]  
                                    [⚙️] [❓] [Assistant] [ReonShop 🔽]
   ═══════════════════════════════════════════════════════ */

const topNavItems = [
    { label: 'Chat', icon: IconChat, href: '/dashboard' },
    { label: 'Orders', icon: IconOrders, href: '/dashboard/orders' },
    { label: 'CRM', icon: IconCRM, href: '/dashboard/crm' },
    { label: 'Marketing', icon: IconMarketing, href: '/dashboard/marketing' },
    { label: 'Automation', icon: IconAutomation, href: '/dashboard/automation' },
];

export default function Topbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 h-[52px] flex items-center justify-between px-4 bg-white border-b border-[#E5E7EB]">
            {/* Left: Logo + Navigation Tabs */}
            <div className="flex items-center gap-1">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center mr-4">
                    <CekatInLogo size={32} />
                </Link>

                {/* Navigation Tabs */}
                <nav className="flex items-center">
                    {topNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/dashboard'
                                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/chat') || pathname.startsWith('/dashboard/intents')
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  relative flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium
                  rounded-md transition-all duration-150
                  ${isActive
                                        ? 'text-primary bg-primary-50'
                                        : 'text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6]'
                                    }
                `}
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                {/* Settings gear */}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF]">
                    <Settings className="w-[18px] h-[18px]" />
                </button>

                {/* Help */}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF]">
                    <HelpCircle className="w-[18px] h-[18px]" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

                {/* Assistant button */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors">
                    <IconAssistant size={16} />
                    <span>Assistant</span>
                </button>

                {/* Tenant/User dropdown */}
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#6366F1] flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="5" r="2.5" stroke="white" strokeWidth="1.3" />
                            <path d="M3 12C3 10.3431 4.79086 9 7 9C9.20914 9 11 10.3431 11 12" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="text-[13px] font-medium text-foreground">ReonShop</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
            </div>
        </header>
    );
}
