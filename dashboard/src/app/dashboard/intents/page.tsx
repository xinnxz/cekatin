'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import {
    MessageSquare,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Tag,
    MessageCircle,
    Reply,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { fetcher, api } from '@/lib/api';

/* ═══════════════════════════════════════════════════════
   Intents Page — CRUD connected to Flask Backend
   
   Penjelasan:
   - Fetch intents dari GET /api/intents
   - Create via POST /api/intents
   - Update via PUT /api/intents/<id>
   - Delete via DELETE /api/intents/<id>
   - SWR otomatis revalidate setelah mutasi
   ═══════════════════════════════════════════════════════ */

interface Intent {
    id: string;
    tag: string;
    patterns: string[];
    responses: string[];
    patternsCount: number;
    responsesCount: number;
}

// Fallback data jika API belum terhubung
const fallbackIntents: Intent[] = [
    { id: '1', tag: 'greeting', patterns: ['halo', 'hi', 'hey', 'selamat pagi', 'assalamualaikum'], responses: ['Halo! Ada yang bisa dibantu?', 'Hi! Selamat datang di ReonShop 😊'], patternsCount: 5, responsesCount: 2 },
    { id: '2', tag: 'tanya_harga', patterns: ['berapa harganya', 'harga hp', 'price list', 'daftar harga'], responses: ['Silakan cek katalog kami di website ya!', 'Harga tergantung tipe dan spesifikasi.'], patternsCount: 4, responsesCount: 2 },
    { id: '3', tag: 'tanya_stok', patterns: ['stok masih ada', 'ready stock', 'tersedia gak', 'ada barangnya'], responses: ['Untuk cek stok, bisa sebutkan tipe yang dimaksud?'], patternsCount: 4, responsesCount: 1 },
    { id: '4', tag: 'tanya_promo', patterns: ['ada promo', 'diskon', 'potongan harga', 'cashback'], responses: ['Promo terbaru kami! Diskon 10% untuk pembelian pertama 🎉'], patternsCount: 4, responsesCount: 1 },
    { id: '5', tag: 'goodbye', patterns: ['bye', 'dadah', 'sampai jumpa', 'makasih'], responses: ['Terima kasih sudah menghubungi kami!', 'Sampai jumpa! 👋'], patternsCount: 4, responsesCount: 2 },
];

export default function IntentsPage() {
    // SWR: fetch intents dari backend
    const { data, error, isLoading } = useSWR<{ intents: Intent[]; total: number }>(
        '/api/intents',
        fetcher,
        { onError: () => { } }
    );

    const intents = data?.intents || (error ? fallbackIntents : []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredIntents = intents.filter((intent) =>
        intent.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Delete Intent ──
    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await api(`/api/intents/${id}`, { method: 'DELETE' });
            // Revalidate SWR cache
            mutate('/api/intents');
            mutate('/api/dashboard/stats');
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(null);
        }
    };

    return (
        <div>
            <PageHeader
                title="Intents"
                description="Kelola semua intent, pattern, dan response chatbot Anda"
                icon={MessageSquare}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => mutate('/api/intents')}
                            className="p-2.5 border border-border rounded-xl hover:bg-background transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Intent
                        </button>
                    </div>
                }
            />

            {/* API Warning */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 px-4 py-3 bg-warning-light border border-warning/30 rounded-xl text-sm text-warning flex items-center gap-2"
                >
                    <span>⚠️</span>
                    <span>Backend offline — menampilkan data contoh. Jalankan Flask server untuk CRUD.</span>
                </motion.div>
            )}

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    placeholder="Cari intent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md pl-11 pr-4 py-3 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

            {/* Loading State */}
            {isLoading && !error && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            )}

            {/* Intents Table */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-2xl border border-border overflow-hidden"
                >
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_100px_100px_120px] gap-4 px-6 py-3.5 bg-background/50 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <span>Intent Tag</span>
                        <span className="text-center">Patterns</span>
                        <span className="text-center">Responses</span>
                        <span className="text-center">Actions</span>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border">
                        {filteredIntents.map((intent, i) => (
                            <motion.div
                                key={intent.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="grid grid-cols-[1fr_100px_100px_120px] gap-4 px-6 py-4 items-center hover:bg-primary-50/30 transition-colors cursor-pointer group"
                                onClick={() => setSelectedIntent(intent)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                                        <Tag className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground text-sm">{intent.tag}</span>
                                </div>
                                <div className="flex justify-center">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary bg-background px-2.5 py-1 rounded-lg">
                                        <MessageCircle className="w-3 h-3" /> {intent.patternsCount}
                                    </span>
                                </div>
                                <div className="flex justify-center">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary bg-background px-2.5 py-1 rounded-lg">
                                        <Reply className="w-3 h-3" /> {intent.responsesCount}
                                    </span>
                                </div>
                                <div className="flex justify-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedIntent(intent); }}
                                        className="p-2 rounded-lg hover:bg-primary-light text-text-secondary hover:text-primary transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(intent.id); }}
                                        className="p-2 rounded-lg hover:bg-danger-light text-text-secondary hover:text-danger transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {filteredIntents.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                <p className="text-text-secondary font-medium">Tidak ada intent ditemukan</p>
                                <p className="text-text-muted text-sm mt-1">Coba kata kunci lain atau tambah intent baru</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Stats Footer */}
            <div className="flex items-center gap-6 mt-4 text-sm text-text-secondary">
                <span>Total: <strong className="text-foreground">{intents.length}</strong> intents</span>
                <span>Patterns: <strong className="text-foreground">{intents.reduce((sum, i) => sum + i.patternsCount, 0)}</strong></span>
                <span>Responses: <strong className="text-foreground">{intents.reduce((sum, i) => sum + i.responsesCount, 0)}</strong></span>
            </div>

            {/* ═══ Intent Detail Drawer ═══ */}
            <AnimatePresence>
                {selectedIntent && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedIntent(null)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                        <Tag className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-foreground">{selectedIntent.tag}</h2>
                                        <p className="text-xs text-text-muted">Intent Detail</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedIntent(null)} className="p-2 rounded-xl hover:bg-background transition-colors">
                                    <X className="w-5 h-5 text-text-secondary" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-primary" />
                                        Patterns ({selectedIntent.patterns.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedIntent.patterns.map((pattern, i) => (
                                            <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-background rounded-xl text-sm text-foreground">
                                                <span className="text-text-muted text-xs font-mono">{i + 1}</span>
                                                <span>{pattern}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Reply className="w-4 h-4 text-success" />
                                        Responses ({selectedIntent.responses.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedIntent.responses.map((response, i) => (
                                            <div key={i} className="px-4 py-3 bg-success-light/30 border border-success/20 rounded-xl text-sm text-foreground">
                                                {response}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ Delete Confirmation ═══ */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(null)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 w-[400px]"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-danger-light flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-danger" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground text-center mb-2">Hapus Intent?</h3>
                            <p className="text-sm text-text-secondary text-center mb-6">
                                Intent &ldquo;{intents.find((i) => i.id === showDeleteConfirm)?.tag}&rdquo; beserta semua patterns dan responses akan dihapus.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-2.5 px-4 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-background transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 bg-danger text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Ya, Hapus
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ Create Modal ═══ */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateIntentModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            mutate('/api/intents');
                            mutate('/api/dashboard/stats');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════
   Create Intent Modal — POST /api/intents
   ═══════════════════════════════════════════════════════ */

function CreateIntentModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [tag, setTag] = useState('');
    const [patterns, setPatterns] = useState('');
    const [responses, setResponses] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const patternList = patterns.split('\n').filter(Boolean);
        const responseList = responses.split('\n').filter(Boolean);

        try {
            await api('/api/intents', {
                method: 'POST',
                body: JSON.stringify({
                    tag: tag.trim().toLowerCase().replace(/\s+/g, '_'),
                    patterns: patternList,
                    responses: responseList,
                }),
            });
            onCreated();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Gagal menyimpan intent';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[520px] max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Tambah Intent Baru</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-background transition-colors">
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="px-4 py-3 bg-danger-light border border-danger/20 rounded-xl text-sm text-danger">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Intent Tag</label>
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="contoh: tanya_harga"
                            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            required
                        />
                        <p className="text-xs text-text-muted mt-1">Nama unik untuk intent ini (huruf kecil, pakai underscore)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Patterns <span className="text-text-muted font-normal">(satu per baris)</span>
                        </label>
                        <textarea
                            value={patterns}
                            onChange={(e) => setPatterns(e.target.value)}
                            placeholder={"berapa harganya\nharga hp\nprice list\nkasih tau harga dong"}
                            rows={4}
                            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Responses <span className="text-text-muted font-normal">(satu per baris)</span>
                        </label>
                        <textarea
                            value={responses}
                            onChange={(e) => setResponses(e.target.value)}
                            placeholder={"Berikut daftar harga kami:\nSilakan cek katalog di website ya!"}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-background transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Intent
                        </button>
                    </div>
                </form>
            </motion.div>
        </>
    );
}
