'use client';

import { useState } from 'react';
import {
    Search, Filter, ArrowUpDown, Download, Plus, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Wallet, ShoppingCart, Package, CheckCircle2,
    ArrowUp, Edit, Trash2, Eye, Image, CreditCard, FileText, Settings,
    MoreHorizontal,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Orders Page — Persis cekat.ai/orders
   
   Penjelasan arsitektur:
   ┌──────────────────────────────────────────────────────────┐
   │ [📦] [💳] [🏷️] [👥]  ← icon sidebar (vertical)        │
   │                                                          │
   │  Orders   Subscription          [📅 Month ▾] [+ Create] │
   │  ──────                                                  │
   │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │
   │ │Balance│ │Sales │ │Orders│ │Done  │ ← 4 KPI cards      │
   │ │ Rp0  │ │ Rp0  │ │  0   │ │  0   │                    │
   │ └──────┘ └──────┘ └──────┘ └──────┘                    │
   │                                                          │
   │  Order History  [Export] [🔍 Search...] [Filter] [Sort]  │
   │ ┌──────────────────────────────────────────────────────┐ │
   │ │ # │ Customer │ Date │ Platform │ Payment │ Item │ $  │ │
   │ │ 1 │ Andi     │ ... │ WhatsApp │ Paid    │ 2   │25k │ │
   │ │ 2 │ Budi     │ ... │ Web      │ Pending │ 1   │15k │ │
   │ └──────────────────────────────────────────────────────┘ │
   │  Total Data: 5  [<<] [<] [1] [>] [>>]   Show: 100 rows  │
   └──────────────────────────────────────────────────────────┘
   
   Sidebar kiri: 4 icon buttons (Orders, Products, Payment, Contacts)
   ═══════════════════════════════════════════════════════════════ */

type SidebarItem = 'orders' | 'products' | 'payment-settings';

// ── Sample Order Data ──
const sampleOrders = [
    { id: 'ORD-001', customer: 'Andi Pratama', date: '28 Feb 2026', platform: 'WhatsApp', paymentStatus: 'Paid', items: 2, amount: 250000, orderStatus: 'Completed' },
    { id: 'ORD-002', customer: 'Budi Santoso', date: '27 Feb 2026', platform: 'WebChat', paymentStatus: 'Pending', items: 1, amount: 150000, orderStatus: 'Processing' },
    { id: 'ORD-003', customer: 'Citra Dewi', date: '27 Feb 2026', platform: 'Instagram', paymentStatus: 'Paid', items: 3, amount: 450000, orderStatus: 'Completed' },
    { id: 'ORD-004', customer: 'Diana Putri', date: '26 Feb 2026', platform: 'WhatsApp', paymentStatus: 'Failed', items: 1, amount: 75000, orderStatus: 'Cancelled' },
    { id: 'ORD-005', customer: 'Eko Wijaya', date: '26 Feb 2026', platform: 'Shopee', paymentStatus: 'Paid', items: 4, amount: 680000, orderStatus: 'Shipped' },
];

const sampleProducts = [
    { name: 'Kaos Basic Hitam', price: 89000, stock: 124, created: '15 Feb 2026', image: '👕' },
    { name: 'Celana Jeans Slim', price: 245000, stock: 56, created: '14 Feb 2026', image: '👖' },
    { name: 'Topi Baseball', price: 65000, stock: 200, created: '12 Feb 2026', image: '🧢' },
    { name: 'Jaket Bomber Premium', price: 389000, stock: 32, created: '10 Feb 2026', image: '🧥' },
];

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

// ═══ SIDEBAR ICONS ═══
function OrdersSidebar({ active, onChange }: { active: SidebarItem; onChange: (v: SidebarItem) => void }) {
    const items: { key: SidebarItem; icon: React.ElementType; label: string }[] = [
        { key: 'orders', icon: Package, label: 'Orders' },
        { key: 'products', icon: Image, label: 'Products' },
        { key: 'payment-settings', icon: CreditCard, label: 'Payment' },
    ];
    return (
        <div className="w-[52px] bg-white border-r border-[#E5E7EB] flex flex-col items-center py-4 gap-2 flex-shrink-0">
            {items.map(item => {
                const Icon = item.icon;
                return (
                    <button key={item.key} onClick={() => onChange(item.key)} title={item.label}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${active === item.key ? 'bg-primary/10 text-primary' : 'text-[#9CA3AF] hover:text-foreground hover:bg-[#F3F4F6]'}`}>
                        <Icon className="w-[18px] h-[18px]" />
                    </button>
                );
            })}
        </div>
    );
}

// ═══ ORDERS VIEW ═══
function OrdersView() {
    const [tab, setTab] = useState<'orders' | 'subscription'>('orders');
    const totalSales = sampleOrders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + o.amount, 0);
    const completedOrders = sampleOrders.filter(o => o.orderStatus === 'Completed').length;

    return (
        <div>
            {/* Tabs + Actions */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-0">
                    {(['orders', 'subscription'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 text-[14px] font-medium border-b-2 ${tab === t ? 'text-foreground border-foreground' : 'text-[#9CA3AF] border-transparent'}`}>
                            {t === 'orders' ? 'Orders' : 'Subscription'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                        📅 Month
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                        <Plus className="w-3.5 h-3.5" /> Create Order
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Balance', value: formatRupiah(totalSales), change: null, icon: Wallet },
                    { label: 'Total sales', value: formatRupiah(totalSales), change: `+${((totalSales / 1000000) * 100).toFixed(0)}%`, icon: ShoppingCart },
                    { label: 'Total orders', value: sampleOrders.length.toString(), change: `+${sampleOrders.length}`, icon: Package },
                    { label: 'Completed Orders', value: completedOrders.toString(), change: `+${completedOrders}`, icon: CheckCircle2 },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[12px] text-[#6B7280]">{kpi.label}</p>
                                {kpi.change && (
                                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-green-600">
                                        <ArrowUp className="w-3 h-3" /> {kpi.change}
                                    </span>
                                )}
                            </div>
                            <p className="text-[20px] font-bold text-foreground">{kpi.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Order History */}
            <div className="border border-[#E5E7EB] rounded-xl bg-white">
                <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
                    <h2 className="text-[15px] font-bold text-foreground">Order History</h2>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            <Download className="w-3.5 h-3.5" /> Export
                        </button>
                        <div className="relative w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                            <input placeholder="Search customer name, email, phone, address..." className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-primary" />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            <Filter className="w-3.5 h-3.5" /> Filter By
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]">
                            <ArrowUpDown className="w-3.5 h-3.5" /> Sort by Newest Date
                        </button>
                    </div>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['Number', 'Customer', 'Created Date', 'Platform', 'Payment Status', 'Item', 'Amount', 'Order Status', 'Action'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-primary">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sampleOrders.map((order, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                <td className="px-4 py-2.5 text-[12px] font-medium text-primary">{order.id}</td>
                                <td className="px-4 py-2.5 text-[12px] text-foreground">{order.customer}</td>
                                <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{order.date}</td>
                                <td className="px-4 py-2.5">
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[#EEF2FF] text-primary rounded-full">{order.platform}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {order.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-[12px] text-[#6B7280] text-center">{order.items}</td>
                                <td className="px-4 py-2.5 text-[12px] font-medium text-foreground">{formatRupiah(order.amount)}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${order.orderStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                                            order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                                order.orderStatus === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-red-100 text-red-700'
                                        }`}>{order.orderStatus}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex gap-1">
                                        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Eye className="w-3 h-3 text-[#9CA3AF]" /></button>
                                        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Edit className="w-3 h-3 text-[#9CA3AF]" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
                    <p className="text-[12px] text-[#6B7280]">Total Data: {sampleOrders.length}</p>
                    <div className="flex items-center gap-1">
                        <button className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] rounded text-[#9CA3AF]"><ChevronsLeft className="w-3 h-3" /></button>
                        <button className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] rounded text-[#9CA3AF]"><ChevronLeft className="w-3 h-3" /></button>
                        <button className="w-7 h-7 flex items-center justify-center border border-primary rounded text-primary bg-primary/5 font-medium text-[12px]">1</button>
                        <button className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] rounded text-[#9CA3AF]"><ChevronRight className="w-3 h-3" /></button>
                        <button className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] rounded text-[#9CA3AF]"><ChevronsRight className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                        Show per Page:
                        <select className="border border-[#E5E7EB] rounded px-2 py-1 text-[12px] bg-white">
                            <option>100 rows</option>
                            <option>50 rows</option>
                            <option>25 rows</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ PRODUCTS VIEW ═══
function ProductsView() {
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-[20px] font-bold text-foreground">Products</h1>
                <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
            </div>
            <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                            {['Product', 'Price', 'Stock', 'Created', 'Action'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-primary">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sampleProducts.map((p, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                                <td className="px-4 py-3 flex items-center gap-3">
                                    <span className="text-2xl">{p.image}</span>
                                    <span className="text-[12.5px] font-medium text-foreground">{p.name}</span>
                                </td>
                                <td className="px-4 py-3 text-[12.5px] font-medium text-foreground">{formatRupiah(p.price)}</td>
                                <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{p.stock}</td>
                                <td className="px-4 py-3 text-[12.5px] text-[#6B7280]">{p.created}</td>
                                <td className="px-4 py-3 flex gap-1">
                                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]"><Edit className="w-3 h-3 text-primary" /></button>
                                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ═══ PAYMENT SETTINGS VIEW ═══
function PaymentSettingsView() {
    const [tab, setTab] = useState<'xendit' | 'method' | 'invoice'>('xendit');
    return (
        <div>
            <h1 className="text-[20px] font-bold text-foreground mb-1">Payment Settings</h1>
            <p className="text-[12px] text-[#6B7280] mb-5">Configure your payment gateway and invoice settings</p>
            <div className="flex gap-0 border-b border-[#E5E7EB] mb-5">
                {([['xendit', 'Xendit Account Setting'], ['method', 'Payment Method'], ['invoice', 'Invoice Settings']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k as typeof tab)}
                        className={`px-4 py-2.5 text-[12px] font-medium border-b-2 ${tab === k ? 'text-primary border-primary' : 'text-[#6B7280] border-transparent'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {tab === 'xendit' && (
                <div className="border border-[#E5E7EB] rounded-xl p-5 bg-white">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-[#003EE4] flex items-center justify-center text-white font-bold text-lg">X</div>
                        <div>
                            <h3 className="text-[14px] font-semibold text-foreground">Xendit</h3>
                            <p className="text-[11px] text-[#9CA3AF]">Payment gateway for Indonesia</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[12px] font-medium text-foreground block mb-1.5">API Key (Secret)</label>
                            <input type="password" placeholder="xnd_production_..." className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-[12px] font-medium text-foreground block mb-1.5">Callback Token</label>
                            <input type="password" placeholder="Enter callback verification token" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                        </div>
                    </div>
                    <button className="mt-4 px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">Save Settings</button>
                </div>
            )}

            {tab === 'method' && (
                <div className="space-y-3">
                    {['Bank Transfer (VA)', 'E-Wallet (OVO, GoPay, DANA)', 'Credit Card', 'QR Code (QRIS)'].map((m, i) => (
                        <div key={i} className="flex items-center justify-between border border-[#E5E7EB] rounded-xl px-5 py-4 bg-white">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <span className="text-[13px] font-medium text-foreground">{m}</span>
                            </div>
                            <button className={`w-11 h-6 rounded-full transition-colors ${i < 2 ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${i < 2 ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'invoice' && (
                <div className="border border-[#E5E7EB] rounded-xl p-5 bg-white space-y-3">
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Invoice Prefix</label>
                        <input defaultValue="INV-REON" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Invoice Expiry (hours)</label>
                        <input type="number" defaultValue={24} className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-foreground block mb-1.5">Thank You Message</label>
                        <textarea defaultValue="Terima kasih atas pembayaran Anda! Pesanan sedang diproses." rows={2}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-primary" />
                    </div>
                    <button className="px-5 py-2 text-[12px] font-semibold text-white bg-primary rounded-lg">Save Invoice Settings</button>
                </div>
            )}
        </div>
    );
}

// ═══ MAIN PAGE ═══
export default function OrdersPage() {
    const [sidebar, setSidebar] = useState<SidebarItem>('orders');

    const views: Record<SidebarItem, React.FC> = {
        'orders': OrdersView,
        'products': ProductsView,
        'payment-settings': PaymentSettingsView,
    };
    const View = views[sidebar];

    return (
        <div className="flex h-[calc(100vh-52px)]">
            <OrdersSidebar active={sidebar} onChange={setSidebar} />
            <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
                <View />
            </div>
        </div>
    );
}
