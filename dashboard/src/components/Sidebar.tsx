'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    MessageSquare,
    Brain,
    GraduationCap,
    BarChart3,
    Settings,
    LogOut,
    Bot,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════
   Sidebar — Fixed left navigation
   Layout: cekat.ai dashboard reference
   ═══════════════════════════════════════════════════════ */

const menuItems = [
    {
        section: 'MAIN',
        items: [
            { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
            { label: 'Intents', icon: MessageSquare, href: '/dashboard/intents' },
            { label: 'Training', icon: GraduationCap, href: '/dashboard/training' },
            { label: 'Learning', icon: Brain, href: '/dashboard/learning' },
            { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
        ],
    },
    {
        section: 'SYSTEM',
        items: [
            { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-border"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-bold text-lg text-foreground"
                    >
                        CekatIn
                    </motion.span>
                )}
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {menuItems.map((section) => (
                    <div key={section.section} className="mb-6">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[11px] font-semibold text-text-muted tracking-wider uppercase">
                                {section.section}
                            </p>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${isActive
                                                    ? 'bg-primary-light text-primary'
                                                    : 'text-text-secondary hover:bg-background hover:text-foreground'
                                                }
                      `}
                                        >
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                                            {!collapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="truncate"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                            {isActive && !collapsed && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Bottom: Collapse toggle */}
            <div className="border-t border-border p-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-background hover:text-foreground transition-all w-full"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </motion.aside>
    );
}
