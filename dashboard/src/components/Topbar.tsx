'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CepatChatLogo,
    IconChat,
    IconOrders,
    IconCRM,
    IconMarketing,
    IconAutomation,
    IconSettings,
    IconAssistant,
} from './icons';
import { ChevronDown, HelpCircle, Settings, DollarSign, LogOut, User, Bell, Copy, Wifi, WifiOff } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Topbar — Horizontal navigation bar (cekat.ai style)
   
   Layout reference dari screenshot cekat.ai:
   [Logo] [Chat] [Orders] [CRM] [Marketing] [Automation]  
                          [$] [⚙️] [❓] [Assistant] [ReonShop 🔽]
   
   Fitur lengkap:
   1. Billing Icon ($) → Popover usage info
   2. Settings gear → /dashboard/settings
   3. Help (?) → bantuan
   4. Assistant → sidebar AI Clara
   5. User Profile Dropdown → Online/Offline, Notif, Edit, Logout
   ═══════════════════════════════════════════════════════ */

const topNavItems = [
    { label: 'Chat', icon: IconChat, href: '/dashboard' },
    { label: 'Orders', icon: IconOrders, href: '/dashboard/orders' },
    { label: 'CRM', icon: IconCRM, href: '/dashboard/crm' },
    { label: 'Marketing', icon: IconMarketing, href: '/dashboard/marketing' },
    { label: 'Automation', icon: IconAutomation, href: '/dashboard/automation' },
];

// ═══ BILLING POPOVER ═══
function BillingPopover() {
    return (
        <div className="absolute top-full right-0 mt-1 w-[280px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-4 z-[60]">
            <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-l border-t border-[#E5E7EB] rotate-45" />
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[10px] text-[#9CA3AF]">Current Plan</p>
                    <p className="text-[14px] font-bold text-foreground">FREE Plan</p>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-bold text-green-700 bg-green-100 rounded-full">Active</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mb-3">Expires: March 29, 2026</p>
            <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#6B7280]">MAU Usage</span>
                    <span className="font-medium text-foreground">0 / 20</span>
                </div>
                <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '0%' }} />
                </div>
            </div>
            <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#6B7280]">AI Responses</span>
                    <span className="font-medium text-foreground">0 / 100</span>
                </div>
                <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '0%' }} />
                </div>
            </div>
            <Link href="/dashboard/billings"
                className="block w-full py-2 text-center text-[11px] font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                Manage Billing
            </Link>
        </div>
    );
}

// ═══ USER PROFILE DROPDOWN ═══
// Penjelasan: Dropdown yang muncul saat klik avatar ReonShop
// Fitur di cekat.ai:
// 1. Info user (nama + email + role)
// 2. Online/Offline toggle — ubah status ketersediaan
// 3. Notification toggle — aktifkan/nonaktifkan notifikasi
// 4. Edit Profile — link ke halaman profil
// 5. Copy Tenant ID — salin ID tenant ke clipboard
// 6. Logout — keluar dari akun
function ProfileDropdown() {
    const [isOnline, setIsOnline] = useState(true);
    const [notifOn, setNotifOn] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopyTenant = () => {
        navigator.clipboard.writeText('tenant-reonshop-abc123');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="absolute top-full right-0 mt-1 w-[260px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-[60] overflow-hidden">
            {/* Arrow */}
            <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-l border-t border-[#E5E7EB] rotate-45" />

            {/* User Info Header */}
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#6366F1] flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="5" r="2.5" stroke="white" strokeWidth="1.3" />
                            <path d="M3 12C3 10.3431 4.79086 9 7 9C9.20914 9 11 10.3431 11 12" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-foreground">ReonShop</p>
                        <p className="text-[10px] text-[#9CA3AF]">admin@reonshop.com</p>
                        <span className="px-1.5 py-0.5 text-[8px] font-semibold text-primary bg-primary/10 rounded mt-0.5 inline-block">Admin</span>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
                {/* Online/Offline Toggle */}
                <button
                    onClick={() => setIsOnline(!isOnline)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-[#9CA3AF]" />}
                        <span className="text-[12px] text-foreground">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    {/* Toggle Switch */}
                    <div className={`w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${isOnline ? 'bg-green-500' : 'bg-[#D1D5DB]'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${isOnline ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                </button>

                {/* Notification Toggle */}
                <button
                    onClick={() => setNotifOn(!notifOn)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-[#6B7280]" />
                        <span className="text-[12px] text-foreground">Notifications</span>
                    </div>
                    <div className={`w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${notifOn ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${notifOn ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                </button>

                <div className="h-px bg-[#E5E7EB] mx-3 my-1" />

                {/* Edit Profile */}
                <Link href="/dashboard/settings"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#F9FAFB] transition-colors">
                    <User className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-[12px] text-foreground">Edit Profile</span>
                </Link>

                {/* Copy Tenant ID */}
                <button
                    onClick={handleCopyTenant}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F9FAFB] transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-[#6B7280]" />
                        <span className="text-[12px] text-foreground">Copy Tenant ID</span>
                    </div>
                    {copied && <span className="text-[9px] text-green-600 font-medium">Copied!</span>}
                </button>

                <div className="h-px bg-[#E5E7EB] mx-3 my-1" />

                {/* Logout */}
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-[12px] text-red-500 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}

export default function Topbar() {
    const pathname = usePathname();
    const [showBilling, setShowBilling] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const billingRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close popovers when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (billingRef.current && !billingRef.current.contains(e.target as Node)) {
                setShowBilling(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-50 h-[52px] flex items-center justify-between px-4 bg-white border-b border-[#E5E7EB]">
            {/* Left: Logo + Navigation Tabs */}
            <div className="flex items-center gap-1">
                <Link href="/dashboard" className="flex items-center mr-4">
                    <CepatChatLogo size={32} />
                </Link>
                <nav className="flex items-center">
                    {topNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/dashboard'
                                ? pathname === '/dashboard' || pathname.startsWith('/dashboard/chat') || pathname.startsWith('/dashboard/intents')
                                : pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href}
                                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${isActive ? 'text-primary bg-primary-50' : 'text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6]'}`}>
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                {/* Billing icon */}
                <div className="relative" ref={billingRef}>
                    <button onClick={() => setShowBilling(!showBilling)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showBilling || pathname.startsWith('/dashboard/billings') ? 'bg-primary/10 text-primary' : 'hover:bg-[#F3F4F6] text-[#9CA3AF]'}`}
                        title="Billing">
                        <DollarSign className="w-[18px] h-[18px]" />
                    </button>
                    {showBilling && <BillingPopover />}
                </div>

                {/* Settings */}
                <Link href="/dashboard/settings" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF]">
                    <Settings className="w-[18px] h-[18px]" />
                </Link>

                {/* Help */}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF]">
                    <HelpCircle className="w-[18px] h-[18px]" />
                </button>

                <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

                {/* Assistant */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors">
                    <IconAssistant size={16} />
                    <span>Assistant</span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showProfile ? 'bg-[#F3F4F6]' : 'hover:bg-[#F3F4F6]'}`}
                    >
                        <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#6366F1] flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="5" r="2.5" stroke="white" strokeWidth="1.3" />
                                    <path d="M3 12C3 10.3431 4.79086 9 7 9C9.20914 9 11 10.3431 11 12" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                            </div>
                            {/* Online indicator dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                        </div>
                        <span className="text-[13px] font-medium text-foreground">ReonShop</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                    </button>
                    {showProfile && <ProfileDropdown />}
                </div>
            </div>
        </header>
    );
}


