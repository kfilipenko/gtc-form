(() => {
  'use strict';
  const api = '/api/travelgtc/v1/crm/content-review/pilot-20260922';
  const params = new URLSearchParams(location.search);
  let filename = params.get('file') || '';
  let guideBinding = null;
  const validName = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,210}\.(md|txt|json|srt|vtt)$/;
  const byId = (id) => document.getElementById(id);
  const rawUrl = (name) => `${api}/files/${encodeURIComponent(name)}`;
  const viewUrl = (name) => `/crm/strategy/content-review/document/?file=${encodeURIComponent(name)}`;
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const anchor = (label, href) => {
    const node = element('a', label);
    node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer';
    return node;
  };
  const controller = new AbortController();
  let visible = true;
  let siblings = new Set();
  const guideUrl = (section) => `/crm/strategy/video-guide/?section=${encodeURIComponent(section)}`;
  function documentUrl(name) {
    const section = guideBinding?.sections.find((item) => item.file === name);
    return section ? guideUrl(section.id) : viewUrl(name);
  }
  async function selectGuideDocument() {
    const bindingUrl = document.body.dataset.guideBinding;
    if (!bindingUrl) return;
    const response = await fetch(bindingUrl, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('Guide binding unavailable');
    const binding = await response.json();
    if (binding.schema_version !== 1 || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(binding.package_id) ||
      typeof binding.version !== 'string' || binding.version.length > 30 ||
      !Array.isArray(binding.sections) || !binding.sections.length || binding.sections.length > 8 ||
      binding.sections.some((item) => !/^[a-z][a-z0-9-]{0,30}$/.test(item.id) ||
        typeof item.label !== 'string' || item.label.length > 80 || !validName.test(item.file) ||
        item.file.includes('..') || !item.file.startsWith(`test-${binding.package_id}--`)) ||
      new Set(binding.sections.map((item) => item.id)).size !== binding.sections.length) throw new Error('Invalid guide binding');
    const section = binding.sections.find((item) => item.id === (params.get('section') || binding.sections[0].id));
    if (!section) throw new Error('Unknown guide section');
    guideBinding = binding; filename = section.file;
    const navigation = byId('guide-navigation'); navigation.replaceChildren();
    for (const item of binding.sections) {
      const link = anchor(item.label, guideUrl(item.id));
      if (item.id === section.id) link.setAttribute('aria-current', 'page');
      navigation.append(link);
    }
    byId('guide-version').textContent = `Рабочая редакция ${binding.version}`;
  }
  function resolveLink(value) {
    if (value.startsWith('#')) return value;
    if (/^https?:\/\//i.test(value)) {
      try { const url = new URL(value); return url.username || url.password ? null : url.href; }
      catch { return null; }
    }
    // Only known sibling documents may resolve relative paths; never expose server paths.
    const [name, hash] = value.split('#', 2);
    let decoded;
    try { decoded = decodeURIComponent(name); } catch { return null; }
    if (!validName.test(decoded) || decoded.includes('..')) return null;
    const prefix = filename.startsWith('test-') ? filename.slice(0, filename.indexOf('--') + 2) : '';
    const target = prefix + decoded;
    if (!siblings.has(target)) return null;
    try { return documentUrl(target) + (hash ? '#' + encodeURIComponent(decodeURIComponent(hash)) : ''); }
    catch { return null; }
  }
  function inline(parent, text) {
    // A bounded Markdown subset, rendered as DOM text. Raw HTML is never evaluated.
    const tokens = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\))/g;
    let offset = 0;
    for (const match of text.matchAll(tokens)) {
      parent.append(document.createTextNode(text.slice(offset, match.index)));
      const part = match[0];
      if (part.startsWith('`')) parent.append(element('code', part.slice(1, -1)));
      else if (part.startsWith('**')) parent.append(element('strong', part.slice(2, -2)));
      else {
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        const href = resolveLink(link[2]);
        if (href) {
          const node = anchor(link[1], href);
          if (href.startsWith('#')) node.removeAttribute('target');
          parent.append(node);
        } else parent.append(document.createTextNode(link[1]));
      }
      offset = match.index + part.length;
    }
    parent.append(document.createTextNode(text.slice(offset)));
  }
  function markdown(text) {
    const fragment = document.createDocumentFragment();
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const headingCounts = new Map();
    const listLine = (line) => /^\s*(?:[-*+] |\d+[.)] )/.test(line);
    const tableSeparator = (line) => /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
    const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((s) => s.trim());
    const special = (i) => /^\s*(?:#{1,6} |```|>|---+$)/.test(lines[i]) || listLine(lines[i]) ||
      (lines[i].includes('|') && tableSeparator(lines[i + 1] || ''));
    let i = 0;
    while (i < lines.length) {
      if (!lines[i].trim()) { i++; continue; }
      if (lines[i].startsWith('```')) {
        const code = []; i++;
        while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
        i++; const pre = element('pre'); pre.append(element('code', code.join('\n'))); fragment.append(pre); continue;
      }
      const heading = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
      if (heading) {
        const h = element('h' + heading[1].length); inline(h, heading[2]);
        const slug = h.textContent.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s+/g, '-');
        const count = headingCounts.get(slug) || 0; headingCounts.set(slug, count + 1);
        h.id = count ? `${slug}-${count}` : slug; fragment.append(h); i++; continue;
      }
      if (lines[i].includes('|') && tableSeparator(lines[i + 1] || '')) {
        const wrap = element('div'); wrap.className = 'table-scroll'; wrap.tabIndex = 0;
        const table = element('table'), head = element('thead'), tr = element('tr');
        for (const value of cells(lines[i])) { const th = element('th'); th.scope = 'col'; inline(th, value); tr.append(th); }
        head.append(tr); table.append(head); i += 2; const body = element('tbody');
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          const row = element('tr'); for (const value of cells(lines[i++])) { const td = element('td'); inline(td, value); row.append(td); } body.append(row);
        }
        table.append(body); wrap.append(table); fragment.append(wrap); continue;
      }
      if (listLine(lines[i])) {
        const ordered = /^\s*\d/.test(lines[i]), list = element(ordered ? 'ol' : 'ul');
        while (i < lines.length && listLine(lines[i]) && /^\s*\d/.test(lines[i]) === ordered) {
          let text = lines[i++].replace(/^\s*(?:[-*+] |\d+[.)] )/, '');
          while (i < lines.length && lines[i].trim() && !special(i)) text += ' ' + lines[i++].trim();
          const item = element('li'); inline(item, text); list.append(item);
        }
        fragment.append(list); continue;
      }
      if (/^>/.test(lines[i])) {
        const quote = element('blockquote'), values = [];
        while (i < lines.length && /^>/.test(lines[i])) values.push(lines[i++].replace(/^>\s?/, ''));
        inline(quote, values.join(' ')); fragment.append(quote); continue;
      }
      if (/^\s*---+\s*$/.test(lines[i])) { fragment.append(element('hr')); i++; continue; }
      const values = [lines[i++]];
      while (i < lines.length && lines[i].trim() && !special(i)) values.push(lines[i++]);
      const p = element('p'); inline(p, values.join(' ')); fragment.append(p);
    }
    return fragment;
  }
  function fail(message, login = false) {
    byId('document-workspace').hidden = true;
    byId('document-content').replaceChildren(); byId('document-related').replaceChildren();
    const status = byId('document-status'); status.hidden = false; status.replaceChildren(element('p', message));
    if (login) status.append(anchor('Войти в TravelGTC', '/auth/?mode=login'));
  }
  async function load() {
    try {
      await selectGuideDocument();
      if (!validName.test(filename) || filename.includes('..')) return fail('Ссылка на документ некорректна. Откройте его из списка материалов.');
      const options = { credentials: 'same-origin', cache: 'no-store', signal: controller.signal };
      const [response, catalogResponse] = await Promise.all([fetch(rawUrl(filename), options), fetch(api, options)]);
      if ([response.status, catalogResponse.status].some((code) => code === 401 || code === 403)) return fail('Документ доступен владельцу проекта и команде CRM. Войдите и обновите страницу.', true);
      if (!response.ok || !catalogResponse.ok) return fail('Документ не найден или временно недоступен. Вернитесь к списку материалов.');
      if (Number(response.headers.get('content-length')) > 2097152) return fail('Документ слишком большой для просмотра. Откройте исходный файл из списка материалов.');
      const [source, catalog] = await Promise.all([response.text(), catalogResponse.json()]);
      if (!visible) return;
      if (source.length > 2097152) return fail('Документ слишком большой для просмотра.');
      const tests = catalog.review?.test_results || [];
      const test = tests.find((t) => t.files?.some((f) => f.file === filename));
      if (guideBinding && test?.id !== guideBinding.package_id) return fail('Рабочая редакция руководства пока недоступна. Вернитесь к материалам или обновите страницу позже.');
      siblings = new Set(test ? test.files.filter((f) => validName.test(f.file)).map((f) => f.file) : ['PILOT-REPORT.md', 'calendar-14-days.md', 'travelgtc-pilot-transcript.json']);
      const label = test?.files.find((f) => f.file === filename)?.label || filename;
      document.title = `${label} — TravelGTC`;
      byId('document-source').textContent = test ? `${test.title} · ${test.date}` : label;
      for (const asset of test?.files || []) {
        if (asset.file !== filename && siblings.has(asset.file) && !guideBinding?.sections.some((item) => item.file === asset.file)) byId('document-related').append(anchor(asset.label, documentUrl(asset.file)));
      }
      const content = byId('document-content');
      if (filename.endsWith('.md')) content.append(markdown(source));
      else {
        let text = source;
        if (filename.endsWith('.json')) { try { text = JSON.stringify(JSON.parse(source), null, 2); } catch { /* Preserve unparseable source as text. */ } }
        content.append(element('h1', label), element('pre', text));
      }
      byId('document-download').href = rawUrl(filename);
      byId('document-download').download = filename;
      byId('document-status').hidden = true; byId('document-workspace').hidden = false;
      if (location.hash) {
        try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid fragment has no navigation effect. */ }
      }
    } catch (error) {
      if (error.name !== 'AbortError') fail('Не удалось открыть документ. Обновите страницу.');
    }
  }
  window.addEventListener('pagehide', () => { visible = false; controller.abort(); fail('Откройте документ заново.'); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });
  load();
})();
