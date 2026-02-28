'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    BackgroundVariant,
    type Node,
    type Edge,
    type Connection,
    type NodeProps,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    ArrowLeft, Plus, X, Save, Trash2, Play, GitBranch,
    MessageSquare, Zap, ChevronDown, Settings, Copy,
    Clock, Search, MoreVertical,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Flow Builder Page — Persis cekat.ai/flow
   
   Penjelasan arsitektur:
   
   ┌───────────────────────────────────────────────────────────┐
   │ ← [Enter flow name] [Enter flow description]    [Save]   │
   ├───────────────────────────────────────────┬───────────────┤
   │                                          │ Properties    │
   │           REACT FLOW CANVAS              │ Panel         │
   │        (drag, pan, zoom nodes)           │               │
   │                                          │ - Node type   │
   │  ┌─────────────┐                        │ - Settings    │
   │  │ Start Point  │                        │ - Inputs      │
   │  │ Select Cond. │                        │               │
   │  └──────┬───────┘                        │               │
   │         │                                │               │
   │        [+]                               │               │
   │       / \                                │               │
   │  ┌────┐ ┌────┐                           │               │
   │  │Cond│ │Else│                           │               │
   │  └────┘ └────┘                           │               │
   │                                          │               │
   │  [- 97% +]                               │               │
   └──────────────────────────────────────────┴───────────────┘
   
   Menggunakan @xyflow/react (React Flow v12) — library standar 
   untuk visual node editor, sama yang digunakan banyak produk 
   SaaS (Zapier, n8n, Langflow, dll).
   
   Custom Node Types:
   1. StartNode — node pertama (biru gelap)
   2. ConditionNode — branching logic (kuning/orange)
   3. ActionNode — action yang dilakukan (hijau)
   4. AddNode — tombol "+" untuk menambah node
   ═══════════════════════════════════════════════════════════════ */

type PageView = 'list' | 'builder';

// ── Sample Flows ──
const sampleFlows = [
    { id: '1', name: 'Welcome Flow', description: 'Auto greet new customers', nodes: 5, updatedAt: '27 Feb 2026' },
    { id: '2', name: 'Order Inquiry', description: 'Handle order status questions', nodes: 8, updatedAt: '26 Feb 2026' },
    { id: '3', name: 'Complaint Handler', description: 'Escalation flow for complaints', nodes: 4, updatedAt: '25 Feb 2026' },
];

// ══════════════════════════════════════════
// CUSTOM NODES — Persis cekat.ai style
// ══════════════════════════════════════════

/**
 * StartNode — Node pertama dalam flow
 * Warna biru gelap, handle di bawah saja (source)
 * Ada "Select Condition" dropdown
 */
function StartNode({ data, selected }: NodeProps) {
    return (
        <div className={`min-w-[250px] rounded-xl overflow-hidden shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
            <div className="bg-[#1E3A5F] px-5 py-3 flex items-center gap-2">
                <Play className="w-4 h-4 text-white fill-white" />
                <span className="text-[14px] font-bold text-white">Start point</span>
            </div>
            <div className="bg-white px-5 py-3">
                <p className="text-[12.5px] text-[#6B7280]">{String(data.condition || 'Select Condition')}</p>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#1E3A5F] !border-2 !border-white" />
        </div>
    );
}

/**
 * ConditionNode — Node kondisi/branching
 * Warna kuning/orange, handle di atas (target) dan bawah (source)
 * Menampilkan tipe kondisi + deskripsi
 */
function ConditionNode({ data, selected }: NodeProps) {
    return (
        <div className={`min-w-[220px] rounded-xl overflow-hidden shadow-lg border-2 ${selected ? 'border-primary' : 'border-[#F59E0B]'
            }`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#F59E0B] !border-2 !border-white" />
            <div className="bg-[#F59E0B] px-4 py-2.5 flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-white" />
                <span className="text-[13px] font-bold text-white">Condition</span>
            </div>
            <div className="bg-[#FEF3C7] px-4 py-3">
                <p className="text-[13px] font-semibold text-[#92400E]">{String(data.label || 'Condition')}</p>
                <p className="text-[11px] text-[#B45309] mt-0.5">{String(data.description || '')}</p>
            </div>
            {selected && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-primary font-medium">Selected</div>
            )}
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#F59E0B] !border-2 !border-white" />
        </div>
    );
}

/**
 * ActionNode — Node aksi (kirim pesan, assign label, dll)
 * Warna hijau, handle di atas (target) dan bawah (source)
 */
function ActionNode({ data, selected }: NodeProps) {
    return (
        <div className={`min-w-[220px] rounded-xl overflow-hidden shadow-lg border-2 ${selected ? 'border-primary' : 'border-[#10B981]'
            }`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#10B981] !border-2 !border-white" />
            <div className="bg-[#10B981] px-4 py-2.5 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-white" />
                <span className="text-[13px] font-bold text-white">Action</span>
            </div>
            <div className="bg-[#D1FAE5] px-4 py-3">
                <p className="text-[13px] font-semibold text-[#065F46]">{String(data.label || 'Action')}</p>
                <p className="text-[11px] text-[#047857] mt-0.5">{String(data.description || '')}</p>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#10B981] !border-2 !border-white" />
        </div>
    );
}

/**
 * MessageNode — Node pesan respons
 * Warna ungu
 */
function MessageNode({ data, selected }: NodeProps) {
    return (
        <div className={`min-w-[220px] rounded-xl overflow-hidden shadow-lg border-2 ${selected ? 'border-primary' : 'border-[#8B5CF6]'
            }`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#8B5CF6] !border-2 !border-white" />
            <div className="bg-[#8B5CF6] px-4 py-2.5 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
                <span className="text-[13px] font-bold text-white">Send Message</span>
            </div>
            <div className="bg-[#EDE9FE] px-4 py-3">
                <p className="text-[12px] text-[#5B21B6]">{String(data.message || 'Enter message...')}</p>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#8B5CF6] !border-2 !border-white" />
        </div>
    );
}

// Register custom node types
const nodeTypes = {
    startNode: StartNode,
    conditionNode: ConditionNode,
    actionNode: ActionNode,
    messageNode: MessageNode,
};

// ── Default Flow Data ──
const initialNodes: Node[] = [
    { id: 'start', type: 'startNode', position: { x: 250, y: 50 }, data: { condition: 'First Message Text' } },
    { id: 'cond1', type: 'conditionNode', position: { x: 80, y: 300 }, data: { label: 'First Message Text', description: 'Your trigger message will appear here' } },
    { id: 'cond2', type: 'conditionNode', position: { x: 400, y: 300 }, data: { label: 'Else', description: 'This path will be taken if other conditions are not met.' } },
    { id: 'msg1', type: 'messageNode', position: { x: 80, y: 500 }, data: { message: 'Halo! Selamat datang di ReonShop 👋' } },
    { id: 'action1', type: 'actionNode', position: { x: 400, y: 500 }, data: { label: 'Transfer to Agent', description: 'Handoff to human CS' } },
];

const initialEdges: Edge[] = [
    { id: 'e-start-cond1', source: 'start', target: 'cond1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' }, style: { stroke: '#9CA3AF', strokeWidth: 2 } },
    { id: 'e-start-cond2', source: 'start', target: 'cond2', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' }, style: { stroke: '#9CA3AF', strokeWidth: 2 } },
    { id: 'e-cond1-msg1', source: 'cond1', target: 'msg1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' }, style: { stroke: '#9CA3AF', strokeWidth: 2 } },
    { id: 'e-cond2-action1', source: 'cond2', target: 'action1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' }, style: { stroke: '#9CA3AF', strokeWidth: 2 } },
];

// ══════════════════════════════════════════
// PROPERTIES PANEL — right sidebar
// ══════════════════════════════════════════

function PropertiesPanel({ node, onUpdate, onDelete }: {
    node: Node | null;
    onUpdate: (id: string, data: Record<string, unknown>) => void;
    onDelete: (id: string) => void;
}) {
    if (!node) {
        return (
            <div className="w-[280px] bg-white border-l border-[#E5E7EB] flex-shrink-0 flex items-center justify-center p-6">
                <p className="text-[12px] text-[#9CA3AF] text-center">Select a node to edit its properties</p>
            </div>
        );
    }

    const typeLabels: Record<string, string> = {
        startNode: 'Start Point',
        conditionNode: 'Condition',
        actionNode: 'Action',
        messageNode: 'Send Message',
    };

    const typeColors: Record<string, string> = {
        startNode: 'text-[#1E3A5F]',
        conditionNode: 'text-[#F59E0B]',
        actionNode: 'text-[#10B981]',
        messageNode: 'text-[#8B5CF6]',
    };

    return (
        <div className="w-[280px] bg-white border-l border-[#E5E7EB] flex-shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <span className={`text-[14px] font-bold ${typeColors[node.type || ''] || 'text-foreground'}`}>
                    {typeLabels[node.type || ''] || node.type}
                </span>
                <button onClick={() => onDelete(node.id)} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Condition dropdown for start/condition nodes */}
                {(node.type === 'startNode' || node.type === 'conditionNode') && (
                    <div>
                        <label className="text-[12px] font-semibold text-foreground block mb-1.5">Condition</label>
                        <select
                            value={String(node.data.condition || node.data.label || '')}
                            onChange={e => onUpdate(node.id, {
                                ...node.data as Record<string, unknown>,
                                [node.type === 'startNode' ? 'condition' : 'label']: e.target.value,
                            })}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px] bg-white focus:outline-none focus:border-primary"
                        >
                            <option>First Message Text</option>
                            <option>Keyword Match</option>
                            <option>Button Click</option>
                            <option>Time Delay</option>
                            <option>Else</option>
                        </select>
                    </div>
                )}

                {/* Text input for condition/start nodes */}
                {node.type === 'conditionNode' && (
                    <div>
                        <label className="text-[12px] font-semibold text-foreground block mb-1.5">
                            {String(node.data.label || 'Condition')}
                        </label>
                        <textarea
                            value={String(node.data.description || '')}
                            onChange={e => onUpdate(node.id, { ...node.data as Record<string, unknown>, description: e.target.value })}
                            placeholder="Input one or more trigger keywords"
                            rows={4}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-primary resize-y"
                        />
                        <p className="text-[10px] text-[#9CA3AF] mt-1">Use commas to separate words.</p>
                    </div>
                )}

                {node.type === 'startNode' && (
                    <div>
                        <label className="text-[12px] font-semibold text-foreground block mb-1.5">First Message Text</label>
                        <textarea
                            placeholder="Input one or more trigger keywords"
                            rows={4}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-primary resize-y"
                        />
                        <p className="text-[10px] text-[#9CA3AF] mt-1">Use commas to separate words.</p>
                    </div>
                )}

                {/* Message input for message nodes */}
                {node.type === 'messageNode' && (
                    <div>
                        <label className="text-[12px] font-semibold text-foreground block mb-1.5">Message Content</label>
                        <textarea
                            value={String(node.data.message || '')}
                            onChange={e => onUpdate(node.id, { ...node.data as Record<string, unknown>, message: e.target.value })}
                            placeholder="Enter the message to send..."
                            rows={5}
                            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[12px] focus:outline-none focus:border-primary resize-y"
                        />
                    </div>
                )}

                {/* Action settings */}
                {node.type === 'actionNode' && (
                    <>
                        <div>
                            <label className="text-[12px] font-semibold text-foreground block mb-1.5">Action Type</label>
                            <select
                                value={String(node.data.label || '')}
                                onChange={e => onUpdate(node.id, { ...node.data as Record<string, unknown>, label: e.target.value })}
                                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px] bg-white focus:outline-none focus:border-primary"
                            >
                                <option>Transfer to Agent</option>
                                <option>Assign Label</option>
                                <option>Set Pipeline Status</option>
                                <option>Send Notification</option>
                                <option>Close Chat</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-foreground block mb-1.5">Description</label>
                            <input
                                value={String(node.data.description || '')}
                                onChange={e => onUpdate(node.id, { ...node.data as Record<string, unknown>, description: e.target.value })}
                                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-primary"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// ADD NODE PANEL — side panel to add nodes
// ══════════════════════════════════════════

function AddNodePanel({ open, onClose, onAdd }: {
    open: boolean;
    onClose: () => void;
    onAdd: (type: string) => void;
}) {
    if (!open) return null;

    const nodeOptions = [
        { type: 'conditionNode', label: 'Condition', desc: 'Add branching logic', icon: GitBranch, color: 'bg-[#FEF3C7] text-[#F59E0B]' },
        { type: 'actionNode', label: 'Action', desc: 'Perform an action', icon: Zap, color: 'bg-[#D1FAE5] text-[#10B981]' },
        { type: 'messageNode', label: 'Send Message', desc: 'Send a reply message', icon: MessageSquare, color: 'bg-[#EDE9FE] text-[#8B5CF6]' },
    ];

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 top-4 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-3 z-20 w-[260px]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-foreground">Add Node</span>
                    <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6]">
                        <X className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                </div>
                <div className="space-y-1.5">
                    {nodeOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                            <button key={opt.type} onClick={() => { onAdd(opt.type); onClose(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F3F4F6] text-left">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-foreground">{opt.label}</p>
                                    <p className="text-[10px] text-[#9CA3AF]">{opt.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════

export default function FlowPage() {
    const [view, setView] = useState<PageView>('list');
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [addPanelOpen, setAddPanelOpen] = useState(false);
    const [flowName, setFlowName] = useState('Welcome Flow');
    const [flowDesc, setFlowDesc] = useState('Auto greet new customers');
    const [createModal, setCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const nodeIdCounter = useRef(10);

    const onConnect = useCallback((params: Connection) => {
        setEdges(eds => addEdge({
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' },
            style: { stroke: '#9CA3AF', strokeWidth: 2 },
        }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const updateNodeData = useCallback((id: string, data: Record<string, unknown>) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n));
        setSelectedNode(prev => prev && prev.id === id ? { ...prev, data } : prev);
    }, [setNodes]);

    const deleteNode = useCallback((id: string) => {
        if (id === 'start') return; // Can't delete start node
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
        setSelectedNode(null);
    }, [setNodes, setEdges]);

    const addNode = useCallback((type: string) => {
        const id = `node-${nodeIdCounter.current++}`;
        const defaultData: Record<string, Record<string, string>> = {
            conditionNode: { label: 'New Condition', description: '' },
            actionNode: { label: 'New Action', description: '' },
            messageNode: { message: '' },
        };
        const newNode: Node = {
            id,
            type,
            position: { x: 250 + Math.random() * 100, y: 400 + Math.random() * 100 },
            data: defaultData[type] || {},
        };
        setNodes(nds => [...nds, newNode]);
    }, [setNodes]);

    // ═══════ LIST VIEW ═══════
    if (view === 'list') {
        return (
            <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
                {/* Create Modal */}
                <AnimatePresence>
                    {createModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-2xl shadow-xl w-[420px] p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[17px] font-bold text-foreground">Create New Flow</h2>
                                    <button onClick={() => setCreateModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                                        <X className="w-4 h-4 text-[#6B7280]" />
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <label className="text-[12px] font-medium text-foreground block mb-1.5">Flow Name</label>
                                    <input placeholder="Enter flow name" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                                </div>
                                <div className="mb-6">
                                    <label className="text-[12px] font-medium text-foreground block mb-1.5">Description</label>
                                    <input placeholder="Enter flow description" className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-primary" />
                                </div>
                                <button onClick={() => { setCreateModal(false); setView('builder'); }}
                                    className="w-full py-2.5 text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
                                    Create Flow
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[900px] mx-auto py-10 px-6">
                        <div className="text-center mb-8">
                            <h1 className="text-[28px] font-bold text-foreground mb-2">Flow Builder</h1>
                            <p className="text-[13px] text-[#6B7280]">Create automated conversation flows with visual drag-and-drop editor.</p>
                            <p className="text-[13px] text-[#6B7280]">Design complex chatbot logic without writing any code.</p>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2 justify-center mb-8">
                            <div className="relative w-[320px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search flows..." className="w-full pl-9 pr-3 py-2.5 text-[13px] border border-[#E5E7EB] rounded-full bg-white focus:outline-none focus:border-primary" />
                            </div>
                        </div>

                        {/* Flow cards grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {sampleFlows.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(flow => (
                                <div key={flow.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 hover:shadow-lg transition-shadow cursor-pointer group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <GitBranch className="w-5 h-5 text-primary" />
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4 text-[#9CA3AF]" />
                                        </button>
                                    </div>
                                    <h3 className="text-[14px] font-bold text-foreground mb-1">{flow.name}</h3>
                                    <p className="text-[11px] text-[#9CA3AF] mb-3">{flow.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[#9CA3AF]">{flow.nodes} nodes · {flow.updatedAt}</span>
                                        <button onClick={() => setView('builder')}
                                            className="px-3 py-1 text-[11px] font-medium text-primary border border-primary rounded-lg hover:bg-[#EEF2FF]">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Create New */}
                            <button onClick={() => setCreateModal(true)}
                                className="bg-primary rounded-2xl p-5 text-white hover:bg-primary-hover transition-colors flex flex-col items-center justify-center min-h-[180px]">
                                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center mb-3">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[14px] font-bold">Create New Flow</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════ BUILDER VIEW ═══════
    return (
        <div className="flex flex-col h-[calc(100vh-52px)] bg-[#F9FAFB]">
            {/* Top bar — flow name + save */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6]">
                        <ArrowLeft className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <div>
                        <input value={flowName} onChange={e => setFlowName(e.target.value)}
                            className="text-[15px] font-bold text-foreground bg-transparent focus:outline-none border-b border-transparent focus:border-primary w-[200px]"
                            placeholder="Enter flow name" />
                        <input value={flowDesc} onChange={e => setFlowDesc(e.target.value)}
                            className="block text-[11px] text-[#9CA3AF] bg-transparent focus:outline-none border-b border-transparent focus:border-primary w-[200px]"
                            placeholder="Enter flow description" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setAddPanelOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-foreground border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                        <Plus className="w-3.5 h-3.5" /> Add Node
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg">
                        <Save className="w-3.5 h-3.5" /> Save
                    </button>
                </div>
            </div>

            {/* Canvas + Properties */}
            <div className="flex-1 flex relative">
                {/* Add Node Panel */}
                <AddNodePanel open={addPanelOpen} onClose={() => setAddPanelOpen(false)} onAdd={addNode} />

                {/* React Flow Canvas */}
                <div className="flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' },
                            style: { stroke: '#9CA3AF', strokeWidth: 2 },
                        }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#D1D5DB" />
                        <Controls className="!bg-white !border-[#E5E7EB] !rounded-lg !shadow-md" />
                    </ReactFlow>
                </div>

                {/* Properties Panel */}
                <PropertiesPanel
                    node={selectedNode}
                    onUpdate={updateNodeData}
                    onDelete={deleteNode}
                />
            </div>
        </div>
    );
}
