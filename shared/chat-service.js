
import { buildChatPayload, captureRequestHeaders, createSqlLogger } from './transport.js';

const CHAT_API_ENDPOINT = '/chat_api.php';
const CHAT_JOURNAL_ENDPOINT = '/chat_transactions.log';
const N8N_WEBHOOK_URL = 'https://agent.gtstor.com/webhook/chat';
const N8N_WEBHOOK_FALLBACK_URL = 'https://agent.gtstor.com/webhook/web-chat';
const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };
const MAX_GROUPS_PER_CHAT = 12;
const LOG_HISTORY_TTL = 30 * 1000;
const SUBSCRIPTION_ACTIVE_STATUSES = new Set(['active', 'trialing', 'trial', 'grace', 'paid', 'renewing']);
const logHistoryCache = new Map();

const sharedSqlLogger = createSqlLogger({
  endpoint: CHAT_API_ENDPOINT,
  source: 'web_chat_shared'
});
const LEGACY_GROUP_ERROR = 'message, session_id, and client are required.';

function shouldDebugGroups() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem('debug:chat-groups') === '1';
  } catch {
    return false;
  }
}

const GROUP_DEBUG_ENABLED = shouldDebugGroups();

function logGroupDebug(...args) {
  if (GROUP_DEBUG_ENABLED) {
    console.debug('[chatService:groups]', ...args);
  }
}

function coerceBooleanLike(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (['1', 'true', 'yes', 'enabled', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'disabled', 'off', 'none'].includes(normalized)) return false;
    if (SUBSCRIPTION_ACTIVE_STATUSES.has(normalized)) return true;
  }
  return false;
}

function deriveSubscriptionActive(snapshot = {}) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const direct = snapshot.subscription_active ?? snapshot.subscription?.active ?? snapshot.subscription?.is_active;
  if (typeof direct !== 'undefined') {
    return coerceBooleanLike(direct);
  }
  const status = (snapshot.subscription_status || snapshot.subscription?.status || '').toString().trim().toLowerCase();
  if (status) {
    return SUBSCRIPTION_ACTIVE_STATUSES.has(status);
  }
  const expiry = snapshot.subscription_end || snapshot.subscription?.active_until || snapshot.subscription?.expires_at;
  if (expiry) {
    const ts = Date.parse(expiry);
    if (!Number.isNaN(ts)) {
      return ts > Date.now();
    }
    return false;
  }
  return null;
}

/**
 * @typedef {Object} ChatSummary
 * @property {string} chat_id
 * @property {number|null} gtc_user_id
 * @property {string} title
 * @property {string} snippet
 * @property {string|null} last_role
 * @property {string} last_message_at
 * @property {string} created_at
 * @property {string} updated_at
 * @property {number} message_count
 * @property {string[]} groups
 */

/**
 * @param {number} gtcUserId
 * @param {{ limit?: number; cursor?: string; groupId?: string }} [options]
 * @returns {Promise<ChatSummary[]>}
 */
async function listChats(gtcUserId, options = {}) {
  if (!gtcUserId) {
    throw new Error('chatService.listChats requires gtcUserId');
  }
  const body = {
    mode: 'list_chats',
    gtc_user_id: gtcUserId,
    limit: options.limit,
    cursor: options.cursor,
    group: options.groupId
  };
  const response = await callChatApi(body);
  const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  if (rows.length) {
    return rows.map(normalizeChatSummary);
  }
  const logSnapshot = await fetchLogHistory(gtcUserId);
  if (logSnapshot?.chats?.length) {
    return logSnapshot.chats.map(normalizeChatSummary);
  }
  return [];
}

/**
 * @param {string} chatId
 * @param {number} gtcUserId
 * @param {{ limit?: number; before?: string }} [options]
 * @returns {Promise<{ messages: ChatMessage[]; meta: ChatHistoryMeta }>}
 */
async function getChatHistory(chatId, gtcUserId, options = {}) {
  if (!gtcUserId || !chatId) {
    throw new Error('chatService.getChatHistory requires chatId and gtcUserId');
  }
  const body = {
    mode: 'messages',
    chat_id: chatId,
    gtc_user_id: gtcUserId,
    limit: options.limit,
    before: options.before
  };
  try {
    const response = await callChatApi(body);
    const apiMessages = Array.isArray(response?.data) ? response.data : [];
    if (apiMessages.length) {
      return {
        messages: apiMessages.map(normalizeChatMessage),
        meta: {
          limit: response?.meta?.limit ?? options.limit ?? 200,
          next_cursor: response?.meta?.next_cursor ?? null,
          source: 'api'
        }
      };
    }
    const logSnapshot = await fetchLogHistory(gtcUserId);
    const fallbackMessages = logSnapshot?.messages?.get(chatId) || [];
    if (fallbackMessages.length) {
      return {
        messages: fallbackMessages.map(normalizeChatMessage),
        meta: {
          limit: options.limit ?? 200,
          next_cursor: null,
          source: 'log'
        }
      };
    }
    return {
      messages: [],
      meta: {
        limit: options.limit ?? 200,
        next_cursor: null,
        source: 'api'
      }
    };
  } catch (error) {
    const logSnapshot = await fetchLogHistory(gtcUserId);
    const fallbackMessages = logSnapshot?.messages?.get(chatId) || [];
    return {
      messages: fallbackMessages.map(normalizeChatMessage),
      meta: {
        limit: options.limit ?? 200,
        next_cursor: null,
        source: 'log'
      }
    };
  }
}

/**
 * Create a chat row for the user by logging a synthetic system message.
 * Uses `mode: 'log'` so the backend reuses the same ensure_chat_id() path as sendMessage.
 *
 * @param {number|string} gtcUserId
 * @param {{ title?: string }} [options]
 * @returns {Promise<ChatSummary>}
 */
async function createChatInternal(gtcUserId, options = {}) {
  const numericId = Number(gtcUserId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error('chatService.createChat requires a valid gtcUserId');
  }
  const title = (options.title || '').trim() || 'New chat';
  const issuedAt = new Date();
  const sessionId = `create:${numericId}:${issuedAt.getTime()}`;
  const payload = {
    mode: 'log',
    role: 'system',
    message: title,
    session_id: sessionId,
    channel: 'web',
    client: {
      gtc_user_id: numericId,
      user_agent: typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent
        : 'gtc-user-portal'
    },
    metadata: {
      source: 'user_portal',
      purpose: 'chat_create',
      title
    }
  };
  const resp = await callChatApi(payload);
  if (!resp || resp.success !== true || !resp.chat_id) {
    const reason = typeof resp?.message === 'string' ? resp.message : resp?.error || 'chat_create_failed';
    const error = new Error(`createChat failed: ${reason}`);
    error.response = resp;
    throw error;
  }
  const createdAt = resp.created_at || issuedAt.toISOString();
  return normalizeChatSummary({
    chat_id: resp.chat_id,
    gtc_user_id: numericId,
    title,
    snippet: resp.snippet || '',
    last_role: 'system',
    last_message_at: resp.last_message_at || createdAt,
    created_at: createdAt,
    updated_at: resp.updated_at || createdAt,
    message_count: resp.message_count || 1,
    groups: Array.isArray(resp.groups) ? resp.groups : []
  });
}

export async function createChat(gtcUserId, options = {}) {
  return createChatInternal(gtcUserId, options);
}

async function fetchSubscriptionSnapshot(gtcUserId) {
  if (!gtcUserId) {
    throw new Error('chatService.fetchSubscriptionSnapshot requires gtcUserId');
  }
  const body = {
    mode: 'subscription_status',
    gtc_user_id: gtcUserId
  };
  const response = await callChatApi(body);
  const subscriptionActive = deriveSubscriptionActive(response);
  return {
    subscriptionActive,
    subscriptionStatus: response?.subscription_status || null,
    subscriptionEnd: response?.subscription_end || null,
    checkedAt: response?.checked_at || null,
    snapshot: response?.subscription || null
  };
}

async function listChatGroups(gtcUserId) {
  if (!gtcUserId) {
    throw new Error('chatService.listChatGroups requires gtcUserId');
  }
  const payload = {
    // use legacy alias for wider backend compatibility
    mode: 'chat_groups',
    gtc_user_id: gtcUserId
  };
  logGroupDebug('listChatGroups request', payload);
  try {
    const response = await callChatApi(payload);
    logGroupDebug('listChatGroups response', response);
    const groups = Array.isArray(response?.groups)
      ? response.groups
      : Array.isArray(response)
        ? response
        : [];
    return groups.map(normalizeGroupSummary);
  } catch (error) {
    logGroupDebug('listChatGroups error', error);
    throw annotateGroupError(error, 'list');
  }
}

async function setChatGroups(gtcUserId, chatId, groups = []) {
  if (!gtcUserId || !chatId) {
    throw new Error('chatService.setChatGroups requires gtcUserId and chatId');
  }
  const normalizedGroups = normalizeGroupRequestPayload(groups);
  const payload = {
    mode: 'set_chat_groups',
    gtc_user_id: gtcUserId,
    chat_id: chatId,
    groups: normalizedGroups
  };
  logGroupDebug('setChatGroups request', payload);
  try {
    const response = await callChatApi(payload);
    logGroupDebug('setChatGroups response', response);
    const assigned = Array.isArray(response?.groups) ? response.groups : [];
    const detailed = Array.isArray(response?.group_details)
      ? response.group_details
      : (Array.isArray(assigned) && typeof assigned[0] === 'object' ? assigned : []);
    const normalizedDetails = detailed.length
      ? detailed.map(normalizeGroupSummary)
      : assigned
          .filter((id) => typeof id === 'string' && id.trim())
          .map((id) => normalizeGroupSummary({ group_id: id, name: id }));
    return {
      chatId,
      gtcUserId,
      groups: normalizedDetails,
      groupIds: normalizedDetails.map((g) => g.id).filter(Boolean),
      raw: response
    };
  } catch (error) {
    logGroupDebug('setChatGroups error', error);
    throw annotateGroupError(error, 'set');
  }
}

/**
 * @param {SendMessageParams} params
 * @returns {Promise<SendMessageResult>}
 */
async function sendMessage(params = {}) {
  const {
    chatId = null,
    gtcUserId,
    userId = null,
    content,
    stage = null,
    sessionId,
    source,
    metadata = {},
    headers = captureRequestHeaders()
  } = params;
  if (!gtcUserId || !content || !sessionId || !source) {
    throw new Error('chatService.sendMessage requires gtcUserId, content, sessionId, and source');
  }
  // TODO: Align stage defaults between /chat (blank until AI responds) and /user (defaults to AWARENESS inside buildChatPayload).
  const payload = buildChatPayload({
    message: content,
    sessionId,
    chatId,
    stage,
    user: {
      gtc_user_id: gtcUserId,
      id: userId,
      stage,
      ...metadata?.user
    },
    metadata
  });
  let resolvedChatId = payload.chat_id || chatId || null;
  sharedSqlLogger.queue({
    ...payload,
    source,
    headers,
    role: 'user'
  }, {
    fallbackChatId: resolvedChatId,
    onSuccess: (result) => {
      if (result?.chat_id) {
        resolvedChatId = result.chat_id;
      }
    }
  });
  const webhookPayload = { ...payload, source, headers };
  const webhookResponse = await callWebhook(webhookPayload);
  console.log('[chatService] webhook call completed', {
    url: N8N_WEBHOOK_URL,
    status: webhookResponse?.httpStatus ?? 'unknown',
    chatId: webhookResponse?.chatId || null,
    traceId: webhookResponse?.traceId || null
  });
  console.log('[chatService] webhook raw response', webhookResponse?.raw);
  console.log('[chatService] normalized assistant message', webhookResponse?.assistant);
  if (webhookResponse.chatId) {
    resolvedChatId = webhookResponse.chatId;
  }
  const userMessage = normalizeChatMessage({
    message_id: fallbackId('user'),
    chat_id: resolvedChatId,
    gtc_user_id: gtcUserId,
    role: 'user',
    content,
    stage: payload.stage,
    trace_id: null,
    metadata: {
      ...payload.metadata,
      client: payload.client,
      headers,
      source
    },
    created_at: new Date().toISOString()
  });
  if (webhookResponse.assistant) {
    sharedSqlLogger.queue({
      ...payload,
      chat_id: webhookResponse.chatId || resolvedChatId,
      message: webhookResponse.assistant.content,
      role: 'assistant',
      stage: webhookResponse.stage,
      trace_id: webhookResponse.traceId,
      source,
      response: webhookResponse.raw
    }, { fallbackChatId: webhookResponse.chatId || resolvedChatId });
  }
  return {
    chatId: resolvedChatId,
    traceId: webhookResponse.traceId,
    stage: webhookResponse.stage || payload.stage,
    message: userMessage,
    assistant: webhookResponse.assistant,
    rawResponse: webhookResponse.raw
  };
}

function attachLogger(options = {}) {
  return createSqlLogger({
    endpoint: options.endpoint || CHAT_API_ENDPOINT,
    source: options.source || 'web_chat_shared',
    chatResolver: options.chatResolver
  });
}

async function callChatApi(body) {
  const response = await fetch(CHAT_API_ENDPOINT, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    const description = parsed?.message || parsed?.error || parsed?.raw || text || 'unknown error';
    const err = new Error('chatService API request failed with HTTP ' + response.status + ': ' + description);
    err.status = response.status;
    err.payload = parsed;
    throw err;
  }
  return parsed;
}

async function callWebhook(body) {
  const candidates = [N8N_WEBHOOK_URL, N8N_WEBHOOK_FALLBACK_URL];
  const failures = [];

  for (const webhookUrl of candidates) {
    let response;
    let rawText = '';
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(body)
      });
      rawText = await response.text();
    } catch (error) {
      failures.push(`${webhookUrl}: network_error`);
      continue;
    }

    if (!response.ok) {
      const preview = (rawText || '').trim().slice(0, 160);
      failures.push(`${webhookUrl}: http_${response.status}${preview ? ` ${preview}` : ''}`);
      continue;
    }

    if (!rawText || !rawText.trim()) {
      failures.push(`${webhookUrl}: empty_response`);
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      failures.push(`${webhookUrl}: invalid_json ${rawText.trim().slice(0, 160)}`);
      continue;
    }

    if (!payload || typeof payload !== 'object') {
      failures.push(`${webhookUrl}: non_object_payload`);
      continue;
    }

    const normalized = normalizeAssistantWebhook(payload, body.source, body.client?.gtc_user_id || null);
    normalized.httpStatus = response.status;
    normalized.webhookUrl = webhookUrl;

    if (!normalized.assistant || !normalized.assistant.content) {
      failures.push(`${webhookUrl}: missing_assistant_reply`);
      continue;
    }

    return normalized;
  }

  try {
    return await callWebhookViaProxy(body, failures);
  } catch (proxyError) {
    const proxyMessage = proxyError?.message || 'proxy_fallback_failed';
    throw new Error('chatService.sendMessage webhook failed: ' + failures.join(' | ') + ' | proxy: ' + proxyMessage);
  }
}

async function callWebhookViaProxy(body, failures = []) {
  const proxyPayload = {
    mode: 'proxy',
    message: body?.message || '',
    session_id: body?.session_id || '',
    channel: body?.channel || 'web',
    chat_id: body?.chat_id || null,
    stage: body?.stage || null,
    source: body?.source || 'web_chat_shared',
    metadata: body?.metadata || {},
    headers: body?.headers || {},
    client: body?.client || {}
  };

  const proxyResponse = await callChatApi(proxyPayload);
  if (!proxyResponse || proxyResponse.success !== true) {
    throw new Error('proxy returned non-success payload');
  }

  const fallbackRaw = {
    reply: proxyResponse.reply || '',
    trace_id: proxyResponse.trace_id || null,
    stage: proxyResponse.stage || null,
    chat_id: proxyResponse.chat_id || body?.chat_id || null,
    proxied: true,
    failures
  };

  const normalized = normalizeAssistantWebhook(fallbackRaw, body?.source, body?.client?.gtc_user_id || null);
  normalized.httpStatus = 200;
  normalized.webhookUrl = CHAT_API_ENDPOINT + '::proxy';

  if (!normalized.assistant || !normalized.assistant.content) {
    throw new Error('proxy returned empty assistant reply');
  }

  return normalized;
}

function normalizeAssistantWebhook(payload, source, gtcUserId) {
  const chatId = payload?.chat_id || payload?.chatId || null;
  const artifacts = extractAssistantArtifacts(payload);
  const traceId = artifacts.traceId || payload?.trace_id || payload?.traceId || null;
  const stage = artifacts.stage || payload?.stage || null;
  const reply = artifacts.reply;
  const assistantMessage = reply ? normalizeChatMessage({
    message_id: payload.message_id || fallbackId('assistant'),
    chat_id: chatId,
    gtc_user_id: gtcUserId,
    role: 'assistant',
    content: reply,
    stage,
    trace_id: traceId,
    metadata: {
      response: payload,
      source
    },
    created_at: new Date().toISOString()
  }) : null;
  return {
    chatId,
    traceId,
    stage,
    assistant: assistantMessage,
    raw: payload
  };
}

function normalizeGroupSummary(entry = {}) {
  const id = entry.group_id || entry.id || null;
  const name = typeof entry.name === 'string' && entry.name.trim()
    ? entry.name.trim()
    : (typeof entry.title === 'string' ? entry.title.trim() : null) || 'Unnamed group';
  return {
    id: id || entry.slug || name,
    group_id: id || entry.slug || name,
    name,
    color: entry.color || null,
    created_at: entry.created_at || null,
    updated_at: entry.updated_at || null
  };
}

function normalizeGroupRequestPayload(groups = []) {
  if (!Array.isArray(groups)) {
    return [];
  }
  const normalized = [];
  for (const entry of groups) {
    if (typeof entry === 'string') {
      const name = entry.trim();
      if (name) {
        normalized.push({ name });
      }
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const id = entry.group_id || entry.id || null;
    const name = typeof entry.name === 'string' ? entry.name.trim() : null;
    if (!id && !name) {
      continue;
    }
    const payload = {};
    if (id) payload.group_id = id;
    if (name) payload.name = name;
    if (entry.color) payload.color = entry.color;
    normalized.push(payload);
    if (normalized.length >= MAX_GROUPS_PER_CHAT) {
      break;
    }
  }
  return normalized;
}

function annotateGroupError(error, context) {
  if (!error) return error;
  const message = typeof error.message === 'string' ? error.message : '';
  const normalized = message.toLowerCase();
  if (normalized.includes(LEGACY_GROUP_ERROR.toLowerCase()) || normalized.includes('message, session_id')) {
    if (!error.code) {
      error.code = 'chat_groups_disabled';
    }
    if (!error.context) {
      error.context = context || 'group_api';
    }
    const friendly = 'Chat group sync is not yet enabled on this environment. Deploy the latest backend to continue.';
    if (!error.friendlyMessage) {
      error.friendlyMessage = friendly;
    }
    if (!error.originalMessage) {
      error.originalMessage = message;
    }
    error.message = friendly;
    return error;
  }
  return error;
}

function normalizeChatSummary(entry = {}) {
  const detailSource = Array.isArray(entry.group_details) && entry.group_details.length
    ? entry.group_details
    : (Array.isArray(entry.groups) && entry.groups.length && typeof entry.groups[0] === 'object'
        ? entry.groups
        : []);
  const groupDetails = detailSource.map(normalizeGroupSummary);
  let groupIds;
  if (Array.isArray(entry.groups) && entry.groups.length && typeof entry.groups[0] !== 'object') {
    groupIds = entry.groups
      .map((groupId) => (typeof groupId === 'string' ? groupId.trim() : String(groupId || '')))
      .filter((value) => Boolean(value));
  } else {
    groupIds = groupDetails.map((group) => group.id).filter(Boolean);
  }
  return {
    chat_id: entry.chat_id || entry.id || fallbackId('chat'),
    gtc_user_id: entry.gtc_user_id || null,
    title: entry.title || entry.name || 'Untitled chat',
    snippet: entry.snippet || entry.last_message || 'No messages yet.',
    last_role: entry.last_role || null,
    last_message_at: toIsoString(entry.last_message_at || entry.updated_at || entry.created_at),
    created_at: toIsoString(entry.created_at),
    updated_at: toIsoString(entry.updated_at || entry.last_message_at),
    message_count: typeof entry.message_count === 'number' ? entry.message_count : 0,
    groups: groupIds,
    group_details: groupDetails
  };
}

function normalizeChatMessage(entry = {}) {
  const metadata = (typeof entry.metadata === 'object' && entry.metadata) ? entry.metadata : {};
  const stage = entry.stage || metadata.stage || null;
  const traceId = entry.trace_id || metadata.trace_id || metadata.traceId || null;
  return {
    message_id: entry.message_id || fallbackId('msg'),
    chat_id: entry.chat_id || null,
    gtc_user_id: entry.gtc_user_id || metadata?.client?.gtc_user_id || null,
    role: entry.role === 'assistant' ? 'assistant' : entry.role === 'system' ? 'system' : 'user',
    content: entry.content || '',
    stage,
    trace_id: traceId,
    metadata,
    created_at: toIsoString(entry.created_at)
  };
}

function extractAssistantArtifacts(payload) {
  const base = { reply: '', stage: null, traceId: null };
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const candidate = extractAssistantArtifacts(entry);
      if (candidate.reply) return candidate;
      if (!base.stage && candidate.stage) base.stage = candidate.stage;
      if (!base.traceId && candidate.traceId) base.traceId = candidate.traceId;
    }
    return base;
  }
  if (!payload || typeof payload !== 'object') {
    return base;
  }
  const stage = payload.stage || payload.output?.stage || payload.meta?.stage || null;
  const traceId = payload.trace_id || payload.traceId || payload.output?.trace_id || payload.output?.traceId || payload.meta?.trace_id || null;
  const direct = typeof payload.reply === 'string' ? payload.reply.trim() : '';
  if (direct) {
    return { reply: direct, stage, traceId };
  }
  if (payload.output && typeof payload.output === 'object') {
    const output = payload.output;
    const replyFields = [output.assistant_reply, output.final_reply, output.reply, output.text];
    for (const field of replyFields) {
      if (typeof field === 'string' && field.trim()) {
        return {
          reply: field.trim(),
          stage: output.stage || stage,
          traceId: output.trace_id || output.traceId || traceId
        };
      }
    }
  }
  if (Array.isArray(payload.data)) {
    for (const entry of payload.data) {
      const candidate = extractAssistantArtifacts(entry);
      if (candidate.reply) {
        return {
          reply: candidate.reply,
          stage: candidate.stage || stage,
          traceId: candidate.traceId || traceId
        };
      }
    }
  }
  if (payload.json && typeof payload.json === 'object') {
    const candidate = extractAssistantArtifacts(payload.json);
    if (candidate.reply) {
      return {
        reply: candidate.reply,
        stage: candidate.stage || stage,
        traceId: candidate.traceId || traceId
      };
    }
  }
  return { reply: '', stage, traceId };
}

function fallbackId(prefix) {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toIsoString(value) {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function ensureLogCacheBucket(map, chatId) {
  if (!map.has(chatId)) {
    map.set(chatId, []);
  }
  return map.get(chatId);
}

async function fetchLogHistory(gtcUserId) {
  const cacheKey = String(gtcUserId);
  const cached = logHistoryCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.loadedAt < LOG_HISTORY_TTL) {
    return cached.data;
  }
  try {
    const response = await fetch(CHAT_JOURNAL_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    const raw = await response.text();
    const parsed = parseLogHistory(raw, cacheKey);
    logHistoryCache.set(cacheKey, { loadedAt: now, data: parsed });
    return parsed;
  } catch {
    return null;
  }
}

function parseLogHistory(rawText, cacheKey) {
  if (!rawText) return { chats: [], messages: new Map() };
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
    if (!ctx || String(ctx.gtc_user_id ?? '') !== cacheKey) continue;
    const chatId = ctx.chat_id || ctx.session_id;
    if (!chatId) continue;
    const preview = ctx.message_preview || ctx.error || '';
    if (!preview) continue;
    const normalizedRole = normalizeLogRole(ctx.role);
    const dedupeKey = `${chatId}|${normalizedRole}|${preview}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const timestamp = toIsoString(entry.ts || entry.timestamp || ctx.created_at || Date.now());
    const summary = ensureLogChatEntry(chats, chatId, {
      gtc_user_id: ctx.gtc_user_id || null,
      title: preview.slice(0, 60),
      updated_at: timestamp,
      snippet: preview
    });
    const bucket = ensureLogCacheBucket(messages, chatId);
    const metadata = { log_event: entry.event };
    if (ctx.stage) metadata.stage = ctx.stage;
    if (ctx.error) metadata.error = ctx.error;
    const logMessage = {
      message_id: ctx.message_id || fallbackId('log'),
      chat_id: chatId,
      gtc_user_id: ctx.gtc_user_id || null,
      role: normalizedRole,
      content: preview,
      stage: ctx.stage || null,
      trace_id: ctx.trace_id || ctx.traceId || null,
      metadata,
      created_at: timestamp
    };
    bucket.push(logMessage);
    updateLogSummaryFromMessage(summary, logMessage, bucket.length);
  }
  return {
    chats: Array.from(chats.values()),
    messages
  };
}

function ensureLogChatEntry(map, chatId, defaults = {}) {
  if (!map.has(chatId)) {
    const now = defaults.updated_at || new Date().toISOString();
    map.set(chatId, {
      chat_id: chatId,
      gtc_user_id: defaults.gtc_user_id ?? null,
      title: defaults.title || 'Untitled chat',
      snippet: defaults.snippet || 'No messages yet.',
      last_role: null,
      last_message_at: now,
      created_at: now,
      updated_at: now,
      message_count: 0,
      groups: []
    });
  }
  const summary = map.get(chatId);
  if (defaults.gtc_user_id && !summary.gtc_user_id) {
    summary.gtc_user_id = defaults.gtc_user_id;
  }
  if (defaults.snippet && summary.snippet === 'No messages yet.') {
    summary.snippet = defaults.snippet;
  }
  if (defaults.updated_at && summary.updated_at < defaults.updated_at) {
    summary.updated_at = defaults.updated_at;
  }
  return summary;
}

function normalizeLogRole(role) {
  if (typeof role !== 'string') {
    return 'user';
  }
  const value = role.toLowerCase();
  if (value === 'assistant' || value === 'system') {
    return value;
  }
  return 'user';
}

function updateLogSummaryFromMessage(summary, message, count) {
  summary.message_count = count;
  summary.snippet = message.content;
  summary.last_role = message.role;
  summary.last_message_at = message.created_at;
  summary.updated_at = message.created_at;
  if (!summary.created_at) {
    summary.created_at = message.created_at;
  }
  if (!summary.gtc_user_id && message.gtc_user_id) {
    summary.gtc_user_id = message.gtc_user_id;
  }
}

export { listChats, getChatHistory, sendMessage, fetchSubscriptionSnapshot, listChatGroups, setChatGroups };

export const chatService = {
  listChats,
  getChatHistory,
  createChat,
  sendMessage,
  fetchSubscriptionSnapshot,
  listChatGroups,
  setChatGroups,
  attachLogger,
  logger: sharedSqlLogger
};

export default chatService;
