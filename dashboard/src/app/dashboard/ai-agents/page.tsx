'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Settings, Copy, Trash2, Plus, X, Search, Clock,
    Send, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
    Bold, Italic, Image, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Globe, FileText, HelpCircle, ShoppingBag, Undo2, Redo2,
    Zap, Bot, User, MoreVertical, Save,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   AI Agents Page — Persis cekat.ai/chatbots
   
   2 halaman utama:
   A) LIST VIEW — Grid agent cards + Create New card + search
   B) DETAIL VIEW — 6 tabs (General, Knowledge Sources, 
      Integrations, Followups, Evaluation, Orchestration)
   ═══════════════════════════════════════════════════════════════ */

type AgentTab = 'general' | 'knowledge' | 'integrations' | 'followups' | 'evaluation' | 'orchestration';
type KnowledgeSubTab = 'text' | 'website' | 'file' | 'qa' | 'product';
type PageView = 'list' | 'detail';

// ── Sample Agents ──
const sampleAgents = [
    { id: '1', name: 'Cika', initials: 'CI', description: 'Customer Service AI untuk ReonShop', lastTrained: '27 Feb 2026' },
    { id: '2', name: 'Reon Sales Bot', initials: 'RS', description: 'AI untuk handle inquiry penjualan', lastTrained: '26 Feb 2026' },
];

// ── Integration Apps ──
const integrationApps = [
    { name: 'File Generator', desc: 'Berfungsi untuk menghasilkan file dalam bentuk .csv, .xlsx, dll. Berdasarkan prompt yang diberikan', icon: '📁', active: false },
    { name: 'Image Edit', desc: 'Edit dan buat gambar berdasarkan prompt atau gambar yang diberikan user', icon: '🖼️', active: false },
    { name: 'Web Search', desc: 'Cari informasi terkini dari web untuk menjawab pertanyaan pelanggan dengan data real-time', icon: '🌐', active: true },
    { name: 'CRM Integration', desc: 'Hubungkan AI dengan CRM Anda untuk mengambil data dan membuat atau mengupdate data di CRM', icon: '📊', active: false },
    { name: 'Orders', desc: 'Hubungkan AI dengan sistem Orders agar AI dapat membuat order secara otomatis', icon: '📦', active: false },
    { name: 'Cek Ongkos Kirim', desc: 'Mengecek ongkir dari berbagai kurir dan mendapatkan status pengiriman', icon: '🚚', active: false },
];

// ── Evaluation sample ──
const evalData = [
    { contact: 'Budi Santoso', response: 'Halo! Selamat datang di ReonShop...', createdAt: '27 Feb 10:30', feedback: 'positive' },
    { contact: 'Ani Wijaya', response: 'Untuk produk iPhone 15, tersedia...', createdAt: '27 Feb 09:15', feedback: 'neutral' },
    { contact: 'Dedi Mulyadi', response: 'Maaf, saat ini stok habis...', createdAt: '26 Feb 14:00', feedback: 'negative' },
];

// ══════════════════════════════════════════
// CREATE MODAL
// ══════════════════════════════════════════

function CreateAgentModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
    const [name, setName] = useState('');
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl w-[440px] p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[17px] font-bold text-foreground">Create New AI Agent</h2>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                        <X className="w-4 h-4 text-[#6B7280]" />
                    </button>
                </div>
                <div className="mb-4">
                    <label className="text-[13px] font-medium text-foreground block mb-1.5">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter AI name"
                        className="w-full border-b border-[#E5E7EB] py-2 text-[13px] focus:outline-none focus:border-primary" />
                </div>
                <div className="mb-6">
                    <label className="text-[13px] font-medium text-foreground block mb-1.5">Template</label>
                    <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary">
                        <option>Customer Service AI</option>
                        <option>Sales AI</option>
                        <option>General Assistant</option>
                    </select>
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5">This AI agent is designed to help you with customer support and sales inquiries for your business.</p>
                </div>
                <button onClick={() => { onCreate(name || 'New Agent'); onClose(); setName(''); }}
                    className="w-full py-2.5 text-[13px] font-semibold text-white bg-foreground hover:bg-[#1F2937] rounded-lg">
                    Create AI Agent
                </button>
            </motion.div>
        </div>
    );
}

// ══════════════════════════════════════════
// GENERAL TAB
// ══════════════════════════════════════════

function GeneralTab({ agent }: { agent: typeof sampleAgents[0] }) {
    const [stopAfterHandoff, setStopAfterHandoff] = useState(false);
    const [silentHandoff, setSilentHandoff] = useState(false);
    const [aiActionsOpen, setAiActionsOpen] = useState(false);
    const [additionalOpen, setAdditionalOpen] = useState(false);
    const [behaviorText, setBehaviorText] = useState(
        'Kamu adalah Customer Service untuk bisnis bernama Reon. Tugas-mu memberi informasi yang jelas, singkat, dan membantu. Gaya bicara-mu ramah, semi-formal, dan pakai emoji untuk berekspresi. Kamu tidak boleh menjawab pertanyaan yang tidak berkaitan dengan Reon.'
    );
    const [welcomeMsg, setWelcomeMsg] = useState(
        'Halo! Selamat datang di Reon. Saya asisten AI yang akan menjawab semua pertanyaan mu tentang Reon.'
    );
    const [transferCond, setTransferCond] = useState('When the customer wants to purchase');

    return (
        <div className="flex gap-6">
            {/* Left — Settings */}
            <div className="flex-1 max-w-[600px] mx-auto space-y-0">
                {/* Name + Desc + Last Trained */}
                <div className="text-center mb-6">
                    <h2 className="text-[18px] font-bold text-foreground">{agent.name}</h2>
                    <p className="text-[12px] text-[#9CA3AF]">Description</p>
                    <p className="text-[12px] font-medium text-foreground mt-1">Last Trained: <span className="font-normal">{agent.lastTrained}</span></p>
                </div>

                {/* AI Agent Behavior */}
                <div className="mb-5">
                    <h3 className="text-[14px] font-semibold text-primary text-center mb-1">AI Agent Behavior</h3>
                    <p className="text-[11px] text-[#9CA3AF] text-center mb-2">Ini adalah Prompt AI yang akan mengatur gaya bicara dan identitas AI nya.</p>
                    <textarea value={behaviorText} onChange={e => setBehaviorText(e.target.value)}
                        rows={6} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[12.5px] focus:outline-none focus:border-primary resize-y" />
                    <p className="text-[10px] text-[#9CA3AF] text-right mt-0.5">{behaviorText.length}/5000</p>
                </div>

                {/* Welcome Message */}
                <div className="mb-5">
                    <h3 className="text-[14px] font-semibold text-primary text-center mb-1">Welcome Message</h3>
                    <p className="text-[11px] text-[#9CA3AF] text-center mb-1">Pesan pertama yang akan dikirim AI kepada user.</p>
                    <p className="text-[11px] text-primary text-center mb-2 cursor-pointer hover:underline">Upload gambar untuk Welcome Message</p>
                    <textarea value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)}
                        rows={2} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[12.5px] focus:outline-none focus:border-primary resize-y" />
                </div>

                {/* Agent Transfer Conditions */}
                <div className="mb-5">
                    <h3 className="text-[14px] font-semibold text-primary text-center mb-1">Agent Transfer Conditions</h3>
                    <p className="text-[10.5px] text-[#9CA3AF] text-center mb-2">
                        Tentukan kondisi yang akan memicu AI untuk mentransfer chat ke agen manusia.
                        Status chat akan menjadi <span className="text-primary font-medium">Pending</span> dan akan muncul di tab <span className="text-primary font-medium underline">Chat Assigned</span>
                    </p>
                    <textarea value={transferCond} onChange={e => setTransferCond(e.target.value)}
                        rows={3} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[12.5px] focus:outline-none focus:border-primary resize-y" />
                    <p className="text-[10px] text-[#9CA3AF] text-right mt-0.5">0/1000</p>
                </div>

                {/* Toggles */}
                <div className="space-y-4 mb-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-foreground">Stop AI after Handoff</p>
                            <p className="text-[11px] text-red-500">Hentikan AI mengirim pesan setelah status chat berubah menjadi Pending.</p>
                        </div>
                        <button onClick={() => setStopAfterHandoff(!stopAfterHandoff)}
                            className={`w-11 h-6 rounded-full transition-colors ${stopAfterHandoff ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${stopAfterHandoff ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-foreground">Silent Agent Handoff</p>
                            <p className="text-[11px] text-red-500">AI mengalihkan percakapan ke agen tanpa ada balasan lagi dari AI.</p>
                        </div>
                        <button onClick={() => setSilentHandoff(!silentHandoff)}
                            className={`w-11 h-6 rounded-full transition-colors ${silentHandoff ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${silentHandoff ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                        </button>
                    </div>
                </div>

                {/* AI Actions (expandable) */}
                <button onClick={() => setAiActionsOpen(!aiActionsOpen)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F3F4F6] mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[13px] font-semibold text-foreground">AI Actions</p>
                        <p className="text-[10.5px] text-[#9CA3AF]">Configure labels and pipeline statuses that AI can use automatically</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform ${aiActionsOpen ? 'rotate-180' : ''}`} />
                </button>
                {aiActionsOpen && (
                    <div className="border border-[#E5E7EB] rounded-lg p-4 mb-4 text-[12px] text-[#6B7280]">
                        <p className="mb-2 font-medium">Auto-assign labels when AI detects:</p>
                        <div className="space-y-2">
                            {['Order Inquiry', 'Complaint', 'Product Question'].map(label => (
                                <label key={label} className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded border-[#D1D5DB] text-primary" />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Model */}
                <div className="mb-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-foreground">AI Model</p>
                            <p className="text-[10.5px] text-[#9CA3AF]">Select your AI model</p>
                        </div>
                    </div>
                    <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary">
                        <option>Standard — 1 credits per response</option>
                        <option>Advanced — 3 credits per response</option>
                        <option>Premium — 5 credits per response</option>
                    </select>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">Note: AI credit usage depends on prompt complexity and tools used. The displayed amount is an estimate and may vary.</p>
                </div>

                {/* Additional Settings */}
                <button onClick={() => setAdditionalOpen(!additionalOpen)}
                    className="text-[13px] text-primary font-medium hover:underline mb-4 flex items-center gap-1">
                    Additional Settings <ChevronDown className={`w-3.5 h-3.5 transition-transform ${additionalOpen ? 'rotate-180' : ''}`} />
                </button>
                {additionalOpen && (
                    <div className="border border-[#E5E7EB] rounded-lg p-4 mb-4 space-y-3">
                        <div>
                            <label className="text-[12px] font-medium text-foreground block mb-1">Response Language</label>
                            <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px] bg-white">
                                <option>Auto-detect</option>
                                <option>Indonesian</option>
                                <option>English</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-medium text-foreground block mb-1">Max Response Length</label>
                            <input type="number" defaultValue={500} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px]" />
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="text-center pt-2 pb-6">
                    <button className="px-8 py-2.5 text-[13px] font-semibold text-white bg-foreground hover:bg-[#1F2937] rounded-lg">
                        Save All Settings
                    </button>
                </div>
            </div>

            {/* Right — Chat Preview */}
            <div className="w-[300px] flex-shrink-0 hidden xl:block">
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden sticky top-4">
                    <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[13px] font-semibold text-foreground">{agent.name}</span>
                        <button className="ml-auto"><RefreshCw className="w-3.5 h-3.5 text-[#9CA3AF]" /></button>
                    </div>
                    <div className="bg-[#F9FAFB] p-3 h-[350px] overflow-y-auto space-y-2">
                        <div className="bg-white rounded-lg px-3 py-2 text-[11.5px] text-[#6B7280] shadow-sm max-w-[85%]">
                            {welcomeMsg}
                        </div>
                    </div>
                    <div className="bg-white border-t border-[#E5E7EB] px-3 py-2.5 flex items-center gap-2">
                        <input placeholder="Type your message..." className="flex-1 text-[12px] bg-transparent focus:outline-none" />
                        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white">
                            <Send className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// KNOWLEDGE SOURCES TAB
// ══════════════════════════════════════════

function KnowledgeSourcesTab() {
    const [subTab, setSubTab] = useState<KnowledgeSubTab>('text');
    const subTabs: { key: KnowledgeSubTab; label: string; icon: React.ReactNode }[] = [
        { key: 'text', label: 'Text', icon: <FileText className="w-3.5 h-3.5" /> },
        { key: 'website', label: 'Website', icon: <Globe className="w-3.5 h-3.5" /> },
        { key: 'file', label: 'File', icon: <FileText className="w-3.5 h-3.5" /> },
        { key: 'qa', label: 'Q&A', icon: <HelpCircle className="w-3.5 h-3.5" /> },
        { key: 'product', label: 'Product', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    ];

    return (
        <div>
            {/* Sub tabs */}
            <div className="flex items-center gap-0 border-b border-[#E5E7EB] mb-4">
                {subTabs.map(st => (
                    <button key={st.key} onClick={() => setSubTab(st.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-medium border-b-2 transition-colors ${subTab === st.key ? 'text-primary border-primary' : 'text-[#6B7280] border-transparent hover:text-foreground'
                            }`}>
                        {st.icon} {st.label}
                    </button>
                ))}
            </div>

            {/* Content based on sub tab */}
            {subTab === 'text' && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Plus className="w-4 h-4 text-[#6B7280]" /></button>
                        <span className="px-3 py-1 bg-primary text-white text-[12px] font-medium rounded-lg flex items-center gap-1">Default ✏️</span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1">
                            <ChevronLeft className="w-4 h-4 text-[#9CA3AF]" />
                            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                        </div>
                        <button className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#9CA3AF] rounded-lg">Save</button>
                    </div>
                    {/* Rich text toolbar */}
                    <div className="flex items-center gap-1 p-2 border border-[#E5E7EB] border-b-0 rounded-t-lg bg-[#F9FAFB]">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><Undo2 className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><Redo2 className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><Bold className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><Italic className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><Image className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><AlignLeft className="w-3.5 h-3.5 text-primary" /></button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><AlignCenter className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><AlignRight className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#E5E7EB]"><AlignJustify className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                    </div>
                    <textarea rows={14} placeholder="Enter knowledge base text here..." className="w-full border border-[#E5E7EB] rounded-b-lg p-4 text-[13px] focus:outline-none focus:border-primary resize-y min-h-[300px]" />
                </div>
            )}

            {subTab === 'website' && (
                <div className="space-y-3">
                    <p className="text-[12.5px] text-[#6B7280]">Add website URLs for the AI to crawl and learn from.</p>
                    <div className="flex gap-2">
                        <input placeholder="https://example.com" className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                        <button className="px-4 py-2.5 text-[12px] font-semibold text-white bg-primary rounded-lg">Add URL</button>
                    </div>
                    <div className="border border-[#E5E7EB] rounded-lg p-4 text-center text-[12px] text-[#9CA3AF]">No websites added yet</div>
                </div>
            )}

            {subTab === 'file' && (
                <div className="space-y-3">
                    <p className="text-[12.5px] text-[#6B7280]">Upload documents (PDF, DOCX, TXT) for the AI to learn from.</p>
                    <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-10 text-center hover:border-primary/40 transition-colors cursor-pointer">
                        <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                        <p className="text-[13px] font-medium text-foreground">Drop files here or click to upload</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-1">Supported: PDF, DOCX, TXT (max 10MB)</p>
                    </div>
                </div>
            )}

            {subTab === 'qa' && (
                <div className="space-y-3">
                    <p className="text-[12.5px] text-[#6B7280]">Add question-answer pairs for the AI to learn specific responses.</p>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                        <Plus className="w-3.5 h-3.5" /> Add Q&A
                    </button>
                    <div className="border border-[#E5E7EB] rounded-lg p-4 text-center text-[12px] text-[#9CA3AF]">No Q&A pairs added yet</div>
                </div>
            )}

            {subTab === 'product' && (
                <div className="space-y-3">
                    <p className="text-[12.5px] text-[#6B7280]">Add product catalog data for the AI to reference.</p>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                    <div className="border border-[#E5E7EB] rounded-lg p-4 text-center text-[12px] text-[#9CA3AF]">No products added yet</div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════
// INTEGRATIONS TAB
// ══════════════════════════════════════════

function IntegrationsTab() {
    return (
        <div className="max-w-[1100px] mx-auto">
            <div className="mb-5">
                <h2 className="text-[20px] font-bold text-foreground">Connected Apps</h2>
                <p className="text-[13px] text-[#6B7280]">Connect your chatbot with third-party applications to extend its functionality.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {integrationApps.map((app, i) => (
                    <div key={i} className="border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-[11px] font-medium ${app.active ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                                {app.active ? 'Active' : 'Inactive'}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${app.active ? 'bg-green-500' : 'bg-[#D1D5DB]'}`} />
                        </div>
                        <div className="flex items-start gap-3 mb-4">
                            <span className="text-2xl">{app.icon}</span>
                            <div>
                                <h3 className="text-[14px] font-semibold text-foreground">{app.name}</h3>
                                <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">{app.desc}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-[11px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">Settings</button>
                            <button className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border ${app.active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-primary border-primary hover:bg-[#EEF2FF]'
                                }`}>
                                {app.active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// FOLLOWUPS TAB
// ══════════════════════════════════════════

function FollowupsTab() {
    return (
        <div className="max-w-[900px] mx-auto">
            <h2 className="text-[20px] font-bold text-foreground mb-2">Followups</h2>
            <div className="space-y-1 mb-4">
                <p className="text-[12.5px] text-[#6B7280]">Tambahkan pesan Followup yang akan dikirim kepada pelanggan setelah jeda waktu tertentu.</p>
                <p className="text-[12.5px] text-[#6B7280]">Isi dengan prompt. Prompt adalah arahan yang AI akan pakai untuk menulis Followup sesuai dengan history chat dan knowledge anda.</p>
                <p className="text-[12.5px] text-[#6B7280]">Anda juga bisa menulis kondisi Handoff to Agent anda di Prompt</p>
                <p className="text-[12.5px] text-primary cursor-pointer hover:underline">Anda bisa mengirim gambar di followup. Klik disini untuk Upload gambar.</p>
            </div>
            <div className="flex items-center justify-between">
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Followup
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg">
                    <Save className="w-3.5 h-3.5" /> Save Followups
                </button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// EVALUATION TAB
// ══════════════════════════════════════════

function EvaluationTab() {
    return (
        <div>
            <h2 className="text-[18px] font-bold text-foreground mb-4">AI Evaluation Documents</h2>
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['Contact Name', 'AI Response', 'Created At', 'Actions'].map(col => (
                                <th key={col} className="px-4 py-3 text-left text-[12px] font-semibold text-primary">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {evalData.map((row, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                <td className="px-4 py-3 text-[12.5px] font-medium text-foreground">{row.contact}</td>
                                <td className="px-4 py-3 text-[12.5px] text-[#6B7280] max-w-[300px] truncate">{row.response}</td>
                                <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.createdAt}</td>
                                <td className="px-4 py-3 flex gap-1">
                                    <button className="px-2 py-1 text-[10px] rounded bg-green-50 text-green-600 border border-green-200 hover:bg-green-100">👍</button>
                                    <button className="px-2 py-1 text-[10px] rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">👎</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    Showing <select className="border border-[#E5E7EB] rounded px-1.5 py-0.5 text-[12px]"><option>20</option></select> of {evalData.length} results
                </div>
                <div className="flex gap-1">
                    <button disabled className="px-3 py-1.5 text-[12px] text-[#9CA3AF] border border-[#E5E7EB] rounded-lg">← Previous</button>
                    <button className="px-3 py-1.5 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">Next →</button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// ORCHESTRATION TAB
// ══════════════════════════════════════════

function OrchestrationTab() {
    const [enabled, setEnabled] = useState(false);
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-bold text-foreground">AI Agent Orchestration</h2>
                    <button onClick={() => setEnabled(!enabled)}
                        className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                    <span className="text-[12px] text-[#6B7280]">{enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg">
                        <Plus className="w-3.5 h-3.5" /> Add Child Agent
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg">
                        <Save className="w-3.5 h-3.5" /> Save Configuration
                    </button>
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">i</span>
                </div>
                <p className="text-[12px] text-[#374151] leading-relaxed">
                    This feature allows AI to handoff or switch to other AI agents smoothly based on the condition provided.
                    Configure parent and child agents to create intelligent routing workflows that automatically route conversations to the most appropriate agent.
                </p>
            </div>

            {/* Orchestration canvas */}
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 min-h-[350px] bg-[#FAFBFC] relative"
                style={{ backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {/* Parent Agent Card */}
                <div className="w-[280px] mx-auto">
                    <div className="bg-[#FDCF9E] rounded-xl overflow-hidden shadow-md">
                        <div className="px-5 py-3 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-[#92400E]" />
                            <span className="text-[14px] font-semibold text-[#92400E]">Parent Agent</span>
                            <button className="ml-auto"><span className="text-[#92400E]">✏️</span></button>
                        </div>
                        <div className="bg-white/60 px-5 py-3">
                            <p className="text-[10px] text-[#9CA3AF] uppercase font-medium tracking-wider">ASSIGN BACK TO PARENT CONDITION</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">No Revert To Parent Condition set</p>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-[#9CA3AF] mx-auto" />
                    <div className="w-2 h-2 rounded-full bg-[#9CA3AF] mx-auto" />
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════

export default function AIAgentsPage() {
    const [view, setView] = useState<PageView>('list');
    const [activeTab, setActiveTab] = useState<AgentTab>('general');
    const [selectedAgent, setSelectedAgent] = useState(sampleAgents[0]);
    const [createModal, setCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const tabs: { key: AgentTab; label: string }[] = [
        { key: 'general', label: 'General' },
        { key: 'knowledge', label: 'Knowledge Sources' },
        { key: 'integrations', label: 'Integrations' },
        { key: 'followups', label: 'Followups' },
        { key: 'evaluation', label: 'Evaluation' },
        { key: 'orchestration', label: 'Orchestration' },
    ];

    const openAgent = (agent: typeof sampleAgents[0]) => {
        setSelectedAgent(agent);
        setActiveTab('general');
        setView('detail');
    };

    if (view === 'list') {
        return (
            <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
                <CreateAgentModal open={createModal} onClose={() => setCreateModal(false)}
                    onCreate={(name) => { /* Add agent logic */ }} />
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[800px] mx-auto py-12 px-6">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h1 className="text-[28px] font-bold text-foreground mb-2">AI Agents</h1>
                            <p className="text-[13px] text-[#6B7280]">Ini adalah halaman di mana Anda dapat mengunjungi AI yang telah Anda buat sebelumnya.</p>
                            <p className="text-[13px] text-[#6B7280]">Jangan ragu untuk membuat perubahan dan membuat chatbot sebanyak yang Anda inginkan kapan saja!</p>
                        </div>

                        {/* Search + Sort */}
                        <div className="flex items-center gap-2 justify-center mb-8">
                            <div className="relative w-[320px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search AI agents..."
                                    className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[#E5E7EB] rounded-full bg-white focus:outline-none focus:border-primary" />
                            </div>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                <Clock className="w-4 h-4 text-[#6B7280]" />
                            </button>
                        </div>

                        {/* Agent Cards Grid */}
                        <div className="grid grid-cols-2 gap-5">
                            {sampleAgents
                                .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(agent => (
                                    <div key={agent.id}
                                        className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                                        {/* Accent gradient bar */}
                                        <div className="h-1.5 bg-gradient-to-r from-primary via-[#6366F1] to-[#8B5CF6]" />
                                        <div className="p-5 text-center">
                                            <h3 className="text-[15px] font-bold text-foreground mb-3">{agent.name}</h3>
                                            {/* Robot/Bot Avatar — cekat.ai style */}
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 via-[#6366F1]/10 to-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-3 border border-primary/20">
                                                <Bot className="w-7 h-7 text-primary" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] mb-4">{agent.description || '-'}</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openAgent(agent)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                                                    <Settings className="w-3 h-3" /> Settings
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center border border-primary rounded-lg text-primary hover:bg-[#EEF2FF]">
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center border border-red-200 rounded-lg text-red-500 hover:bg-red-50">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Create New Card */}
                            <button
                                onClick={() => setCreateModal(true)}
                                className="bg-primary rounded-2xl p-5 text-center text-white hover:bg-primary-hover transition-colors min-h-[200px] flex flex-col items-center justify-center"
                            >
                                <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center mb-3">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[16px] font-bold">Create New</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════ DETAIL VIEW ═══════
    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
            {/* Header */}
            <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setView('list')} className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-foreground px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <h1 className="text-[18px] font-bold text-foreground">{selectedAgent.name}</h1>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                        <MoreVertical className="w-4 h-4 text-[#6B7280]" />
                    </button>
                </div>
                {/* Tabs */}
                <div className="flex items-center justify-center gap-0">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-[12.5px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab.key ? 'text-primary border-primary' : 'text-[#6B7280] border-transparent hover:text-foreground'
                                }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
                {activeTab === 'general' && <GeneralTab agent={selectedAgent} />}
                {activeTab === 'knowledge' && <KnowledgeSourcesTab />}
                {activeTab === 'integrations' && <IntegrationsTab />}
                {activeTab === 'followups' && <FollowupsTab />}
                {activeTab === 'evaluation' && <EvaluationTab />}
                {activeTab === 'orchestration' && <OrchestrationTab />}
            </div>
        </div>
    );
}
