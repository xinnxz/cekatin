'use client';

import { useState, useRef, useEffect } from 'react';
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
import { ChevronDown, HelpCircle, Settings, DollarSign } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Topbar — Horizontal navigation bar (cekat.ai style)
   
   Layout reference dari screenshot:
   [Logo] [Chat] [Orders] [CRM] [Marketing] [Automation]  
                          [$] [⚙️] [❓] [Assistant] [ReonShop 🔽]
   
   Penjelasan fitur Billing Icon:
   - Icon "$" di area kanan Topbar (sesuai cekat.ai)
   - Hover → Popover muncul dengan info:
     • Paket aktif (FREE Plan)
     • Tanggal expired
     • Usage MAU (progress bar)
     • Usage AI Responses (progress bar)
   - Click → Navigate ke /dashboard/billings
   ═══════════════════════════════════════════════════════ */

const topNavItems = [
    { label: 'Chat', icon: IconChat, href: '/dashboard' },
    { label: 'Orders', icon: IconOrders, href: '/dashboard/orders' },
    { label: 'CRM', icon: IconCRM, href: '/dashboard/crm' },
    { label: 'Marketing', icon: IconMarketing, href: '/dashboard/marketing' },
    { label: 'Automation', icon: IconAutomation, href: '/dashboard/automation' },
];

// ═══ BILLING POPOVER ═══
// Popover yang muncul saat hover icon "$" — menampilkan 
// ringkasan paket aktif, usage MAU, dan AI Responses
function BillingPopover() {
    return (
        <div className="absolute top-full right-0 mt-1 w-[280px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-4 z-[60]">
            {/* Arrow */}
            <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-l border-t border-[#E5E7EB] rotate-45" />

            {/* Package Info */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[10px] text-[#9CA3AF]">Current Plan</p>
                    <p className="text-[14px] font-bold text-foreground">FREE Plan</p>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-bold text-green-700 bg-green-100 rounded-full">Active</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mb-3">Expires: March 29, 2026</p>

            {/* MAU Usage */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#6B7280]">MAU Usage</span>
                    <span className="font-medium text-foreground">0 / 20</span>
                </div>
                <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '0%' }} />
                </div>
            </div>

            {/* AI Responses Usage */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#6B7280]">AI Responses</span>
                    <span className="font-medium text-foreground">0 / 100</span>
                </div>
                <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '0%' }} />
                </div>
            </div>

            {/* CTA */}
            <Link href="/dashboard/billings"
                className="block w-full py-2 text-center text-[11px] font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                Manage Billing
            </Link>
        </div>
    );
}

export default function Topbar() {
    const pathname = usePathname();
    const [showBilling, setShowBilling] = useState(false);
    const billingRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (billingRef.current && !billingRef.current.contains(e.target as Node)) {
                setShowBilling(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                {/* Billing icon — klik untuk popover, link ke /dashboard/billings */}
                <div className="relative" ref={billingRef}>
                    <button
                        onClick={() => setShowBilling(!showBilling)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showBilling || pathname.startsWith('/dashboard/billings')
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-[#F3F4F6] text-[#9CA3AF]'
                            }`}
                        title="Billing"
                    >
                        <DollarSign className="w-[18px] h-[18px]" />
                    </button>
                    {showBilling && <BillingPopover />}
                </div>

                {/* Settings gear */}
                <Link href="/dashboard/settings" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF]">
                    <Settings className="w-[18px] h-[18px]" />
                </Link>

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
