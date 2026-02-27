'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Topbar — Glassmorphism header with breadcrumb + search
   ═══════════════════════════════════════════════════════ */

const pageTitles: Record<string, string> = {
    '/dashboard': 'Overview',
    '/dashboard/intents': 'Intents',
    '/dashboard/training': 'Training',
    '/dashboard/learning': 'Learning',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/settings': 'Settings',
};

export default function Topbar() {
    const pathname = usePathname();
    const pageTitle = pageTitles[pathname] || 'Dashboard';

    return (
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-border/50">
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">Dashboard</span>
                <span className="text-text-muted text-sm">/</span>
                <span className="text-foreground font-semibold text-sm">{pageTitle}</span>
            </div>

            {/* Right: Search + Notifications + Avatar */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-56 pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background transition-colors">
                    <Bell className="w-[18px] h-[18px] text-text-secondary" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                </button>

                {/* Avatar */}
                <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#8B5CF6] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                </button>
            </div>
        </header>
    );
}
