'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

/* ═══════════════════════════════════════════════════════
   Dashboard Layout — cekat.ai style
   
   Struktur:
   ┌─────────────────────────────────┐
   │ TopNavBar (52px, full width)     │
   ├──────────┬──────────────────────┤
   │ Sidebar  │  Content Area        │
   │(56/168px)│  (scrollable)        │
   │          │                      │
   └──────────┴──────────────────────┘
   
   Perubahan: Sidebar sekarang bisa di-collapse!
   - Expanded: 168px (default, icon + label)
   - Collapsed: 56px (icon only, lebih luas)
   - State dikelola di layout, dipassing ke Sidebar via props
   - Main content margin-left otomatis menyesuaikan
   ═══════════════════════════════════════════════════════ */

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#FAFBFC]">
            {/* Top Navigation Bar — full width, fixed */}
            <Topbar />

            {/* Fixed Left Sidebar — collapsible */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content — margin-left dynamis sesuai sidebar */}
            <main
                className="mt-0 min-h-[calc(100vh-52px)] transition-all duration-200 ease-in-out"
                style={{ marginLeft: sidebarCollapsed ? '56px' : '168px' }}
            >
                {children}
            </main>
        </div>
    );
}
