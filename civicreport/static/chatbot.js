/* =============================================================================
   CivicReport – chatbot.js
   Floating CivicBot widget. Works on all pages.
   Uses /api/chat for FAQ + report lookups. No external AI key required.
   ============================================================================= */

(function () {
  'use strict';

  // ── Build the widget DOM ──────────────────────────────────────────────────

  function buildWidget() {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

    // FAB (floating action button)
    const fab = document.createElement('button');
    fab.id        = 'chatFab';
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', t('chat.open'));
    fab.setAttribute('title',      t('chat.open'));
    fab.innerHTML = '<span class="chat-fab-icon">💬</span>';

    // Panel
    const panel = document.createElement('div');
    panel.id        = 'chatPanel';
    panel.className = 'chat-panel';
    panel.setAttribute('role',       'dialog');
    panel.setAttribute('aria-label', t('chat.title'));
    panel.setAttribute('aria-modal', 'true');
    panel.hidden = true;

    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <span class="chat-avatar">🤖</span>
          <div>
            <div class="chat-title">${t('chat.title')}</div>
            <div class="chat-subtitle">${t('chat.subtitle')}</div>
          </div>
        </div>
        <button id="chatClose" class="chat-close-btn" aria-label="${t('chat.close')}">✕</button>
      </div>
      <div class="chat-body" id="chatBody" role="log" aria-live="polite" aria-atomic="false"></div>
      <div class="chat-input-row">
        <input type="text" id="chatInput" class="chat-input" maxlength="500"
               placeholder="${t('chat.ph')}" autocomplete="off">
        <button id="chatSendBtn" class="btn btn-primary chat-send" aria-label="${t('chat.send')}">${t('chat.send')}</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    return { fab, panel };
  }

  // ── Message rendering ─────────────────────────────────────────────────────

  function appendMessage(body, role, text) {
    const item = document.createElement('div');
    item.className = `chat-msg chat-msg-${role}`;

    // Convert **bold** markdown and \n to HTML
    const html = escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    item.innerHTML = `<div class="chat-bubble">${html}</div>`;
    body.appendChild(item);
    body.scrollTop = body.scrollHeight;
    return item;
  }

  function appendSuggestions(body, suggestions, onPick) {
    if (!suggestions || !suggestions.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-suggestions';
    suggestions.forEach(s => {
      const btn = document.createElement('button');
      btn.className   = 'chat-suggest-btn';
      btn.textContent = s;
      btn.addEventListener('click', () => {
        wrap.remove();
        onPick(s);
      });
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function appendTyping(body) {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
    const item = document.createElement('div');
    item.className = 'chat-msg chat-msg-bot';
    item.id        = 'chatTyping';
    item.innerHTML = `<div class="chat-bubble chat-typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    body.appendChild(item);
    body.scrollTop = body.scrollHeight;
    return item;
  }

  function removeTyping() {
    const el = document.getElementById('chatTyping');
    if (el) el.remove();
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── API call ─────────────────────────────────────────────────────────────

  async function sendMessage(message, body, onSuggest) {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

    appendMessage(body, 'user', message);
    const typing = appendTyping(body);

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message }),
      });
      removeTyping();
      if (!res.ok) throw new Error('server');
      const data = await res.json();
      appendMessage(body, 'bot', data.reply || t('chat.error'));
      if (data.suggestions && data.suggestions.length) {
        appendSuggestions(body, data.suggestions, onSuggest);
      }
    } catch {
      removeTyping();
      appendMessage(body, 'bot', t('chat.error'));
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
    const { fab, panel } = buildWidget();
    const body      = document.getElementById('chatBody');
    const input     = document.getElementById('chatInput');
    const sendBtn   = document.getElementById('chatSendBtn');
    const closeBtn  = document.getElementById('chatClose');

    let greeted = false;

    function showGreeting() {
      if (greeted) return;
      greeted = true;
      const greeting = t('chat.greeting');
      appendMessage(body, 'bot', greeting);
      appendSuggestions(body, [
        t('chat.suggest.submit'),
        t('chat.suggest.track'),
        t('chat.suggest.status'),
      ], handleSend);
    }

    function handleSend(text) {
      const msg = (text || input.value).trim();
      if (!msg) return;
      input.value = '';
      sendMessage(msg, body, handleSend);
    }

    // FAB toggles panel
    fab.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) {
        showGreeting();
        input.focus();
        fab.setAttribute('aria-label', t('chat.close'));
        fab.querySelector('.chat-fab-icon').textContent = '✕';
      } else {
        fab.setAttribute('aria-label', t('chat.open'));
        fab.querySelector('.chat-fab-icon').textContent = '💬';
      }
    });

    closeBtn.addEventListener('click', () => {
      panel.hidden = true;
      fab.setAttribute('aria-label', t('chat.open'));
      fab.querySelector('.chat-fab-icon').textContent = '💬';
      fab.focus();
    });

    sendBtn.addEventListener('click', () => handleSend());

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) {
        panel.hidden = true;
        fab.querySelector('.chat-fab-icon').textContent = '💬';
        fab.focus();
      }
    });

    // Re-apply translations when language changes
    document.addEventListener('civicLangChange', () => {
      const tNew = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
      fab.setAttribute('aria-label', panel.hidden ? tNew('chat.open') : tNew('chat.close'));
      input.placeholder = tNew('chat.ph');
      sendBtn.textContent = tNew('chat.send');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
