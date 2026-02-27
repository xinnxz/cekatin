'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

/* ═══════════════════════════════════════════════════════
   Dashboard Layout — cekat.ai style
   
   Struktur:
   ┌─────────────────────────────────┐
   │ TopNavBar (52px, full width)     │
   ├──────────┬──────────────────────┤
   │ Sidebar  │  Content Area        │
   │ (168px)  │  (scrollable)        │
   │          │                      │
   └──────────┴──────────────────────┘
   ═══════════════════════════════════════════════════════ */

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#FAFBFC]">
            {/* Top Navigation Bar — full width, fixed */}
            <Topbar />

            {/* Fixed Left Sidebar — below topbar */}
            <Sidebar />

            {/* Main Content — offset by sidebar width + below topbar */}
            <main className="ml-[168px] mt-0 min-h-[calc(100vh-52px)]">
                {children}
            </main>
        </div>
    );
}
