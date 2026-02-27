'use client';

import { motion } from 'framer-motion';
import { Brain, Construction } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function LearningPage() {
    return (
        <div>
            <PageHeader
                title="Learning"
                description="Review dan approve pattern yang dipelajari AI secara otomatis"
                icon={Brain}
            />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-border p-12 text-center"
            >
                <Construction className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-text-secondary text-sm max-w-md mx-auto">
                    Halaman Learning akan tersedia di batch selanjutnya. Di sini Anda bisa
                    review pattern baru yang dipelajari AI dari interaksi chat.
                </p>
            </motion.div>
        </div>
    );
}
