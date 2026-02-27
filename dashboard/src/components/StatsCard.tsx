'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   StatsCard — Metric card with icon, value, trend
   ═══════════════════════════════════════════════════════ */

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: { value: number; label: string };
    color?: 'primary' | 'success' | 'warning' | 'danger';
    index?: number;
}

const colorMap = {
    primary: {
        bg: 'bg-primary-50',
        icon: 'text-primary',
    },
    success: {
        bg: 'bg-success-light',
        icon: 'text-success',
    },
    warning: {
        bg: 'bg-warning-light',
        icon: 'text-warning',
    },
    danger: {
        bg: 'bg-danger-light',
        icon: 'text-danger',
    },
};

export default function StatsCard({
    label,
    value,
    icon: Icon,
    trend,
    color = 'primary',
    index = 0,
}: StatsCardProps) {
    const colors = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-text-secondary text-sm font-medium mb-1">{label}</p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    {trend && (
                        <p className={`text-xs mt-2 font-medium ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                <div className={`${colors.bg} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
            </div>
        </motion.div>
    );
}
