'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SlidersHorizontal, Plus, X, ChevronLeft, ChevronRight,
    MoreHorizontal, Upload, Users, RefreshCw,
    Bold, Italic, Strikethrough, Variable,
    ChevronDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Broadcasts Page — Persis cekat.ai/broadcasts ("Broadcast Settings")
   
   Penjelasan layout dari screenshot:
   
   ┌──────────────────────────────────────────────────────────────┐
   │ Broadcast Settings                                          │
   │ [👥 Recipient]  [📝 Template Message]  [📢 Campaign]         │
   ├──────────────────────────────────────────────────────────────┤
   │ [Filter]                               [Add Campaign/etc]   │
   ├──────────────────────────────────────────────────────────────┤
   │  (Table content per tab)                                    │
   ├──────────────────────────────────────────────────────────────┤
   │ ← Page [1] of 1 →    Item per page: [100 rows] Total: N    │
   └──────────────────────────────────────────────────────────────┘
   
   3 Tabs:
   1. Recipient — daftar kontak penerima (upload CSV / select CRM)
   2. Template Message — template WhatsApp (sync META, nama/body/buttons)
   3. Campaign — kirim broadcast (sender, recipients, template, schedule)
   
   Each tab has its own:
   - Table with columns
   - Add button with modal/form
   - Sample data
   ═══════════════════════════════════════════════════════════════ */

type BroadcastTab = 'recipient' | 'template' | 'campaign';

// ──────────────────────────────────────────────────
// SAMPLE DATA
// ──────────────────────────────────────────────────

const sampleRecipients = [
    { id: '1', name: 'Pelanggan VIP', source: 'Upload File', createdAt: '25 Feb 2026', status: 'Completed', count: 156 },
    { id: '2', name: 'Promo Maret', source: 'Upload Contacts', createdAt: '26 Feb 2026', status: 'Completed', count: 89 },
    { id: '3', name: 'Newsletter Subscriber', source: 'Upload File', createdAt: '27 Feb 2026', status: 'Processing', count: 312 },
];

const sampleTemplates = [
    { id: '1', name: 'welcome_message', type: 'Text', platform: 'WhatsApp', language: 'Indonesian', category: 'UTILITY', status: 'Approved', wabaId: 'WABA-001' },
    { id: '2', name: 'promo_march', type: 'Media', platform: 'WhatsApp', language: 'Indonesian', category: 'MARKETING', status: 'Approved', wabaId: 'WABA-001' },
    { id: '3', name: 'order_confirmation', type: 'Text', platform: 'WhatsApp', language: 'Indonesian', category: 'UTILITY', status: 'Pending', wabaId: 'WABA-001' },
    { id: '4', name: 'feedback_request', type: 'Text', platform: 'WhatsApp', language: 'Indonesian', category: 'MARKETING', status: 'Rejected', wabaId: 'WABA-001' },
];

const sampleCampaigns = [
    { id: '1', name: 'Flash Sale Februari', recipientList: 'Pelanggan VIP', delivered: '152/156', status: 'Completed', sender: 'ReonShop WA', createdAt: '25 Feb 2026', sendAt: '25 Feb 10:00' },
    { id: '2', name: 'Promo Maret Early', recipientList: 'Promo Maret', delivered: '0/89', status: 'Scheduled', sender: 'ReonShop WA', createdAt: '27 Feb 2026', sendAt: '1 Mar 09:00' },
    { id: '3', name: 'Welcome Series', recipientList: 'Newsletter Subscriber', delivered: '45/312', status: 'In Progress', sender: 'ReonShop WA', createdAt: '27 Feb 2026', sendAt: '27 Feb 14:00' },
];

// ──────────────────────────────────────────────────
// STATUS BADGE
// ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'Completed': 'bg-green-50 text-green-600 border-green-200',
        'Approved': 'bg-green-50 text-green-600 border-green-200',
        'Processing': 'bg-blue-50 text-blue-600 border-blue-200',
        'In Progress': 'bg-blue-50 text-blue-600 border-blue-200',
        'Scheduled': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Rejected': 'bg-red-50 text-red-600 border-red-200',
        'Failed': 'bg-red-50 text-red-600 border-red-200',
    };
    return (
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${colors[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    );
}

// ──────────────────────────────────────────────────
// ADD CAMPAIGN MODAL
// ──────────────────────────────────────────────────

function AddCampaignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [schedule, setSchedule] = useState(false);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl w-[680px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-[18px] font-bold text-foreground">New Campaign</h2>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                            <X className="w-5 h-5 text-[#6B7280]" />
                        </button>
                    </div>
                    <p className="text-[12px] text-red-500 mb-6">
                        IMPORTANT: To use this feature, please ensure you have added a payment method to your WhatsApp number <span className="underline cursor-pointer">here</span>.
                    </p>

                    {/* Campaign Name */}
                    <div className="mb-4">
                        <label className="text-[13px] font-semibold text-foreground block mb-1.5">Campaign Name</label>
                        <input type="text" placeholder="Campaign Name" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                    </div>

                    {/* Sender */}
                    <div className="mb-4">
                        <label className="text-[13px] font-semibold text-foreground block mb-1.5">Sender</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary text-[#9CA3AF]">
                            <option>Select Sender</option>
                            <option>ReonShop WhatsApp</option>
                        </select>
                    </div>

                    {/* Recipient List */}
                    <div className="mb-4">
                        <label className="text-[13px] font-semibold text-foreground block mb-1.5">Recipient List</label>
                        <input type="text" placeholder="Search Recipients" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                    </div>

                    {/* Label List */}
                    <div className="mb-4">
                        <label className="text-[13px] font-semibold text-foreground block mb-1.5">Label List</label>
                        <input type="text" placeholder="Search Label" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                    </div>

                    {/* Template List */}
                    <div className="mb-4">
                        <label className="text-[13px] font-semibold text-foreground block mb-1.5">Template List</label>
                        <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary text-[#9CA3AF]">
                            <option>Select a Sender</option>
                        </select>
                        <p className="text-[11px] text-[#9CA3AF] mt-1">*Shows templates linked to the selected inbox or its WABA ID.</p>
                    </div>

                    <p className="text-[12.5px] text-[#9CA3AF] italic mb-4">Select a template to view its content</p>

                    {/* Set Schedule */}
                    <label className="flex items-center gap-2 cursor-pointer mb-6">
                        <input type="checkbox" checked={schedule} onChange={() => setSchedule(!schedule)}
                            className="w-4 h-4 rounded border-[#D1D5DB] text-primary focus:ring-primary" />
                        <span className="text-[13px] font-medium text-foreground">Set Schedule</span>
                    </label>

                    {schedule && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Date</label>
                                <input type="date" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-[#6B7280] mb-1 block">Time</label>
                                <input type="time" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">Cancel</button>
                        <button className="px-6 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">Send</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ──────────────────────────────────────────────────
// ADD TEMPLATE MODAL — Complex form matching cekat.ai
// ──────────────────────────────────────────────────

function AddTemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [body, setBody] = useState('');
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl w-[720px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-[18px] font-bold text-foreground">New Template Message</h2>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                            <X className="w-5 h-5 text-[#6B7280]" />
                        </button>
                    </div>
                    <p className="text-[12px] text-red-500 mb-6">
                        IMPORTANT: To use this feature, please ensure you have added a payment method to your WhatsApp number <span className="underline cursor-pointer">here</span>.
                    </p>

                    {/* Template Data section */}
                    <div className="border border-[#E5E7EB] rounded-xl p-5 mb-4">
                        <h3 className="text-[14px] font-semibold text-foreground mb-4">Template Data</h3>

                        {/* Name */}
                        <div className="mb-4">
                            <label className="text-[12.5px] font-medium text-foreground block mb-1.5">Name</label>
                            <div className="relative">
                                <input type="text" placeholder="e.g. welcome_template"
                                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF]">0/512</span>
                            </div>
                        </div>

                        {/* Platform + Language */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-[12.5px] font-medium text-foreground block mb-1.5">Platform</label>
                                <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary">
                                    <option>Select Platform</option>
                                    <option>WhatsApp</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[12.5px] font-medium text-foreground block mb-1.5">Language</label>
                                <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary">
                                    <option>Indonesian</option>
                                    <option>English</option>
                                </select>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-[12.5px] font-medium text-foreground block mb-1.5">Category</label>
                            <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-primary max-w-[50%]">
                                <option>MARKETING</option>
                                <option>UTILITY</option>
                            </select>
                        </div>
                    </div>

                    {/* Header (Optional) */}
                    <div className="border border-[#E5E7EB] rounded-xl p-5 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[14px] font-semibold text-foreground">
                                    Header <span className="text-[12px] font-normal text-[#9CA3AF]">(Optional)</span>
                                </h3>
                                <p className="text-[12px] text-[#9CA3AF] mt-0.5">Headers appear at the top of template messages. Headers support image and video.</p>
                            </div>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                <Plus className="w-4 h-4 text-[#6B7280]" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="border border-[#E5E7EB] rounded-xl p-5 mb-4">
                        <h3 className="text-[14px] font-semibold text-foreground mb-3">Body</h3>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Enter your main template message"
                            rows={5}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary resize-y"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]" title="Bold">
                                    <Bold className="w-4 h-4 text-[#6B7280]" />
                                </button>
                                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]" title="Italic">
                                    <Italic className="w-4 h-4 text-[#6B7280]" />
                                </button>
                                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]" title="Strikethrough">
                                    <Strikethrough className="w-4 h-4 text-[#6B7280]" />
                                </button>
                                <button className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add variable
                                </button>
                            </div>
                            <span className="text-[11px] text-[#9CA3AF]">{body.length} / 1024</span>
                        </div>
                    </div>

                    {/* Buttons (Optional) */}
                    <div className="border border-[#E5E7EB] rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[14px] font-semibold text-foreground">
                                Buttons <span className="text-[12px] font-normal text-[#9CA3AF]">(Optional)</span>
                            </h3>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                <Plus className="w-4 h-4 text-[#6B7280]" />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">Cancel</button>
                        <button className="px-6 py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">Submit</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ──────────────────────────────────────────────────
// ADD RECIPIENT DROPDOWN
// ──────────────────────────────────────────────────

function AddRecipientDropdown({ open, onToggle }: { open: boolean; onToggle: () => void }) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"
            >
                Add Recipient
                <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-30 py-1"
                    >
                        <button className="w-full text-left px-3 py-2 text-[12.5px] text-foreground hover:bg-[#F3F4F6] flex items-center gap-2">
                            <Upload className="w-3.5 h-3.5 text-[#6B7280]" />
                            Upload File
                        </button>
                        <button className="w-full text-left px-3 py-2 text-[12.5px] text-foreground hover:bg-[#F3F4F6] flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-[#6B7280]" />
                            Upload Contacts
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ──────────────────────────────────────────────────
// TAB ICON — matching cekat.ai tab icons
// ──────────────────────────────────────────────────

function TabIcon({ tab }: { tab: BroadcastTab }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current">
            {tab === 'recipient' && (
                <>
                    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="11.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M11 9c1.5 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </>
            )}
            {tab === 'template' && (
                <>
                    <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </>
            )}
            {tab === 'campaign' && (
                <>
                    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </>
            )}
        </svg>
    );
}

// ──────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────

export default function BroadcastsPage() {
    const [activeTab, setActiveTab] = useState<BroadcastTab>('campaign');
    const [campaignModal, setCampaignModal] = useState(false);
    const [templateModal, setTemplateModal] = useState(false);
    const [recipientDropdown, setRecipientDropdown] = useState(false);

    const tabs: { key: BroadcastTab; label: string }[] = [
        { key: 'recipient', label: 'Recipient' },
        { key: 'template', label: 'Template Message' },
        { key: 'campaign', label: 'Campaign' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
            <AddCampaignModal open={campaignModal} onClose={() => setCampaignModal(false)} />
            <AddTemplateModal open={templateModal} onClose={() => setTemplateModal(false)} />

            {/* ═══════════════════════════════════════
                Header + Tabs
            ═══════════════════════════════════════ */}
            <div className="px-6 pt-5 pb-0 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                <h1 className="text-[20px] font-bold text-foreground mb-3">Broadcast Settings</h1>
                <div className="flex items-center gap-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors relative border-b-2 ${activeTab === tab.key
                                    ? 'text-primary border-primary'
                                    : 'text-[#6B7280] border-transparent hover:text-foreground'
                                }`}
                        >
                            <TabIcon tab={tab.key} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                Toolbar — Filter + Action button
            ═══════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7280]" />
                    Filter
                </button>

                <div className="flex items-center gap-2">
                    {activeTab === 'campaign' && (
                        <button
                            onClick={() => setCampaignModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"
                        >
                            Add Campaign
                        </button>
                    )}
                    {activeTab === 'template' && (
                        <>
                            <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-primary border border-primary rounded-lg hover:bg-[#EEF2FF]">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Sync
                            </button>
                            <button
                                onClick={() => setTemplateModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"
                            >
                                Add Template
                            </button>
                        </>
                    )}
                    {activeTab === 'recipient' && (
                        <AddRecipientDropdown
                            open={recipientDropdown}
                            onToggle={() => setRecipientDropdown(!recipientDropdown)}
                        />
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                Table Content — berbeda per tab
            ═══════════════════════════════════════ */}
            <div className="flex-1 overflow-auto px-6 py-3">
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                    {activeTab === 'campaign' && <CampaignTable />}
                    {activeTab === 'recipient' && <RecipientTable />}
                    {activeTab === 'template' && <TemplateTable />}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                Pagination — persis cekat.ai
            ═══════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-[#E5E7EB] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                        <ChevronLeft className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <span className="text-[13px] text-[#6B7280]">Page</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] text-[13px] font-medium text-foreground">1</span>
                    <span className="text-[13px] text-[#6B7280]">of 1</span>
                    <button className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                        <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#6B7280]">Item per page:</span>
                    <select className="border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-[13px] bg-white">
                        <option>100 rows</option>
                        <option>50 rows</option>
                        <option>25 rows</option>
                    </select>
                    <span className="text-[13px] text-[#6B7280]">
                        Total: <span className="font-medium text-foreground">
                            {activeTab === 'campaign' ? sampleCampaigns.length : activeTab === 'recipient' ? sampleRecipients.length : sampleTemplates.length}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────
// SUB TABLES — one per tab
// ──────────────────────────────────────────────────

function CampaignTable() {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b border-[#E5E7EB]">
                    {['Campaign Name', 'Recipient List', 'Delivered', 'Status', 'Sender', 'Created At', 'Send At', 'Actions'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sampleCampaigns.map(row => (
                    <tr key={row.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-foreground">{row.name}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.recipientList}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.delivered}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.sender}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.createdAt}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.sendAt}</td>
                        <td className="px-4 py-3">
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                                <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function RecipientTable() {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b border-[#E5E7EB]">
                    {['Recipient List Name', 'Source', 'Created At', 'Status', 'Actions'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sampleRecipients.map(row => (
                    <tr key={row.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-foreground">{row.name}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.source}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.createdAt}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3">
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                                <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function TemplateTable() {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b border-[#E5E7EB]">
                    {['Template Name', 'Template Type', 'Platform Name', 'Language', 'Category', 'Status', 'Waba ID', 'Actions'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sampleTemplates.map(row => (
                    <tr key={row.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-[12.5px] font-medium text-foreground font-mono">{row.name}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.type}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.platform}</td>
                        <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{row.language}</td>
                        <td className="px-4 py-3">
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${row.category === 'MARKETING'
                                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>{row.category}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 text-[12.5px] text-[#9CA3AF] font-mono">{row.wabaId}</td>
                        <td className="px-4 py-3">
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                                <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
