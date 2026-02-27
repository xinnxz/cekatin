'use client';

import { motion } from 'framer-motion';
import { BarChart3, Construction } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function AnalyticsPage() {
    return (
        <div>
            <PageHeader
                title="Analytics"
                description="Statistik performa chatbot, AI agent, dan response time"
                icon={BarChart3}
            />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-border p-12 text-center"
            >
                <Construction className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-text-secondary text-sm max-w-md mx-auto">
                    Halaman Analytics akan tersedia di batch selanjutnya. Di sini Anda bisa
                    lihat conversation analytics, AI performance, dan human agent metrics.
                </p>
            </motion.div>
        </div>
    );
}
