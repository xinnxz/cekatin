/**
 * Cepat Chat Embeddable Widget — widget.js
 * ===========================================
 * Cara kerja singkat:
 *
 *  1. Baca atribut data-* dari tag <script> yang memanggil file ini.
 *  2. Buat Shadow DOM di dalam #cepat-chat-root agar CSS kita tidak
 *     berbenturan dengan CSS website client (dan sebaliknya).
 *  3. Inject HTML + CSS ke dalam Shadow DOM.
 *  4. Fetch konfigurasi tenant dari backend (/api/widget/config).
 *  5. Fetch riwayat chat dari backend (/api/widget/history) —
 *     jika sudah pernah chat sebelumnya maka langsung tampil.
 *  6. Kirim pesan melalui /api/chat (endpoint utama Hybrid NLP + AI).
 *  7. Tampilkan balasan bot beserta suggested replies.
 *  8. Simpan session_id ke localStorage agar riwayat tidak hilang
 *     saat halaman di-refresh.
 *
 * Atribut <script> yang didukung:
 *   data-host           : URL backend, contoh "http://localhost:5000"
 *   data-tenant         : Slug tenant, contoh "reonshop"
 *   data-primary-color  : Warna tema, contoh "#4F46E5"
 *   data-position       : "bottom-right" (default) | "bottom-left"
 */

(function () {
  // Guards: jangan inisialisasi lebih dari sekali
  if (window.__cepatChatLoaded) return;
  window.__cepatChatLoaded = true;

  /* ─────────────── 1. Baca Config dari <script> tag ──────────────── */
  const $script = document.currentScript || (() => {
    const all = document.querySelectorAll('script[data-tenant]');
    return all[all.length - 1];
  })();

  /**
   * Fungsi helper untuk baca atribut dari tag script.
   * Penjelasan: getAttribute() bisa null jika atribut tidak ada,
   * maka kita gunakan `|| defaultVal` sebagai fallback.
   */
  const cfg = {
    host:    ($script.getAttribute('data-host')          || '').replace(/\/$/, ''),
    tenant:  $script.getAttribute('data-tenant')         || 'default',
    color:   $script.getAttribute('data-primary-color')  || '#4F46E5',
    pos:     $script.getAttribute('data-position')       || 'bottom-right',
  };

  // Inject CSS Variable untuk warna kustom
  const colorDark = shadeColor(cfg.color, -15);

  /* ─────────────── 2. Buat Shadow DOM Container ───────────────────── */
  /**
   * Shadow DOM = ruangan terisolasi di dalam DOM.
   * CSS di dalam Shadow DOM TIDAK bisa mempengaruhi halaman utama,
   * dan CSS halaman utama TIDAK bisa masuk ke dalam Shadow DOM.
   * Ini mencegah konflik style yang sangat umum terjadi pada widget
   * yang menggunakan iframe atau inject style biasa.
   */
  const $host = document.createElement('div');
  $host.id = 'cepat-chat-widget-root';
  document.body.appendChild($host);

  const shadow = $host.attachShadow({ mode: 'open' });

  /* ─────────────── 3. Inject CSS ─────────────────────────────────── */
  // Coba load external CSS file (sejajar dengan widget.js)
  const scriptBase = $script.src.substring(0, $script.src.lastIndexOf('/'));
  const $link = document.createElement('link');
  $link.rel = 'stylesheet';
  $link.href = `${scriptBase}/widget.css`;
  shadow.appendChild($link);

  /* ─────────────── 4. Inject HTML ────────────────────────────────── */
  const isLeft = cfg.pos === 'bottom-left';
  const side   = isLeft ? 'left: 24px; right: auto;' : '';

  const $root = document.createElement('div');
  $root.innerHTML = `
    <!-- Floating Action Button -->
    <button class="ck-fab" id="ck-fab" style="background:${cfg.color}; box-shadow: 0 4px 20px ${cfg.color}80; ${side}">
      <!-- Icon: Chat bubble -->
      <svg class="ck-icon-chat" viewBox="0 0 24 24">
        <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
      </svg>
      <!-- Icon: Close / X -->
      <svg class="ck-icon-close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      <span class="ck-badge" id="ck-badge"></span>
    </button>

    <!-- Chat Window -->
    <div class="ck-window" id="ck-window" style="${side.replace('left','bottom').replace('24px','96px')}">

      <!-- Header -->
      <div class="ck-header" id="ck-header" style="background: linear-gradient(135deg, ${cfg.color} 0%, #2563EB 100%);">
        <div class="ck-avatar" id="ck-avatar">
          <span class="ck-avatar-initials" id="ck-initials">AI</span>
        </div>
        <div class="ck-header-info">
          <div class="ck-header-name" id="ck-botname">Loading...</div>
          <div class="ck-header-status">
            <span class="ck-status-dot"></span>
            Online &middot; AI-Powered
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="ck-body" id="ck-body">
        <!-- Pesan akan di-inject di sini oleh JS -->
      </div>

      <!-- Footer Input -->
      <form class="ck-footer" id="ck-form">
        <input  class="ck-input"  id="ck-input"
                type="text"
                placeholder="Ketik pesan..."
                autocomplete="off"
                maxlength="500" />
        <button class="ck-send" id="ck-send" type="submit"
                style="background: ${cfg.color}">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>

      <div class="ck-powered">
        Powered by <a href="https://cepat.chat" target="_blank" rel="noopener">Cepat Chat</a>
      </div>
    </div>
  `;
  shadow.appendChild($root);

  /* ─────────────── 5. Referensi Elemen ───────────────────────────── */
  const $fab    = shadow.getElementById('ck-fab');
  const $win    = shadow.getElementById('ck-window');
  const $body   = shadow.getElementById('ck-body');
  const $form   = shadow.getElementById('ck-form');
  const $input  = shadow.getElementById('ck-input');
  const $send   = shadow.getElementById('ck-send');
  const $botname = shadow.getElementById('ck-botname');
  const $initials = shadow.getElementById('ck-initials');
  const $badge  = shadow.getElementById('ck-badge');

  /* ─────────────── 6. State ──────────────────────────────────────── */
  /**
   * State = data internal widget yang berubah saat runtime.
   * Kita simpan dalam satu objek agar mudah dilacak.
   */
  const state = {
    open:      false,   // Apakah jendela chat terbuka?
    typing:    false,   // Apakah bot sedang "mengetik"?
    unread:    0,       // Jumlah pesan belum dibaca
    sessionId: getOrMakeSessionId(),   // ID sesi visitor (persistent)
    config:    {        // Config yang akan diisi dari API
      primaryColor:    cfg.color,
      botName:         'Virtual Assistant',
      greetingMessage: 'Halo! Ada yang bisa kami bantu? 😊',
    },
  };

  /* ─────────────── 7. Fungsi-fungsi Helper ───────────────────────── */

  /**
   * getOrMakeSessionId()
   * Ambil session ID dari localStorage, atau buat baru jika belum ada.
   * Session ID ini dipakai backend untuk mengelompokkan pesan ke 1 conversation.
   * Dengan menyimpannya di localStorage, riwayat chat tidak hilang saat refresh.
   */
  function getOrMakeSessionId() {
    const KEY = `ck_sid_${cfg.tenant}`;
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      // Generate UUID v4-like string
      sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      localStorage.setItem(KEY, sid);
    }
    return sid;
  }

  /**
   * apiCall(endpoint, options)
   * Wrapper fetch ke backend dengan header X-Tenant-Slug sudah disertakan.
   * Selalu mengembalikan parsed JSON atau null jika gagal.
   */
  async function apiCall(endpoint, options = {}) {
    try {
      const res = await fetch(`${cfg.host}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type':   'application/json',
          'X-Tenant-Slug':  cfg.tenant,
          ...(options.headers || {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Cepat Chat Widget] API error:', err.message);
      return null;
    }
  }

  /** scrollToBottom — selalu scroll ke paling bawah saat pesan baru muncul */
  function scrollToBottom() {
    $body.scrollTop = $body.scrollHeight;
  }

  /**
   * appendMsg(text, sender)
   * Tambahkan bubble pesan ke dalam area chat.
   * sender: 'bot' | 'user'
   *
   * Kenapa kita ganti \n jadi <br>?
   * Karena response dari AI sering mengandung newline untuk list/formatting.
   */
  function appendMsg(text, sender) {
    // Hapus suggested replies lama saat user kirim pesan baru
    if (sender === 'user') removeSuggestions();

    const $msg = document.createElement('div');
    $msg.className = `ck-msg ${sender}`;
    // Ganti \n menjadi <br> untuk formatting multi-baris
    $msg.innerHTML = text.replace(/\n/g, '<br>');
    $body.appendChild($msg);
    scrollToBottom();
  }

  /** showTyping / hideTyping — tampilkan/sembunyikan animasi ". . ." */
  function showTyping() {
    if (state.typing) return;
    state.typing = true;
    const $t = document.createElement('div');
    $t.className = 'ck-typing';
    $t.id = 'ck-typing';
    $t.innerHTML = `
      <div class="ck-typing-dot"></div>
      <div class="ck-typing-dot"></div>
      <div class="ck-typing-dot"></div>
    `;
    $body.appendChild($t);
    scrollToBottom();
  }

  function hideTyping() {
    const $t = shadow.getElementById('ck-typing');
    if ($t) $t.remove();
    state.typing = false;
  }

  /**
   * appendSuggestions(replies)
   * Tampilkan chip button suggested replies di bawah pesan bot.
   * Saat chip diklik → langsung kirim pesan tersebut.
   */
  function appendSuggestions(replies) {
    if (!replies || replies.length === 0) return;
    removeSuggestions(); // Hapus yang lama

    const $wrap = document.createElement('div');
    $wrap.className = 'ck-suggestions';
    $wrap.id = 'ck-suggestions';

    replies.forEach(r => {
      const $chip = document.createElement('button');
      $chip.className = 'ck-chip';
      $chip.textContent = r.text;
      $chip.style.borderColor = state.config.primaryColor;
      $chip.style.color = state.config.primaryColor;
      // Hover CSS sudah di-handle di widget.css
      $chip.addEventListener('click', () => sendMessage(r.message || r.text));
      $wrap.appendChild($chip);
    });

    $body.appendChild($wrap);
    scrollToBottom();
  }

  function removeSuggestions() {
    const old = shadow.getElementById('ck-suggestions');
    if (old) old.remove();
  }

  /** updateUnreadBadge — tampilkan angka notifikasi di FAB */
  function updateUnreadBadge() {
    if (state.unread > 0 && !state.open) {
      $badge.textContent = state.unread > 9 ? '9+' : state.unread;
      $badge.classList.add('visible');
    } else {
      $badge.classList.remove('visible');
      state.unread = 0;
    }
  }

  /** shadeColor — sedikit gelap/terang sebuah hex color */
  function shadeColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /* ─────────────── 8. Inisialisasi Widget ────────────────────────── */

  /**
   * initWidget()
   * Jalankan saat halaman pertama kali load:
   *  A. Fetch config dari backend → update nama bot & warna
   *  B. Fetch history dari backend → tampilkan chat lama
   *  C. Jika tidak ada history → tampilkan greeting
   */
  async function initWidget() {
    // A. Ambil konfigurasi dari backend
    const config = await apiCall(`/api/widget/config?tenant=${cfg.tenant}`);
    if (config && !config.error) {
      state.config = { ...state.config, ...config };
      $botname.textContent = state.config.botName;
      // Update initials dari nama bot (ambil huruf pertama kata pertama & kedua)
      const words = state.config.botName.split(' ');
      $initials.textContent = words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : words[0][0].toUpperCase();
    } else {
      $botname.textContent = state.config.botName; // Fallback
    }

    // B. Ambil riwayat chat sebelumnya
    const hist = await apiCall(
      `/api/widget/history?tenant=${cfg.tenant}&session_id=${state.sessionId}`
    );

    if (hist && hist.messages && hist.messages.length > 0) {
      hist.messages.forEach(m => appendMsg(m.text, m.sender));
    } else {
      setTimeout(() => {
        appendMsg(state.config.greetingMessage, 'bot');
        if (!state.open) {
          state.unread++;
          updateUnreadBadge();
        }
      }, 600);
    }
  }

  /* ─────────────── 9. Kirim Pesan ────────────────────────────────── */

  /**
   * sendMessage(text)
   * Alur pengiriman pesan:
   *  1. Tampilkan bubble user
   *  2. Tampilkan typing indicator
   *  3. POST ke /api/chat (endpoint Hybrid NLP + AI)
   *  4. Tampilkan respon bot + suggested replies
   */
  async function sendMessage(text) {
    text = (text || '').trim();
    if (!text || state.typing) return;

    appendMsg(text, 'user');
    $input.value = '';
    $input.disabled = true;
    $send.disabled  = true;
    showTyping();

    const data = await apiCall('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message:    text,
        session_id: state.sessionId,
        tenant:     cfg.tenant,
      }),
    });

    hideTyping();
    $input.disabled = false;
    $send.disabled  = false;
    $input.focus();

    if (data && data.response) {
      appendMsg(data.response, 'bot');
      if (data.suggested_replies?.length) {
        appendSuggestions(data.suggested_replies);
      }
    } else {
      appendMsg(
        'Maaf, tidak bisa terhubung ke server saat ini. Silakan coba lagi. 🙏',
        'bot'
      );
    }

    // Tambah unread jika window sedang tutup
    if (!state.open) {
      state.unread++;
      updateUnreadBadge();
    }
  }

  /* ─────────────── 10. Toggle Window Open/Close ───────────────────── */

  function toggleWindow() {
    state.open = !state.open;
    $fab.classList.toggle('is-open', state.open);
    $win.classList.toggle('is-open', state.open);

    if (state.open) {
      // Reset unread badge saat dibuka
      state.unread = 0;
      updateUnreadBadge();
      scrollToBottom();
      setTimeout(() => $input.focus(), 320);
    }
  }

  /* ─────────────── 11. Event Listeners ───────────────────────────── */

  // Klik FAB → toggle window
  $fab.addEventListener('click', toggleWindow);

  // Submit form → kirim pesan
  $form.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage($input.value);
  });

  // Enter key pada input (tanpa Shift) → submit
  $input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage($input.value);
    }
  });

  /* ─────────────── 12. Jalankan! ─────────────────────────────────── */
  initWidget();

})(); // IIFE — langsung dipanggil saat file selesai dimuat
