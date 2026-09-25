(() => {
  'use strict';
  const FILE = 'test-travelgtc-mira-first-pages-20260924-v2--mira-first-prototype.json';
  const EXPECTED_SHA = 'c6786456af30708d13c9da9d38df6c98e7f0d402a7d64a37064f0780e87a186f';
  const API = '/api/travelgtc/v1/crm/content-review/pilot-20260922/files/';
  const frame = document.getElementById('preview');
  const gate = document.getElementById('gate');
  const login = document.getElementById('login');
  let payload = null, current = '', draft = '', validationTimer = null;
  const selected = () => location.hash === '#mira' ? 'mira' : 'home';
  function fail(title, detail, needsLogin = false) {
    payload = null; draft = ''; current = '';
    frame.hidden = true; frame.removeAttribute('srcdoc');
    gate.hidden = false; gate.querySelector('h1').textContent = title;
    document.getElementById('gate-detail').textContent = detail;
    login.hidden = !needsLogin;
    login.href = '/auth/?mode=login&next=' + encodeURIComponent(location.pathname + location.hash);
    clearInterval(validationTimer);
  }
  function show() {
    if (!payload) return;
    const page = selected();
    document.querySelectorAll('[data-page]').forEach(a => a.toggleAttribute('aria-current', false));
    document.querySelector('[data-page="' + page + '"]').setAttribute('aria-current', 'page');
    frame.title = 'Предпросмотр · ' + (page === 'home' ? 'Главная TravelGTC' : 'Разговор с Мирой');
    if (page !== current) { frame.srcdoc = payload.pages[page]; current = page; }
    frame.hidden = false; gate.hidden = true;
  }
  async function verifyAccess() {
    if (!payload) return;
    try {
      const r = await fetch('/api/travelgtc/v1/crm/content-review/pilot-20260922', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (r.status === 401 || r.status === 403) fail('Войдите для просмотра макета', 'Доступ открыт команде TravelGTC в закрытом разделе CRM.', true);
      else if (!r.ok) fail('Проверка доступа временно недоступна', 'Обновите страницу, чтобы повторить проверку.');
    } catch { fail('Не удалось подтвердить доступ', 'Проверьте соединение и обновите страницу.'); }
  }
  document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
    document.body.classList.toggle('phone', button.dataset.device === 'phone');
    document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  window.addEventListener('hashchange', show);
  window.addEventListener('message', event => {
    if (!payload || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (data?.type === 'travelgtc-preview:navigate' && ['home', 'mira'].includes(data.page)) {
      draft = typeof data.text === 'string' ? data.text.slice(0, 500) : '';
      location.hash = data.page; show();
    } else if (data?.type === 'travelgtc-preview:ready') {
      frame.contentWindow.postMessage({ type: 'travelgtc-preview:prefill', text: draft }, '*');
    }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) verifyAccess(); });
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
  (async () => {
    try {
      const r = await fetch(API + FILE, { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (r.status === 401 || r.status === 403) return fail('Войдите для просмотра макета', 'Доступ открыт команде TravelGTC в закрытом разделе CRM.', true);
      if (!r.ok) throw Error('fetch');
      const bytes = await r.arrayBuffer();
      const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
      if (sha !== EXPECTED_SHA) throw Error('hash');
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data.schema_version !== 1 || data.project_id !== '0040' || data.id !== 'mira-first-20260924-v2' || data.no_live_ai !== true || data.status !== 'DESIGN_PREVIEW_ONLY' || !['home', 'mira'].every(p => typeof data.pages?.[p] === 'string')) throw Error('scope');
      payload = data; show(); validationTimer = setInterval(verifyAccess, 60000);
    } catch { fail('Не удалось открыть предпросмотр', 'Макет не загружен или его контрольная сумма не совпала. Обновите страницу; если ошибка повторится, сообщите команде.'); }
  })();
})();
