/* ═══════════════════════════════════════════════════════
   API Client — Centralized fetch with tenant header
   ═══════════════════════════════════════════════════════ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
    tenant?: string;
}

/**
 * Fetch wrapper yang otomatis menambahkan:
 * - Base URL
 * - Content-Type: application/json
 * - X-Tenant-Slug header
 * - Authorization header (jika ada token)
 */
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

    // Tambah auth token jika ada
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

/**
 * SWR fetcher — digunakan oleh useSWR untuk data fetching
 *
 * Contoh penggunaan:
 * const { data } = useSWR('/api/health', fetcher);
 */
export const fetcher = <T = unknown>(url: string): Promise<T> =>
    api<T>(url);
