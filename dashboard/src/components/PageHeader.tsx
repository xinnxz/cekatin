'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   PageHeader — Title + optional action buttons
   ═══════════════════════════════════════════════════════ */

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-8"
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[#8B5CF6] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    {description && (
                        <p className="text-text-secondary text-sm mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </motion.div>
    );
}
