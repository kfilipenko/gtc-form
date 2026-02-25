// Transport helpers shared between operator console and user chat UI.
// Phase 6 extracts build payload + SQL log queue logic for reuse.

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };
const SQL_LOG_MAX_RETRIES = 5;
const DEFAULT_STAGE = 'AWARENESS';

export function buildChatPayload({ message, sessionId, chatId = null, stage = null, user = null, metadata = {} }) {
  if (!message || typeof message !== 'string') {
    throw new Error('buildChatPayload requires a message string');
  }
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language || 'en';
  const { gtcUserId, userId, fullName } = resolveClientIdentifiers(user);
  const resolvedStage = resolveStageValue(stage, user);
  return {
    channel: 'web',
    message,
    session_id: sessionId,
    client: {
      gtc_user_id: gtcUserId,
      user_id: userId,
      email: user?.email ?? null,
      locale,
      timezone,
      metadata: {
        full_name: fullName
      }
    },
    metadata: {
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      language: locale,
      ...metadata
    },
    chat_id: chatId,
    stage: resolvedStage
  };
}

export function captureRequestHeaders() {
  const headers = {
    origin: window.location.origin,
    referer: document.referrer || null,
    'accept-language': navigator.language || null,
    'user-agent': navigator.userAgent
  };
  if (navigator.userAgentData?.platform) {
    headers['sec-ch-ua-platform'] = navigator.userAgentData.platform;
  }
  if (navigator.userAgentData?.brands) {
    headers['sec-ch-ua'] = navigator.userAgentData.brands
      .map((brand) => `"${brand.brand}";v="${brand.version}"`)
      .join(', ');
  }
  if (typeof navigator.hardwareConcurrency === 'number') {
    headers['x-device-cores'] = String(navigator.hardwareConcurrency);
  }
  return Object.fromEntries(Object.entries(headers).filter(([, value]) => Boolean(value)));
}

export function createSqlLogger({ endpoint = '/chat_api.php', source = 'web_chat_frontend', chatResolver } = {}) {
  const queue = [];
  let processing = false;

  async function drainQueue() {
    if (processing) return;
    processing = true;
    while (queue.length) {
      const job = queue.shift();
      if (!job?.body) {
        continue;
      }
      const resolvedChatId = resolveChatId(job.body.chat_id || job.fallbackChatId, chatResolver);
      if (resolvedChatId) {
        job.body.chat_id = resolvedChatId;
      }
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(job.body)
        });
      } catch (error) {
        if (job.attempts >= SQL_LOG_MAX_RETRIES) {
          console.error('[sql-log] dropping job after network failure', error);
          continue;
        }
        job.attempts += 1;
        queue.unshift(job);
        await delay(1500);
        continue;
      }
      if (!response.ok) {
        if (job.attempts >= SQL_LOG_MAX_RETRIES) {
          console.error('[sql-log] dropping job after HTTP ' + response.status);
          continue;
        }
        job.attempts += 1;
        queue.unshift(job);
        await delay(1500);
        continue;
      }
      if (job.onSuccess) {
        try {
          const payload = await response.json().catch(() => null);
          job.onSuccess(payload);
        } catch {
          // ignore json parse issues for success callbacks
        }
      }
    }
    processing = false;
  }

  function queueLog(payload = {}, options = {}) {
    if (!payload || typeof payload !== 'object') return;
    queue.push({
      attempts: 0,
      fallbackChatId: options.fallbackChatId ?? resolveChatId(null, chatResolver),
      onSuccess: options.onSuccess,
      body: {
        mode: 'log',
        source,
        ...payload,
        chat_id: resolveChatId(payload.chat_id, chatResolver)
      }
    });
    if (!processing) {
      void drainQueue();
    }
  }

  return {
    queue: queueLog,
    flush: async () => {
      await drainQueue();
    }
  };
}

function resolveClientIdentifiers(user = null) {
  const merged = { ...(resolveStoredUser() || {}), ...(user || {}) };
  let storedGtcId = null;
  try {
    storedGtcId = localStorage.getItem('gtc_user_id') || null;
  } catch {}
  const gtcUserIdRaw = merged.gtc_user_id ?? storedGtcId;
  const gtcUserId = coerceNumericLike(gtcUserIdRaw);
  const resolvedUserId = merged.id
    ?? merged.user_id
    ?? (gtcUserId != null ? gtcUserId : null);
  const fullName = merged.full_name || merged.name || null;
  return { gtcUserId, userId: resolvedUserId, fullName };
}

function resolveStageValue(stage, user = null) {
  if (typeof stage === 'string' && stage.trim()) {
    return stage.trim();
  }
  if (user?.stage && typeof user.stage === 'string') {
    return user.stage.trim();
  }
  try {
    const stored = localStorage.getItem('chat:user:stage');
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {}
  return DEFAULT_STAGE;
}

function resolveStoredUser() {
  try {
    const raw = localStorage.getItem('chat:user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function coerceNumericLike(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : value.trim();
  }
  return null;
}

function resolveChatId(preferred, resolver) {
  if (typeof preferred === 'string' && preferred.trim()) {
    return preferred.trim();
  }
  if (typeof resolver === 'function') {
    try {
      const candidate = resolver();
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    } catch {
      return null;
    }
  }
  return null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
