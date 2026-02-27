/**
 * CekatIn Embeddable Widget (Vanilla JS)
 * ============================================================================
 * Arsitektur:
 * - IIFE (Immediately Invoked Function Expression) untuk menghindari scope leak.
 * - Shadow DOM untuk mengisolasi style CSS agar tidak merusak web client.
 * - Fetch API untuk menghubungi backend Flask.
 * - localStorage untuk menyimpan session ID agar chat history tidak hilang.
 */

(function() {
  // Hanya inisialisasi satu kali
  if (window.CekatInWidgetInitialized) return;
  window.CekatInWidgetInitialized = true;

  // 1. Ambil config dari element <script> yang memuat widget ini
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  // Fallback endpoint; if running locally via app.py, it might be same origin.
  // In production, this should point to the actual backend URL.
  const API_BASE = currentScript.getAttribute('data-host') || 'http://localhost:5000';
  const TENANT_SLUG = currentScript.getAttribute('data-tenant') || 'default';
  
  // Konfigurasi state internal
  const state = {
    isOpen: false,
    session_id: getOrCreateSessionId(),
    config: {
      primaryColor: currentScript.getAttribute('data-primary-color') || '#4F46E5',
      botName: 'Support',
      greetingMessage: 'Halo! Ada yang bisa kami bantu?',
      logoUrl: ''
    },
    isTyping: false
  };

  // Helper untuk mendapatkan atau membuat session ID yang persisten
  function getOrCreateSessionId() {
    const key = `cekatin_session_${TENANT_SLUG}`;
    let sid = localStorage.getItem(key);
    if (!sid) {
      // Buat simple random UUID v4-like
      sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem(key, sid);
    }
    return sid;
  }

  // 2. Buat container utama untuk Shadow DOM
  const container = document.createElement('div');
  container.id = 'cekatin-widget-container';
  // Penting: letakkan container ini di atas semua element agar tidak tertutup z-index
  container.style.position = 'fixed';
  container.style.bottom = '0';
  container.style.right = '0';
  container.style.zIndex = '999999';
  container.style.pointerEvents = 'none'; // Biar klik nembus kalau bukan di widget
  document.body.appendChild(container);

  // Buat Shadow Root
  const shadow = container.attachShadow({ mode: 'open' });

  // 3. Load CSS ke dalam Shadow DOM
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  // Asumsikan struktur folder: widget.css sejajar dengan widget.js
  const scriptSrc = currentScript.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
  styleLink.href = `${baseUrl}/widget.css`;
  shadow.appendChild(styleLink);

  // Kita juga bisa inject style secara fallback jika external css gagal load
  // tapi kita mengandalkan link rel untuk clean code.

  // 4. Render UI Dasar
  const wrapper = document.createElement('div');
  wrapper.style.pointerEvents = 'auto'; // Widget elemen-nya bisa diklik
  wrapper.innerHTML = `
    <!-- Floating Button -->
    <button class="cekatin-fab" id="cekat-fab" style="background-color: ${state.config.primaryColor}">
      <!-- Icon Chat (Tampil saat ditutup) -->
      <svg class="icon-chat" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
      </svg>
      <!-- Icon Close (Tampil saat dibuka) -->
      <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- Chat Window -->
    <div class="cekatin-window" id="cekat-window">
      <!-- Header -->
      <div class="cekatin-header" id="cekat-header" style="background: linear-gradient(135deg, ${state.config.primaryColor}, #2563EB)">
        <div class="cekatin-avatar">
          <svg style="width:24px;height:24px;fill:white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div class="cekatin-header-info">
          <h3 class="cekatin-title" id="cekat-title">Loading...</h3>
          <p class="cekatin-subtitle">
            <span class="cekatin-online-dot"></span> Online - AI Agent
          </p>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="cekatin-body" id="cekat-body">
        <!-- Messages will be injected here -->
      </div>

      <!-- Input Area -->
      <form class="cekatin-footer" id="cekat-form">
        <input type="text" class="cekatin-input" id="cekat-input" placeholder="Ketik pesan..." autocomplete="off">
        <button type="submit" class="cekatin-send-btn" id="cekat-send" style="background-color: ${state.config.primaryColor}">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
      <div class="cekatin-powered">
        Powered by <a href="#" target="_blank" id="cekat-powered-link">CekatIn</a>
      </div>
    </div>
  `;
  shadow.appendChild(wrapper);

  // 5. DOM Elements References
  const fab = shadow.getElementById('cekat-fab');
  const windowEl = shadow.getElementById('cekat-window');
  const bodyEl = shadow.getElementById('cekat-body');
  const formEl = shadow.getElementById('cekat-form');
  const inputEl = shadow.getElementById('cekat-input');
  const sendBtn = shadow.getElementById('cekat-send');
  const titleEl = shadow.getElementById('cekat-title');
  const headerEl = shadow.getElementById('cekat-header');

  // 6. API Helpers
  async function apiCall(endpoint, options = {}) {
    const url = \`\${API_BASE}\${endpoint}\`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': TENANT_SLUG,
      ...(options.headers || {})
    };
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) throw new Error(\`Network error: \${res.status}\`);
      return await res.json();
    } catch (err) {
      console.error('[CekatIn Widget] API Error:', err);
      return null;
    }
  }

  // 7. Load Configuration & History
  async function initWidget() {
    // A. Fetch Config
    const config = await apiCall('/api/widget/config');
    if (config && config.primaryColor) {
      state.config = { ...state.config, ...config };
      
      // Update UI dengan config dari backend
      titleEl.textContent = state.config.botName;
      fab.style.backgroundColor = state.config.primaryColor;
      sendBtn.style.backgroundColor = state.config.primaryColor;
      headerEl.style.background = \`linear-gradient(135deg, \${state.config.primaryColor}, #2563EB)\`;
      
      // Ubah warna fallback CSS variable via JS manipulation jika perlu
      wrapper.style.setProperty('--cekatin-primary', state.config.primaryColor);
    } else {
      titleEl.textContent = state.config.botName; // fallback
    }

    // B. Fetch History
    const historyRes = await apiCall(\`/api/widget/history?session_id=\${state.session_id}\`);
    
    if (historyRes && historyRes.messages && historyRes.messages.length > 0) {
      // Load history
      historyRes.messages.forEach(msg => {
        appendMessage(msg.text, msg.sender);
      });
    } else {
      // First time user, show greeting
      setTimeout(() => {
        appendMessage(state.config.greetingMessage, 'bot');
      }, 500);
    }
    scrollToBottom();
  }

  // 8. UI Interactions
  function toggleWidget() {
    state.isOpen = !state.isOpen;
    if (state.isOpen) {
      fab.classList.add('is-open');
      windowEl.classList.add('is-open');
      setTimeout(() => inputEl.focus(), 300);
      scrollToBottom();
    } else {
      fab.classList.remove('is-open');
      windowEl.classList.remove('is-open');
    }
  }

  fab.addEventListener('click', toggleWidget);

  // Auto-resize / scroll to bottom
  function scrollToBottom() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  // Render text bubble
  function appendMessage(text, sender) {
    // Hapus suggestions sebelumnya jika pesan berasal dari user
    if (sender === 'user') {
      const oldSuggestions = bodyEl.querySelector('.cekatin-suggestions');
      if (oldSuggestions) oldSuggestions.remove();
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = \`cekatin-message \${sender}\`;
    
    // Convert newlines to <br> for formatting
    const formattedText = text.replace(/\\n/g, '<br>');
    msgDiv.innerHTML = formattedText;
    
    bodyEl.appendChild(msgDiv);
    scrollToBottom();
  }

  // Menampilkan animasi typing
  function showTyping() {
    state.isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'cekatin-typing';
    typingDiv.id = 'cekat-typing-indicator';
    typingDiv.innerHTML = \`
      <div class="cekatin-typing-dot"></div>
      <div class="cekatin-typing-dot"></div>
      <div class="cekatin-typing-dot"></div>
    \`;
    bodyEl.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTyping() {
    const typingDiv = shadow.getElementById('cekat-typing-indicator');
    if (typingDiv) typingDiv.remove();
    state.isTyping = false;
  }

  // Render suggestion chips
  function appendSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) return;
    
    // Hapus suggestions yang lama
    const oldSuggestions = bodyEl.querySelector('.cekatin-suggestions');
    if (oldSuggestions) oldSuggestions.remove();

    const sugDiv = document.createElement('div');
    sugDiv.className = 'cekatin-suggestions';
    
    suggestions.forEach(sug => {
      const btn = document.createElement('button');
      btn.className = 'cekatin-suggestion-btn';
      btn.textContent = sug.text;
      btn.style.borderColor = state.config.primaryColor;
      btn.style.color = state.config.primaryColor;
      
      // Hover effects handle via CSS, tap handling via JS:
      btn.addEventListener('click', () => {
        handleSendMessage(sug.message || sug.text);
      });
      
      sugDiv.appendChild(btn);
    });
    
    bodyEl.appendChild(sugDiv);
    scrollToBottom();
  }

  // 9. Send Message Logic
  async function handleSendMessage(text) {
    if (!text || !text.trim()) return;
    if (state.isTyping) return; // Mencegah spam klik

    const message = text.trim();
    
    // User bubble
    appendMessage(message, 'user');
    inputEl.value = '';
    
    // Loading state
    showTyping();
    inputEl.disabled = true;
    sendBtn.disabled = true;

    // Call API (using the main `/api/chat` route which handles Hybrid AI)
    const data = await apiCall('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        session_id: state.session_id
      })
    });

    hideTyping();
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();

    if (data && data.response) {
      appendMessage(data.response, 'bot');
      if (data.suggested_replies && data.suggested_replies.length > 0) {
        appendSuggestions(data.suggested_replies);
      }
    } else {
      appendMessage("Maaf, terjadi kesalahan pada server. Kami tidak bisa memproses pesan Anda saat ini.", 'bot');
    }
  }

  // Form submit handler
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage(inputEl.value);
  });

  // Initialize!
  initWidget();

})();
