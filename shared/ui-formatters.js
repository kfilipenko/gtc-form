// Shared formatting helpers for chat message rendering.
// Extracted from operator console to keep user UI in sync.

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function convertNewlines(text) {
  return text.replace(/\r?\n/g, '<br />');
}

export function stripTrackingParams(rawUrl) {
  if (typeof rawUrl !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return null;
  }
  const params = Array.from(parsed.searchParams.keys());
  params.forEach((key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm') || lower === 'ref' || lower === 'ref_src' || lower === 'source') {
      parsed.searchParams.delete(key);
    }
  });
  return parsed.toString();
}

function renderLink(label, rawUrl) {
  const safeUrl = stripTrackingParams(rawUrl);
  if (!safeUrl) return escapeHtml(label);
  const safeLabel = escapeHtml(label || safeUrl);
  const href = escapeHtml(safeUrl);
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
}

export function renderRichText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return '';
  }
  const linkPattern = /\[([^\]]+?)]\((https?:\/\/[^)\s]+)\)/gi;
  let html = '';
  let lastIndex = 0;
  let match;
  while ((match = linkPattern.exec(text)) !== null) {
    const chunk = text.slice(lastIndex, match.index);
    html += convertNewlines(escapeHtml(chunk));
    html += renderLink(match[1], match[2]);
    lastIndex = match.index + match[0].length;
  }
  html += convertNewlines(escapeHtml(text.slice(lastIndex)));
  return html;
}

function extractDomain(urlString) {
  try {
    const hostname = new URL(urlString).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function buildStoreIconUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(parsed.hostname)}`;
  } catch {
    return 'https://www.google.com/s2/favicons?sz=128&domain=gtstor.com';
  }
}

export function extractProductCards(text) {
  if (typeof text !== 'string') return [];
  const cards = [];
  const entryPattern = /(^|\n)\s*(\d+)[\.\)\]]\s+([\s\S]*?)(?=(\n\s*\d+[\.\)\]]\s+)|$)/g;
  const linkPattern = /\[([^\]]+?)]\((https?:\/\/[^)\s]+)\)/i;
  let match;
  while ((match = entryPattern.exec(text)) !== null) {
    const order = Number(match[2]) || cards.length + 1;
    let block = (match[3] || '').trim();
    if (!block) continue;
    const linkMatch = block.match(linkPattern);
    if (!linkMatch) continue;
    const url = stripTrackingParams(linkMatch[2]);
    if (!url) continue;
    block = block.replace(linkMatch[0], '').trim();
    const split = block.split(/\s+[–—-]\s+/u, 2);
    const title = split[0]?.trim();
    if (!title) continue;
    let detail = split[1]?.trim() || '';
    detail = detail.replace(/^[-–—\s]+/, '').trim();
    let store = '';
    const storeMatch = detail.match(/^([^.,]+)(?:[.,]|$)/);
    if (storeMatch) {
      store = storeMatch[1].trim();
      detail = detail.slice(storeMatch[0].length).trim();
    }
    let price = null;
    const priceMatch = detail.match(/\(([^)]+)\)/);
    if (priceMatch) {
      price = priceMatch[1].trim();
      detail = (detail.slice(0, priceMatch.index) + detail.slice(priceMatch.index + priceMatch[0].length)).trim();
    }
    detail = detail.replace(/^[-–—\s,.]+/, '').trim();
    cards.push({
      order,
      title,
      store: store || extractDomain(url) || linkMatch[1],
      description: detail,
      price,
      url
    });
  }
  return cards.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function createProductCardElement(card) {
  const cardEl = document.createElement('div');
  cardEl.className = 'product-card';
  const orderEl = document.createElement('div');
  orderEl.className = 'product-card-order';
  orderEl.textContent = card.order ? `${card.order})` : '•';
  cardEl.appendChild(orderEl);

  const thumbWrapper = document.createElement('div');
  thumbWrapper.className = 'product-card-thumb';
  const thumbImg = document.createElement('img');
  thumbImg.src = buildStoreIconUrl(card.url);
  thumbImg.alt = card.store ? `${card.store} icon` : 'Store icon';
  thumbImg.loading = 'lazy';
  thumbWrapper.appendChild(thumbImg);
  cardEl.appendChild(thumbWrapper);

  const body = document.createElement('div');
  body.className = 'product-card-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'product-card-title';
  titleEl.textContent = card.title;
  body.appendChild(titleEl);

  if (card.store) {
    const storeEl = document.createElement('div');
    storeEl.className = 'product-card-store';
    storeEl.textContent = card.store;
    body.appendChild(storeEl);
  }

  if (card.description) {
    const descEl = document.createElement('div');
    descEl.className = 'product-card-desc';
    descEl.textContent = card.description;
    body.appendChild(descEl);
  }

  if (card.price) {
    const priceEl = document.createElement('div');
    priceEl.className = 'product-card-price';
    priceEl.textContent = card.price;
    body.appendChild(priceEl);
  }

  const actions = document.createElement('div');
  actions.className = 'product-card-actions';
  const link = document.createElement('a');
  link.className = 'product-card-link';
  link.href = card.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Открыть магазин';
  actions.appendChild(link);
  body.appendChild(actions);

  cardEl.appendChild(body);
  return cardEl;
}
