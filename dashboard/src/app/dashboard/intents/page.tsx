'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { IconAIAgent, IconChat } from '@/components/icons';
import { fetcher, api } from '@/lib/api';

/* ═══════════════════════════════════════════════════════
   AI Agents / Intents Page — cekat.ai style
   
   Penjelasan:
   Sama seperti sebelumnya (CRUD intents), tapi dengan
   styling baru yang match cekat.ai — warna indigo,
   cards lebih clean, subtle borders.
   ═══════════════════════════════════════════════════════ */

interface Intent {
    id: string;
    tag: string;
    patterns: string[];
    responses: string[];
    patternsCount: number;
    responsesCount: number;
}

const fallbackIntents: Intent[] = [
    { id: '1', tag: 'greeting', patterns: ['halo', 'hi', 'hey', 'selamat pagi', 'assalamualaikum'], responses: ['Halo! Ada yang bisa dibantu?', 'Hi! Selamat datang 😊'], patternsCount: 5, responsesCount: 2 },
    { id: '2', tag: 'tanya_harga', patterns: ['berapa harganya', 'harga hp', 'price list'], responses: ['Silakan cek katalog kami!'], patternsCount: 3, responsesCount: 1 },
    { id: '3', tag: 'tanya_stok', patterns: ['stok masih ada', 'ready stock', 'tersedia gak'], responses: ['Bisa sebutkan tipe yang dimaksud?'], patternsCount: 3, responsesCount: 1 },
    { id: '4', tag: 'tanya_promo', patterns: ['ada promo', 'diskon', 'potongan harga'], responses: ['Diskon 10% untuk pembelian pertama! 🎉'], patternsCount: 3, responsesCount: 1 },
    { id: '5', tag: 'goodbye', patterns: ['bye', 'dadah', 'sampai jumpa'], responses: ['Terima kasih! 👋'], patternsCount: 3, responsesCount: 1 },
    { id: '6', tag: 'tanya_ongkir', patterns: ['ongkos kirim', 'berapa ongkirnya'], responses: ['Ongkir tergantung lokasi Anda.'], patternsCount: 2, responsesCount: 1 },
];

export default function IntentsPage() {
    const { data, error, isLoading } = useSWR<{ intents: Intent[]; total: number }>('/api/intents', fetcher, { onError: () => { } });
    const intents = data?.intents || (error ? fallbackIntents : []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredIntents = intents.filter((i) => i.tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await api(`/api/intents/${id}`, { method: 'DELETE' });
            mutate('/api/intents');
        } catch { /* noop */ }
        setIsDeleting(false);
        setShowDeleteConfirm(null);
    };

    return (
        <div className="h-[calc(100vh-52px)] flex flex-col p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                        <IconAIAgent size={20} className="text-[#4F46E5]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">AI Agents</h1>
                        <p className="text-[12.5px] text-[#6B7280]">Kelola intents, patterns, dan responses chatbot</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => mutate('/api/intents')} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors">
                        <RefreshCw className={`w-4 h-4 text-[#9CA3AF] ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-[13px] font-medium hover:bg-[#4338CA] transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tambah Intent
                    </button>
                </div>
            </div>

            {/* Warning */}
            {error && (
                <div className="mb-4 px-4 py-2.5 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-lg text-[12.5px] text-[#92400E]">
                    ⚠️ Backend offline — menampilkan data contoh.
                </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type="text" placeholder="Cari intent..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm pl-10 pr-4 py-2.5 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
                />
            </div>

            {/* Loading */}
            {isLoading && !error && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-[#4F46E5] animate-spin" />
                </div>
            )}

            {/* Table */}
            {!isLoading && (
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden flex-1">
                    <div className="grid grid-cols-[1fr_90px_90px_100px] gap-4 px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        <span>Intent Tag</span>
                        <span className="text-center">Patterns</span>
                        <span className="text-center">Responses</span>
                        <span className="text-center">Actions</span>
                    </div>
                    <div className="divide-y divide-[#F3F4F6]">
                        {filteredIntents.map((intent, i) => (
                            <motion.div
                                key={intent.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="grid grid-cols-[1fr_90px_90px_100px] gap-4 px-5 py-3.5 items-center hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                                onClick={() => setSelectedIntent(intent)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                                        <IconChat size={14} className="text-[#4F46E5]" />
                                    </div>
                                    <span className="text-[13px] font-medium text-foreground">{intent.tag}</span>
                                </div>
                                <span className="text-center text-[12px] text-[#6B7280] bg-[#F9FAFB] px-2 py-1 rounded-md">{intent.patternsCount}</span>
                                <span className="text-center text-[12px] text-[#6B7280] bg-[#F9FAFB] px-2 py-1 rounded-md">{intent.responsesCount}</span>
                                <div className="flex justify-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedIntent(intent); }} className="p-1.5 rounded-md hover:bg-[#EEF2FF] text-[#9CA3AF] hover:text-[#4F46E5] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(intent.id); }} className="p-1.5 rounded-md hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </motion.div>
                        ))}
                        {filteredIntents.length === 0 && (
                            <div className="py-12 text-center text-[13px] text-[#9CA3AF]">Tidak ada intent ditemukan</div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer stats */}
            <div className="flex items-center gap-5 mt-3 text-[12px] text-[#9CA3AF]">
                <span>Total: <strong className="text-foreground">{intents.length}</strong></span>
                <span>Patterns: <strong className="text-foreground">{intents.reduce((s, i) => s + i.patternsCount, 0)}</strong></span>
                <span>Responses: <strong className="text-foreground">{intents.reduce((s, i) => s + i.responsesCount, 0)}</strong></span>
            </div>

            {/* ═══ Detail Drawer ═══ */}
            <AnimatePresence>
                {selectedIntent && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedIntent(null)} className="fixed inset-0 bg-black/15 z-50" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-[440px] bg-white shadow-xl z-50 overflow-y-auto border-l border-[#E5E7EB]">
                            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center"><IconChat size={16} className="text-[#4F46E5]" /></div>
                                    <div>
                                        <h2 className="text-[14px] font-semibold text-foreground">{selectedIntent.tag}</h2>
                                        <p className="text-[11px] text-[#9CA3AF]">Intent Detail</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedIntent(null)} className="p-1.5 rounded-lg hover:bg-[#F3F4F6]"><X className="w-4 h-4 text-[#9CA3AF]" /></button>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <h3 className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-2">Patterns ({selectedIntent.patterns.length})</h3>
                                    <div className="space-y-1.5">
                                        {selectedIntent.patterns.map((p, i) => (
                                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#F9FAFB] rounded-lg text-[13px]">
                                                <span className="text-[#9CA3AF] text-[11px] font-mono w-4">{i + 1}</span><span>{p}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-2">Responses ({selectedIntent.responses.length})</h3>
                                    <div className="space-y-1.5">
                                        {selectedIntent.responses.map((r, i) => (
                                            <div key={i} className="px-3 py-2.5 bg-[#ECFDF5] border border-[#10B981]/15 rounded-lg text-[13px]">{r}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ Delete Dialog ═══ */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} className="fixed inset-0 bg-black/15 z-50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 z-50 w-[380px] border border-[#E5E7EB]">
                            <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] flex items-center justify-center mx-auto mb-3"><Trash2 className="w-5 h-5 text-[#EF4444]" /></div>
                            <h3 className="text-[15px] font-semibold text-foreground text-center mb-1.5">Hapus Intent?</h3>
                            <p className="text-[12.5px] text-[#6B7280] text-center mb-5">Intent &ldquo;{intents.find(i => i.id === showDeleteConfirm)?.tag}&rdquo; akan dihapus permanen.</p>
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Batal</button>
                                <button onClick={() => handleDelete(showDeleteConfirm)} disabled={isDeleting} className="flex-1 py-2 bg-[#EF4444] text-white rounded-lg text-[13px] font-medium hover:bg-[#DC2626] disabled:opacity-50 flex items-center justify-center gap-1.5">
                                    {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Hapus
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ Create Modal ═══ */}
            <AnimatePresence>
                {showCreateModal && <CreateIntentModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); mutate('/api/intents'); }} />}
            </AnimatePresence>
        </div>
    );
}

function CreateIntentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [tag, setTag] = useState('');
    const [patterns, setPatterns] = useState('');
    const [responses, setResponses] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await api('/api/intents', {
                method: 'POST',
                body: JSON.stringify({
                    tag: tag.trim().toLowerCase().replace(/\s+/g, '_'),
                    patterns: patterns.split('\n').filter(Boolean),
                    responses: responses.split('\n').filter(Boolean),
                }),
            });
            onCreated();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Gagal menyimpan');
        }
        setIsSubmitting(false);
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/15 z-50" />
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-50 w-[480px] max-h-[85vh] overflow-y-auto border border-[#E5E7EB]">
                <div className="sticky top-0 bg-white px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-foreground">Tambah Intent Baru</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F3F4F6]"><X className="w-4 h-4 text-[#9CA3AF]" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && <div className="px-3 py-2 bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg text-[12.5px] text-[#EF4444]">{error}</div>}
                    <div>
                        <label className="block text-[12.5px] font-medium text-foreground mb-1">Intent Tag</label>
                        <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="contoh: tanya_harga"
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]" required />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-foreground mb-1">Patterns <span className="text-[#9CA3AF] font-normal">(satu per baris)</span></label>
                        <textarea value={patterns} onChange={(e) => setPatterns(e.target.value)} placeholder={"berapa harganya\nharga hp\nprice list"} rows={3}
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none" required />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-foreground mb-1">Responses <span className="text-[#9CA3AF] font-normal">(satu per baris)</span></label>
                        <textarea value={responses} onChange={(e) => setResponses(e.target.value)} placeholder={"Berikut daftar harga kami:"} rows={2}
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none" required />
                    </div>
                    <div className="flex gap-2.5 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-[#4F46E5] text-white rounded-lg text-[13px] font-medium hover:bg-[#4338CA] disabled:opacity-50 flex items-center justify-center gap-1.5">
                            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan
                        </button>
                    </div>
                </form>
            </motion.div>
        </>
    );
}
