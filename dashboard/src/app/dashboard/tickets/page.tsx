'use client';
import { motion } from 'framer-motion';
import { IconTicket } from '@/components/icons';

export default function TicketsPage() {
    return (
        <div className="h-[calc(100vh-52px)] flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
                    <IconTicket size={28} className="text-[#4F46E5]" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1.5">Tickets</h2>
                <p className="text-[13px] text-[#6B7280] max-w-xs mx-auto">Halaman Tickets akan tersedia di batch selanjutnya. Kelola tiket support pelanggan Anda di sini.</p>
            </motion.div>
        </div>
    );
}
