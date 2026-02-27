'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════
   Dashboard Layout — Sidebar + Topbar + Content
   Structure: cekat.ai reference (sidebar kiri, content kanan)
   ═══════════════════════════════════════════════════════ */

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Content Area (offset by sidebar width) */}
            <div className="ml-[260px] transition-all duration-300">
                <Topbar />
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
