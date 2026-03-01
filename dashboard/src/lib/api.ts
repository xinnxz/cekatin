/* ═══════════════════════════════════════════════════════
   CekatIn API Client — Dashboard ↔ Go Backend

   Penjelasan:
   File ini menghubungkan dashboard Next.js ke Go backend.
   Ada 2 layer:
   1. api() — generic fetch wrapper (backward compatible)
   2. backend — typed functions untuk Go backend endpoints

   Arsitektur:
     Dashboard Component → api.ts → Go Backend (:8080)
                                  → WebSocket (ws://localhost:8080/ws)
   ═══════════════════════════════════════════════════════ */

// ── Base URLs ──
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
const WS_URL = BACKEND_URL.replace('http', 'ws');

// ── Generic fetch wrapper (existing, backward compatible) ──
interface FetchOptions extends RequestInit {
    tenant?: string;
}

export async function api<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { tenant = 'reonshop', ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': tenant,
        ...(fetchOptions.headers as Record<string, string>),
    };

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('cekatin_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `API Error: ${res.status}`);
    }

    return res.json();
}

export const fetcher = <T = unknown>(url: string): Promise<T> =>
    api<T>(url);

// ═══════════════════════════════════════════════════════
// Go Backend API Client
// ═══════════════════════════════════════════════════════

// ── Types (match Go backend models) ──

export interface Inbox {
    id: string;
    name: string;
    platform: string;
    phone_number: string;
    waba_id: string;
    status: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    inbox_id: string;
    contact_id: string | null;
    customer_phone: string;
    customer_name: string;
    platform: string;
    status: string;
    ai_enabled: boolean;
    assigned_agent: string;
    last_message: string;
    last_message_at: string | null;
    created_at: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    tags: string;
    avatar_url: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    direction: 'inbound' | 'outbound';
    content: string;
    message_type: string;       // text, image, video, document, audio, sticker
    wa_message_id: string;
    status: string;
    media_url: string;          // URL media (gambar, video, dokumen, audio)
    media_mime_type: string;    // MIME type (image/jpeg, video/mp4, dll)
    media_filename: string;     // Nama file asli (untuk dokumen)
    created_at: string;
}

export interface WSMessage {
    type: 'new_message' | 'status_update';
    conversation?: Conversation;
    message?: ChatMessage;
}

// ── Backend fetch helper ──
async function backendFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Backend Error: ${res.status}`);
    }
    return res.json();
}

// ── Typed backend functions ──
export const backend = {
    // Health
    health: () => backendFetch<{ status: string; service: string; version: string }>('/health'),

    // Inboxes
    getInboxes: async () => (await backendFetch<{ inboxes: Inbox[] }>('/api/inboxes')).inboxes,
    createInbox: async (data: { name: string; platform: string; phone_number?: string }) =>
        (await backendFetch<{ inbox: Inbox }>('/api/inboxes', { method: 'POST', body: JSON.stringify(data) })).inbox,
    getInbox: async (id: string) => (await backendFetch<{ inbox: Inbox }>(`/api/inboxes/${id}`)).inbox,
    deleteInbox: (id: string) => backendFetch<{ message: string }>(`/api/inboxes/${id}`, { method: 'DELETE' }),

    // Conversations
    getConversations: async (status?: string) => {
        const q = status ? `?status=${status}` : '';
        return (await backendFetch<{ conversations: Conversation[] }>(`/api/conversations${q}`)).conversations;
    },
    getConversation: async (id: string) =>
        (await backendFetch<{ conversation: Conversation }>(`/api/conversations/${id}`)).conversation,
    updateConversation: (id: string, status: string) =>
        backendFetch<{ message: string }>(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    // Messages
    getMessages: async (conversationId: string) =>
        (await backendFetch<{ messages: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`)).messages,
    sendMessage: async (conversationId: string, content: string) =>
        (await backendFetch<{ status: string; message: ChatMessage }>('/api/messages/send', {
            method: 'POST', body: JSON.stringify({ conversation_id: conversationId, content, message_type: 'text' }),
        })).message,

    // Contacts
    getContacts: async () =>
        (await backendFetch<{ contacts: Contact[] }>('/api/contacts')).contacts,
    getContact: async (id: string) =>
        (await backendFetch<{ contact: Contact }>(`/api/contacts/${id}`)).contact,
    getContactByPhone: async (phone: string) =>
        (await backendFetch<{ contact: Contact }>(`/api/contacts/phone/${phone}`)).contact,
    createContact: async (data: Partial<Contact>) =>
        (await backendFetch<{ contact: Contact }>('/api/contacts', {
            method: 'POST', body: JSON.stringify(data),
        })).contact,
    updateContact: async (id: string, data: Partial<Contact>) =>
        (await backendFetch<{ contact: Contact }>(`/api/contacts/${id}`, {
            method: 'PATCH', body: JSON.stringify(data),
        })).contact,

    // WebSocket — real-time updates dari Go backend
    connectWebSocket(onMessage: (msg: WSMessage) => void): WebSocket | null {
        if (typeof window === 'undefined') return null;
        try {
            const ws = new WebSocket(`${WS_URL}/ws`);
            ws.onopen = () => console.log('🔗 WebSocket connected');
            ws.onmessage = (e) => {
                try { onMessage(JSON.parse(e.data)); } catch { }
            };
            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected — reconnecting...');
                setTimeout(() => backend.connectWebSocket(onMessage), 3000);
            };
            return ws;
        } catch { return null; }
    },
};
