'use client';

/* ═══════════════════════════════════════════════════════
   Cepat Chat SVG Icons — Custom hand-crafted icons
   Bukan pakai library, semua SVG dibuat sendiri
   ═══════════════════════════════════════════════════════ */

// Cepat Chat Logo — circular rotating arrows
export function CepatChatLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            {/* Background circle with gradient */}
            <circle cx="20" cy="20" r="20" fill="url(#logoGrad)" />
            {/* Inner rotating arrows — unique Cepat Chat shape */}
            <path
                d="M20 10 C25 10, 29 14, 29 19 L26 19"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
            <path d="M26 16 L26 19 L29 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path
                d="M20 30 C15 30, 11 26, 11 21 L14 21"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
            <path d="M14 24 L14 21 L11 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Center dot — the "AI brain" */}
            <circle cx="20" cy="20" r="3" fill="white" opacity="0.9" />
            <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// Small icon variant for sidebar
export function CepatChatLogoSmall({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="url(#logoSmGrad)" />
            <path d="M12 6 C15 6, 17.5 8.5, 17.5 11.5 L15.5 11.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M15.5 9.5 L15.5 11.5 L17.5 11.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 18 C9 18, 6.5 15.5, 6.5 12.5 L8.5 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M8.5 14.5 L8.5 12.5 L6.5 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="white" opacity="0.9" />
            <defs>
                <linearGradient id="logoSmGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// Custom SVG icons to replace Lucide — unique line style
export function IconChat({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V13C17 13.5523 16.5523 14 16 14H7L3 17V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="7" cy="8.5" r="0.75" fill="currentColor" />
            <circle cx="10" cy="8.5" r="0.75" fill="currentColor" />
            <circle cx="13" cy="8.5" r="0.75" fill="currentColor" />
        </svg>
    );
}

export function IconTicket({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8H18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconPhone({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M4 3.5C4 3.22386 4.22386 3 4.5 3H7.5L9 7L7 8.5C7.84884 10.2372 9.76284 12.1512 11.5 13L13 11L17 12.5V15.5C17 15.7761 16.7761 16 16.5 16C9.5 16 4 10.5 4 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function IconChart({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M3 17V7L7 10L10 4L14 9L17 3V17H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M3 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconConversation({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M5 3H15C15.5523 3 16 3.44772 16 4V10C16 10.5523 15.5523 11 15 11H8L5 14V4C5 3.44772 5.44772 3 5 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 13H14C14.5523 13 15 13.4477 15 14V18L12 15H8C7.44772 15 7 14.5523 7 14V13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function IconBroadcast({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 6C15.6569 7.65685 15.6569 12.3431 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 14C4.34315 12.3431 4.34315 7.65685 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 4C18.7614 6.76142 18.7614 13.2386 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 16C1.23858 13.2386 1.23858 6.76142 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconAIAgent({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <rect x="4" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
            <circle cx="12" cy="8" r="1" fill="currentColor" />
            <path d="M8 17H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 13V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 5L1 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 5L19 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconPlatform({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="17" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="10" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="3" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 4.5V7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M13 10H15.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 13V15.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 10H4.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}

export function IconFlow({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <rect x="3" y="2" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="14" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="8" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 6V10H11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 6V16H11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function IconSettings({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconOrders({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M3 5L5 3H15L17 5V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M3 5H17" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8C7 9.65685 8.34315 11 10 11C11.6569 11 13 9.65685 13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconCRM({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 17C4 14.2386 6.68629 12 10 12C13.3137 12 16 14.2386 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 5L16 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 3H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 3V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function IconMarketing({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M4 10V14C4 14.5523 4.44772 15 5 15H8L10 18V10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 6V14L16 17V3L10 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function IconAutomation({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M11 2L5 11H10L9 18L15 9H10L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function IconAssistant({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M10 2C5.58172 2 2 5.58172 2 10C2 11.8487 2.62835 13.551 3.69649 14.9056L3 18L6.35294 17.0588C7.45006 17.6651 8.68789 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 9H7.01M10 9H10.01M13 9H13.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
