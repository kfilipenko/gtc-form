// Data service helpers for chat lists and groups.
// Attempts to call backend endpoints first and falls back to mock data if unavailable.

import { mockChats, mockGroups } from './data-mock.js';

const CHAT_LIST_ENDPOINT = '/chat_api.php';
const CHAT_MESSAGES_ENDPOINT = '/chat_api.php';
const CHAT_CREATE_ENDPOINT = '/chat_api.php';
const CHAT_JOURNAL_ENDPOINT = '/chat_transactions.log';
const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

const LOCAL_MOCK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const DEFAULT_USE_MOCKS = (() => {
  if (typeof window === 'undefined' || !window?.location?.hostname) return false;
  const host = window.location.hostname.toLowerCase();
  return LOCAL_MOCK_HOSTS.has(host) || host.endsWith('.local');
})();

const LOG_HISTORY_TTL = 30 * 1000;
const logHistoryCache = new Map(); // key: gtc_user_id -> { loadedAt, data }

function shouldUseMocks(options = {}) {
  if (typeof options.allowMock === 'boolean') {
    return options.allowMock;
  }
  if (typeof options.useMockData === 'boolean') {
    return options.useMockData;
  }
  return DEFAULT_USE_MOCKS;
}

function fallbackChats(useMocks, forceMock = false) {
  return (useMocks || forceMock) ? normalizeChats(mockChats()) : [];
}

function fallbackGroups(useMocks, forceMock = false) {
  return (useMocks || forceMock) ? normalizeGroups(mockGroups()) : [];
}

function ensureLogCacheBucket(map, chatId) {
  if (!map.has(chatId)) {
    map.set(chatId, []);
  }
  return map.get(chatId);
}

function ensureLogChatEntry(map, chatId, defaults = {}) {
  if (!map.has(chatId)) {
    map.set(chatId, {
      chat_id: chatId,
      title: defaults.title || 'Untitled chat',
      snippet: '',
      updated_at: defaults.updated_at || Date.now(),
      message_count: 0,
      groups: []
    });
  }
  return map.get(chatId);
}

function shouldForceMockForError(error) {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  if (message.includes('status_405') || message.includes('status_http_405')) return true;
  if (message.includes('only post')) return true;
  if (message.includes('status_404')) return true;
  if (message.includes('status_502') || message.includes('status_503')) return true;
  if (error.name === 'TypeError') return true;
  return false;
}

async function fetchLogHistory(gtcUserId) {
  if (!gtcUserId) return null;
  const cacheKey = String(gtcUserId);
  const cached = logHistoryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.loadedAt < LOG_HISTORY_TTL) {
    return cached.data;
  }
  try {
    const response = await fetch(CHAT_JOURNAL_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('log_status_' + response.status);
    }
    const text = await response.text();
    const data = parseLogHistory(text, cacheKey);
    logHistoryCache.set(cacheKey, { loadedAt: now, data });
    return data;
  } catch (error) {
    console.warn('log history unavailable', error);
    return null;
  }
}

function parseLogHistory(rawText, cacheKey) {
  if (!rawText) {
    return { chats: [], messages: new Map() };
  }
  const chats = new Map();
  const messages = new Map();
  const seen = new Set();
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let entry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const ctx = entry?.context;
    if (!ctx || String(ctx.gtc_user_id || '') !== cacheKey) {
      continue;
    }
    const chatId = ctx.chat_id || ctx.session_id;
    if (!chatId) continue;
    const timestamp = Date.parse(entry.ts || '') || Date.now();
    const role = (ctx.role || '').toLowerCase();
    const preview = ctx.message_preview || ctx.error || '';
    if (!preview) continue;
    const normalizedRole = role === 'assistant' ? 'assistant' : role === 'system' ? 'system' : 'user';
    const messageId = ctx.message_id || ctx.messageId || null;
    const sessionKey = ctx.session_id || ctx.sessionId || '';
    const dedupeKey = messageId
      ? `${chatId}|${messageId}`
      : `${chatId}|${normalizedRole}|${sessionKey}|${preview}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    const chatEntry = ensureLogChatEntry(chats, chatId, { updated_at: timestamp, title: preview.slice(0, 60) });
    if (!chatEntry.title || chatEntry.title === 'Untitled chat') {
      chatEntry.title = normalizedRole === 'user' ? preview.slice(0, 60) || chatEntry.title : chatEntry.title;
    }
    chatEntry.updated_at = Math.max(chatEntry.updated_at || 0, timestamp);
    chatEntry.snippet = preview;
    const bucket = ensureLogCacheBucket(messages, chatId);
    const message = {
      message_id: ctx.message_id || fallbackId('log', bucket.length),
      chat_id: chatId,
      role: normalizedRole,
      content: preview,
      metadata: {
        log_event: entry.event,
        session_id: ctx.session_id || null,
        trace_id: ctx.trace_id || null
      },
      created_at: entry.ts || new Date(timestamp).toISOString()
    };
    bucket.push(message);
    chatEntry.message_count = bucket.length;
  }
  for (const bucket of messages.values()) {
    bucket.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  const chatList = Array.from(chats.values());
  chatList.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  return { chats: chatList, messages };
}

export async function fetchUserChats(gtcUserId, options = {}) {
  const useMocks = shouldUseMocks(options);
  const fallback = (forceMock = false) => fallbackChats(useMocks, forceMock);
  if (!gtcUserId) {
    return { ok: false, data: fallback(), source: useMocks ? 'mock' : 'empty', error: new Error('missing_gtc_user_id') };
  }
  const endpoint = options.endpoint || CHAT_LIST_ENDPOINT;
  try {
    const requestBody = {
      mode: 'list_chats',
      gtc_user_id: gtcUserId
    };
    if (options.limit != null) requestBody.limit = options.limit;
    if (options.cursor) requestBody.cursor = options.cursor;
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: JSON_HEADERS,
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error('status_' + response.status);
    const responsePayload = await response.json().catch(() => null);
    const chats = Array.isArray(responsePayload?.data)
      ? responsePayload.data
      : Array.isArray(responsePayload?.chats)
        ? responsePayload.chats
        : Array.isArray(responsePayload)
          ? responsePayload
          : [];
    return {
      ok: true,
      source: 'api',
      data: normalizeChats(chats),
      meta: responsePayload?.meta || null
    };
  } catch (error) {
    const logHistory = await fetchLogHistory(gtcUserId);
    if (logHistory?.chats?.length) {
      console.warn('chat list API failed; using log history snapshot');
      return {
        ok: true,
        source: 'log',
        data: normalizeChats(logHistory.chats),
        meta: { source: 'log_history' }
      };
    }
    const forceMock = shouldForceMockForError(error);
    const data = fallback(forceMock);
    const fallbackLabel = (useMocks || forceMock) ? 'returning mock data' : 'returning empty list';
    console.warn(`chat list fetch failed; ${fallbackLabel}`, error);
    return { ok: false, source: (useMocks || forceMock) ? 'mock' : 'empty', data, error };
  }
}

export async function fetchUserGroups(gtcUserId, options = {}) {
  const useMocks = shouldUseMocks(options);
  const fallback = (forceMock = false) => fallbackGroups(useMocks, forceMock);
  if (!gtcUserId) {
    return { ok: false, data: fallback(), source: useMocks ? 'mock' : 'empty', error: new Error('missing_gtc_user_id') };
  }
  const endpoint = options.endpoint || CHAT_LIST_ENDPOINT;
  try {
    const requestBody = {
      mode: 'chat_groups',
      gtc_user_id: gtcUserId
    };
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: JSON_HEADERS,
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error('status_' + response.status);
    const payload = await response.json().catch(() => null);
    const groups = Array.isArray(payload?.groups) ? payload.groups : Array.isArray(payload) ? payload : [];
    return {
      ok: true,
      source: 'api',
      data: normalizeGroups(groups)
    };
  } catch (error) {
    const forceMock = shouldForceMockForError(error);
    const data = fallback(forceMock);
    const fallbackLabel = (useMocks || forceMock) ? 'returning mock data' : 'returning empty list';
    console.warn(`group list fetch failed; ${fallbackLabel}`, error);
    return { ok: false, source: (useMocks || forceMock) ? 'mock' : 'empty', data, error };
  }
}

export async function fetchChatMessages(gtcUserId, chatId, options = {}) {
  const fallback = () => [];
  if (!gtcUserId || !chatId) {
    return { ok: false, data: fallback(), source: 'invalid', error: new Error('missing_identifiers') };
  }
  const endpoint = options.endpoint || CHAT_MESSAGES_ENDPOINT;
  try {
    const requestBody = {
      mode: 'messages',
      gtc_user_id: gtcUserId,
      chat_id: chatId
    };
    if (options.limit != null) requestBody.limit = options.limit;
    if (options.before) requestBody.before = options.before;
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: JSON_HEADERS,
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error('status_' + response.status);
    const responsePayload = await response.json().catch(() => null);
    const messages = Array.isArray(responsePayload?.data) ? responsePayload.data : [];
    return {
      ok: true,
      source: 'api',
      data: normalizeMessages(messages),
      chat: responsePayload?.chat || null,
      meta: responsePayload?.meta || null
    };
  } catch (error) {
    const logHistory = await fetchLogHistory(gtcUserId);
    const logMessages = logHistory?.messages?.get(chatId);
    if (logMessages?.length) {
      console.warn('chat messages API failed; using log history snapshot');
      return {
        ok: true,
        source: 'log',
        data: normalizeMessages(logMessages),
        chat: logHistory.chats?.find((chat) => chat.chat_id === chatId) || null,
        meta: { source: 'log_history' }
      };
    }
    console.warn('chat messages fetch failed; returning empty list', error);
    return { ok: false, source: 'api', data: fallback(), error };
  }
}

export async function createUserChat(gtcUserId, options = {}) {
  if (!gtcUserId) {
    return { ok: false, error: new Error('missing_gtc_user_id') };
  }
  const endpoint = options.endpoint || CHAT_CREATE_ENDPOINT;
  const body = {
    mode: 'create_chat',
    gtc_user_id: gtcUserId,
    title: options.title || null
  };
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: JSON_HEADERS,
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('status_' + response.status);
    const payload = await response.json().catch(() => null);
    const normalized = normalizeChats(payload?.chat ? [payload.chat] : []);
    return {
      ok: Boolean(payload?.success),
      chat: normalized[0] || null,
      raw: payload
    };
  } catch (error) {
    console.warn('chat creation failed', error);
    return { ok: false, error };
  }
}

function normalizeChats(entries = []) {
  return entries.map((chat, index) => ({
    chat_id: chat.chat_id || chat.id || fallbackId('chat', index),
    title: chat.title || chat.name || 'Untitled chat',
    snippet: chat.snippet || chat.preview || chat.last_message || 'No messages yet.',
    updated_at: chat.updated_at || chat.updatedAt || chat.last_activity || Date.now(),
    created_at: chat.created_at || chat.createdAt || null,
    message_count: typeof chat.message_count === 'number' ? chat.message_count : 0,
    groups: Array.isArray(chat.groups) ? chat.groups : []
  }));
}

function normalizeGroups(entries = []) {
  return entries.map((group, index) => ({
    id: group.id || group.group_id || fallbackId('group', index),
    name: group.name || group.title || 'Unnamed group'
  }));
}

function normalizeMessages(entries = []) {
  return entries.map((message, index) => ({
    message_id: message.message_id || message.id || fallbackId('msg', index),
    chat_id: message.chat_id || message.chatId || null,
    role: message.role || 'system',
    content: message.content || message.text || '',
    metadata: typeof message.metadata === 'object' && message.metadata !== null ? message.metadata : {},
    created_at: message.created_at || message.createdAt || null
  }));
}

function fallbackId(prefix, index) {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${index}-${Date.now()}`;
}
