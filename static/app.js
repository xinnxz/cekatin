/**
 * CekatIn - Frontend Chat Logic
 * ================================
 * Script ini menghandle semua interaksi pengguna di halaman chat:
 * 1. Kirim pesan ke backend API (POST /api/chat)
 * 2. Render bubble chat (user & bot)
 * 3. Tampilkan typing indicator saat menunggu respon
 * 4. Quick action buttons
 * 5. Info modal
 * 6. Background particles animation
 * 
 * Penjelasan Arsitektur Frontend:
 * ─────────────────────────────────
 * - Komunikasi ke backend via Fetch API (modern, promise-based)
 * - Tidak menggunakan framework (Vanilla JS) agar ringan
 * - Pesan di-render sebagai DOM elements (bukan innerHTML)
 *   untuk keamanan (mencegah XSS attack)
 * 
 * Author: CekatIn Team
 */

// ============================================================
// DOM Elements
// ============================================================

const chatArea = document.getElementById('chatArea');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const welcomeSection = document.getElementById('welcomeSection');
const charCount = document.getElementById('charCount');
const btnInfo = document.getElementById('btnInfo');
const btnClear = document.getElementById('btnClear');
const infoModal = document.getElementById('infoModal');
const modalClose = document.getElementById('modalClose');
const bgParticles = document.getElementById('bgParticles');

// API Base URL
// Auto-detect: jika dibuka via Flask (port 5000), pakai relative path
// Jika dibuka via Live Server (port 5500, dll), pakai absolute URL ke Flask
const API_BASE = window.location.port === '5000' 
    ? '' 
    : 'http://localhost:5000';
const API_URL = API_BASE + '/api/chat';

// Session ID unik per tab browser — agar Gemini bisa ingat konteks percakapan
// crypto.randomUUID() menghasilkan UUID v4 yang unik
const SESSION_ID = crypto.randomUUID();

// State
let isWaiting = false;
let messageCount = 0;

// ============================================================
// SECTION 1: Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initEventListeners();
    messageInput.focus();
});

function initEventListeners() {
    // Send message on button click
    sendBtn.addEventListener('click', handleSend);

    // Send message on Enter key
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Character count
    messageInput.addEventListener('input', () => {
        const len = messageInput.value.length;
        charCount.textContent = `${len}/500`;
    });

    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const message = btn.getAttribute('data-message');
            if (message && !isWaiting) {
                messageInput.value = message;
                handleSend();
            }
        });
    });

    // Info modal
    btnInfo.addEventListener('click', () => {
        infoModal.classList.add('active');
    });

    modalClose.addEventListener('click', () => {
        infoModal.classList.remove('active');
    });

    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.classList.remove('active');
        }
    });

    // Clear chat
    btnClear.addEventListener('click', clearChat);
}

// ============================================================
// SECTION 2: Send Message & Receive Response
// ============================================================

/**
 * Handle pengiriman pesan.
 * 
 * Alur:
 * 1. Ambil teks dari input
 * 2. Validasi (tidak kosong, tidak sedang menunggu)
 * 3. Render bubble user
 * 4. Tampilkan typing indicator
 * 5. Kirim ke backend via Fetch API
 * 6. Terima respon → render bubble bot
 * 7. Sembunyikan typing indicator
 */
async function handleSend() {
    const message = messageInput.value.trim();
    if (!message || isWaiting) return;

    // Hide welcome section on first message
    if (welcomeSection) {
        welcomeSection.style.display = 'none';
    }

    // Clear input
    messageInput.value = '';
    charCount.textContent = '0/500';

    // Render user message
    addMessage('user', message);

    // Show typing indicator
    showTyping();
    isWaiting = true;
    sendBtn.disabled = true;

    try {
        // Kirim ke backend API (termasuk session_id untuk conversation memory)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, session_id: SESSION_ID }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Simulasi typing delay (dikurangi agar respon lebih cepat)
        // Gemini API sudah butuh 1-3 detik, jadi delay minimal saja
        await delay(200 + Math.random() * 300);

        // Hide typing & render bot response
        hideTyping();
        addMessage('bot', data.response, {
            intent: data.intent,
            confidence: data.confidence,
            preprocessed: data.preprocessed,
            source: data.source || 'nlp',
            suggested_replies: data.suggested_replies || [],
        });

    } catch (error) {
        console.error('Chat error:', error);
        hideTyping();
        addMessage('bot', 
            '⚠️ Maaf, terjadi kesalahan koneksi ke server. ' +
            'Pastikan server Flask sudah berjalan (python app.py).',
            { intent: 'error', confidence: 0 }
        );
    } finally {
        isWaiting = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// ============================================================
// SECTION 3: Render Messages
// ============================================================

/**
 * Render bubble chat ke DOM.
 * 
 * Penjelasan:
 * - Menggunakan createElement (bukan innerHTML) untuk keamanan
 * - Pesan bot bisa mengandung format markdown (bold, line breaks)
 * - Debug info (intent, confidence) ditampilkan di bawah bubble bot
 * 
 * @param {string} type - 'user' atau 'bot'
 * @param {string} text - Isi pesan
 * @param {object} debug - Debug info { intent, confidence, preprocessed }
 */
function addMessage(type, text, debug = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;

    // Avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'msg-avatar';
    avatarEl.textContent = type === 'bot' ? '🤖' : '👤';

    // Content wrapper
    const contentEl = document.createElement('div');
    contentEl.className = 'msg-content';

    // Bubble
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'msg-bubble';
    bubbleEl.innerHTML = formatMessage(text);

    contentEl.appendChild(bubbleEl);

    // Debug info (hanya untuk bot)
    if (type === 'bot' && debug && debug.intent) {
        const debugEl = document.createElement('div');
        debugEl.className = 'msg-debug';

        // Source tag (NLP atau Gemini)
        const sourceTag = document.createElement('span');
        const isGemini = debug.source === 'gemini';
        sourceTag.className = `debug-tag ${isGemini ? 'gemini' : 'intent'}`;
        sourceTag.textContent = isGemini ? '✨ Gemini AI' : `🏷️ ${debug.intent}`;
        debugEl.appendChild(sourceTag);

        // Confidence tag
        const confTag = document.createElement('span');
        const confPercent = (debug.confidence * 100).toFixed(1);
        const confLevel = debug.confidence >= 0.7 ? 'high' : 
                         debug.confidence >= 0.4 ? 'medium' : 'low';
        confTag.className = `debug-tag confidence ${confLevel}`;
        confTag.textContent = `📊 ${confPercent}%`;
        debugEl.appendChild(confTag);

        contentEl.appendChild(debugEl);
    }

    // Timestamp
    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = getCurrentTime();
    contentEl.appendChild(timeEl);

    // Suggested Replies (tombol rekomendasi setelah bot menjawab)
    if (type === 'bot' && debug && debug.suggested_replies && debug.suggested_replies.length > 0) {
        const suggestionsEl = document.createElement('div');
        suggestionsEl.className = 'suggested-replies';

        debug.suggested_replies.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = suggestion.text;
            btn.addEventListener('click', () => {
                // Hapus tombol suggestion setelah diklik
                suggestionsEl.remove();
                // Kirim pesan suggestion
                messageInput.value = suggestion.message;
                handleSend();
            });
            suggestionsEl.appendChild(btn);
        });

        contentEl.appendChild(suggestionsEl);
    }

    // Assemble
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);

    messagesContainer.appendChild(messageEl);
    messageCount++;

    // Auto-scroll to bottom
    scrollToBottom();
}

/**
 * Format teks pesan agar mendukung beberapa markdown:
 * - **bold** → <strong>bold</strong>
 * - Newlines → <br>
 * - Daftar bullet (•, -, *) → dengan spacing
 * 
 * Penjelasan:
 * Ini adalah "lightweight markdown parser" — hanya mem-parse
 * formatting yang sering digunakan di respon chatbot.
 * Tidak menggunakan library penuh (markdown-it) agar tetap ringan.
 */
function formatMessage(text) {
    // Escape HTML untuk keamanan (cegah XSS)
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Bold: **text** → <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Newlines → <br>
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// ============================================================
// SECTION 4: UI Helpers
// ============================================================

function showTyping() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}

function clearChat() {
    messagesContainer.innerHTML = '';
    messageCount = 0;
    if (welcomeSection) {
        welcomeSection.style.display = 'block';
    }
    messageInput.focus();
    
    // Hapus riwayat chat Gemini di server
    fetch(API_BASE + '/api/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: SESSION_ID }),
    }).catch(() => {});
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// SECTION 5: Background Particles
// ============================================================

/**
 * Membuat animasi partikel di background.
 * 
 * Penjelasan:
 * - Partikel menambah kesan premium & dinamis
 * - Menggunakan CSS animation (bukan Canvas) agar ringan
 * - Setiap partikel punya ukuran, posisi, dan durasi acak
 * - Warna partikel sesuai color scheme (cyan & purple)
 */
function initParticles() {
    const colors = [
        'rgba(6, 182, 212, 0.3)',    // Cyan
        'rgba(139, 92, 246, 0.25)',   // Purple
        'rgba(236, 72, 153, 0.2)',    // Pink
        'rgba(6, 182, 212, 0.15)',    // Cyan light
    ];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const animDelay = Math.random() * 15;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: ${color};
            animation-duration: ${duration}s;
            animation-delay: ${animDelay}s;
        `;

        bgParticles.appendChild(particle);
    }
}
