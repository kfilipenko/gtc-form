(() => {
  'use strict';
  const api = '/api/travelgtc/v1/crm/content-review/pilot-20260922';
  const file = (name) => `${api}/files/${encodeURIComponent(name)}`;
  const openFile = (name) => /\.(md|txt|json|srt|vtt)$/i.test(name)
    ? `/crm/strategy/content-review/document/?file=${encodeURIComponent(name)}` : file(name);
  const byId = (id) => document.getElementById(id);
  const labels = { travel: 'Путешествия', hotels: 'Отели', activities: 'Активности', experiences: 'Life Experiences', partner: 'Партнёрская деятельность' };
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const link = (label, href) => {
    const element = node('a', label); element.href = href;
    element.target = '_blank'; element.rel = 'noopener noreferrer';
    return element;
  };
  const details = (label, text) => {
    const element = node('details'); element.append(node('summary', label), node('p', text, 'copy-text')); return element;
  };
  function clearPrivateContent() {
    byId('review-workspace').hidden = true;
    for (const media of document.querySelectorAll('#review-workspace video, #review-workspace audio')) {
      media.pause(); media.removeAttribute('src'); media.removeAttribute('poster'); media.replaceChildren(); media.load();
    }
    byId('test-list').replaceChildren();
  }
  function showError(message, canLogin) {
    clearPrivateContent();
    const status = byId('load-status'); status.hidden = false; status.replaceChildren(node('p', message));
    if (canLogin) {
      const login = node('a', 'Войти в TravelGTC', 'link-button'); login.href = '/auth/?mode=login'; status.append(login);
      status.append(node('p', 'После входа вернитесь на эту страницу.'));
    }
    const retry = node('button', 'Обновить страницу', 'link-button'); retry.type = 'button'; retry.addEventListener('click', () => location.reload()); status.append(retry);
  }
  function render(review) {
    byId('review-title').textContent = review.title;
    byId('review-summary').textContent = review.summary;
    byId('review-budget').textContent = review.budget;
    const tests = Array.isArray(review.test_results) ? review.test_results : [];
    byId('test-results').hidden = tests.length === 0;
    byId('test-results-nav').hidden = tests.length === 0;
    byId('test-list').replaceChildren();
    for (const test of tests) {
      const card = node('article', undefined, 'post-card test-card'); card.id = `test-${test.id}`;
      card.append(node('p', test.date, 'eyebrow'), node('h3', test.title),
        node('span', test.status_label, 'badge revise'), node('p', test.summary));
      const assets = Array.isArray(test.files) ? test.files : [];
      const main = assets.find((asset) => asset.kind === 'video' && asset.primary);
      if (main) {
        const video = node('video'); video.controls = true; video.playsInline = true;
        video.preload = 'metadata'; video.src = file(main.file);
        video.setAttribute('aria-label', test.title); video.className = 'test-video'; card.append(video);
      }
      const notes = node('ul', undefined, 'review-findings');
      for (const note of test.notes || []) notes.append(node('li', note));
      card.append(notes, node('p', test.cost_note, 'muted'));
      const downloads = node('div', undefined, 'download-links');
      for (const asset of assets) downloads.append(link(asset.label, openFile(asset.file)));
      card.append(downloads, details('Проверка и происхождение',
        `Статус: ${test.status}\nКвитанция: ${test.receipt_id}\nSHA-256 исходного манифеста: ${test.source_manifest_sha256}\nРазмещено для внутреннего просмотра. Выпуск рекламы не утверждён.`));
      byId('test-list').append(card);
    }
    const list = byId('post-list'); list.replaceChildren();
    for (const post of review.posts) {
      const card = node('article', undefined, 'post-card'); card.id = `post-${post.direction_id}`;
      const heading = node('div', undefined, 'post-top'); const title = node('div');
      title.append(node('p', labels[post.direction_id] || post.direction_id, 'eyebrow'), node('h3', post.title));
      const pass = post.content_review === 'PASS';
      heading.append(title, node('span', pass ? 'Проверка текста пройдена · PASS' : 'Требуется доработка · REVISE', `badge ${pass ? 'pass' : 'revise'}`));
      card.append(heading, node('p', post.body, 'copy-text post-main'), details('Короткая версия', post.short_group_variant));
      const url = new URL(post.cta_url, location.origin);
      if (url.protocol === 'https:' && url.hostname === 'travelgtc.com') {
        const cta = link('Проверить ссылку для читателя → TravelGTC', url.href); cta.className = 'cta-link'; card.append(cta);
      }
      if (post.review_notes.length) {
        const notes = node('ul', undefined, 'review-findings'); post.review_notes.forEach((text) => notes.append(node('li', text))); card.append(notes);
      }
      card.append(node('p', `Оценка исполнителя: ${post.content_review}. Не опубликовано. Визуал: ${post.asset_refs}.`, 'post-meta'));
      list.append(card);
    }
    byId('additional-notes').replaceChildren(node('strong', 'Дополнительная проверка GTC1'), ...review.gtc1_notes.map((text) => node('p', text)));
    byId('image-list').replaceChildren();
    for (const asset of review.images) {
      const figure = node('figure'); const anchor = link('', file(asset.file)); const img = node('img');
      img.src = file(asset.file); img.alt = asset.alt; img.width = 1024; img.height = 1024; img.loading = 'lazy'; anchor.append(img);
      const caption = node('figcaption'); caption.append(node('span', 'Доработка и проверка · REVISE / BLOCKED', 'badge revise'), node('h3', `${asset.id} · ${asset.title}`), node('p', asset.note));
      figure.append(anchor, caption); byId('image-list').append(figure);
    }
    const video = byId('pilot-video'); video.src = file('travelgtc-pilot-video.mp4'); video.poster = file('need-a.png');
    const track = node('track'); track.kind = 'subtitles'; track.label = 'Русский · черновик'; track.srclang = 'ru'; track.src = file('travelgtc-pilot.vtt'); video.append(track);
    video.addEventListener('error', () => {
      const message = byId('video-error');
      if (video.error?.code === 4) message.textContent = 'Этот браузер не смог воспроизвести MP4. Откройте исходный файл по ссылке ниже в браузере или видеоплеере с поддержкой H.264.';
      message.hidden = false;
    });
    byId('pilot-audio').src = file('travelgtc-pilot-voice.mp3');
    byId('video-notes').replaceChildren(...review.video_notes.map((text) => node('li', text)));
    byId('reference-text').textContent = review.transcript.reference;
    byId('transcript-text').textContent = review.transcript.text;
    byId('media-downloads').replaceChildren(...[['Открыть MP4', 'travelgtc-pilot-video.mp4'], ['Открыть MP3', 'travelgtc-pilot-voice.mp3'], ['Открыть SRT', 'travelgtc-pilot.srt'], ['Открыть VTT', 'travelgtc-pilot.vtt']].map(([title, name]) => link(title, openFile(name))));
    byId('calendar-rows').replaceChildren();
    for (const line of review.calendar.split('\n')) {
      if (!/^\|\s*\d+\s*\|/.test(line)) continue;
      const row = node('tr'); line.split('|').slice(1, -1).forEach((text) => row.append(node('td', text.trim()))); byId('calendar-rows').append(row);
    }
    byId('handoff-list').replaceChildren(...review.handoff_cards.map((card) => {
      const element = node('article', undefined, 'handoff-card'); element.append(node('h3', labels[card.direction_id] || card.direction_id), node('p', card.last_question), node('p', 'Тестовый интерес → обсуждение потребности с Мирой.', 'muted')); return element;
    }));
    byId('report-links').replaceChildren(link('Читать отчёт', openFile('PILOT-REPORT.md')), link('Читать план', openFile('calendar-14-days.md')), link('Открыть транскрипцию', openFile('travelgtc-pilot-transcript.json')));
    byId('package-origin').textContent = `Проект: ${review.project_id}\nЗадача: ${review.task_id}\nКвитанция: ${review.receipt}\nSHA-256 манифеста: ${review.manifest_sha256}`;
    byId('load-status').hidden = true; byId('review-workspace').hidden = false;
    if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
  }
  async function load() {
    try {
      const response = await fetch(api, { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 401 || response.status === 403) {
        return showError('Материалы доступны владельцу проекта и команде CRM. Войдите под своим рабочим аккаунтом.', true);
      }
      if (!response.ok) throw new Error('Review unavailable');
      const payload = await response.json(); if (!payload.ok || !payload.review) throw new Error('Invalid review');
      render(payload.review);
      const account = byId('account-link'); account.textContent = 'Выйти'; account.href = '#';
      account.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          const result = await fetch('/api/travelgtc/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
          if (!result.ok) throw new Error('Logout failed');
          location.reload();
        } catch { showError('Не удалось завершить сеанс. Обновите страницу и повторите выход.', false); }
      });
    } catch { showError('Не удалось загрузить материалы. Обновите страницу; если ошибка сохраняется, сообщите команде.', false); }
  }
  window.addEventListener('pagehide', clearPrivateContent);
  window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });
  load();
})();
