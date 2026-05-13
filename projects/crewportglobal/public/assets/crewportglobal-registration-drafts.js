(function () {
  const STORAGE = {
    draftId: 'crewportglobal.registration.draft_id',
    role: 'crewportglobal.registration.role',
    email: 'crewportglobal.registration.email',
    lastResponse: 'crewportglobal.registration.last_response'
  };

  function getApiBase() {
    const fromWindow = typeof window.CREWPORTGLOBAL_API_BASE === 'string'
      ? window.CREWPORTGLOBAL_API_BASE.trim()
      : '';
    if (fromWindow) {
      return fromWindow.replace(/\/$/, '');
    }

    const meta = document.querySelector('meta[name="crewportglobal-api-base"]');
    const fromMeta = meta ? (meta.getAttribute('content') || '').trim() : '';
    if (fromMeta) {
      return fromMeta.replace(/\/$/, '');
    }

    return '/api/v1';
  }

  function mapRole(value) {
    if (value === 'crewing-manager') {
      return 'crewing_manager';
    }
    return value;
  }

  function mapRoleFromApi(value) {
    if (value === 'crewing_manager') {
      return 'crewing-manager';
    }
    return value;
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function getStoredDraft() {
    const draftId = localStorage.getItem(STORAGE.draftId) || '';
    const role = localStorage.getItem(STORAGE.role) || '';
    const email = localStorage.getItem(STORAGE.email) || '';
    const raw = localStorage.getItem(STORAGE.lastResponse) || '';
    const lastResponse = raw ? safeJsonParse(raw) : null;

    return {
      draftId,
      role,
      email,
      lastResponse
    };
  }

  function persistDraft(response) {
    if (!response || typeof response !== 'object') {
      return;
    }

    if (typeof response.draft_id === 'string' && response.draft_id) {
      localStorage.setItem(STORAGE.draftId, response.draft_id);
    }
    if (typeof response.role === 'string' && response.role) {
      localStorage.setItem(STORAGE.role, mapRoleFromApi(response.role));
    }
    if (typeof response.email === 'string' && response.email) {
      localStorage.setItem(STORAGE.email, response.email);
    }
    localStorage.setItem(STORAGE.lastResponse, JSON.stringify(response));
  }

  async function requestJson(path, method, payload) {
    const response = await fetch(`${getApiBase()}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof body.message === 'string' && body.message
        ? body.message
        : `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = body;
      throw error;
    }

    return body;
  }

  async function createDraft(payload) {
    const body = { ...payload };
    if (body.role) {
      body.role = mapRole(body.role);
    }

    const response = await requestJson('/registration/drafts', 'POST', body);
    persistDraft(response);
    return response;
  }

  async function patchDraft(draftId, payload) {
    const response = await requestJson(`/registration/drafts/${draftId}`, 'PATCH', payload);
    persistDraft(response);
    return response;
  }

  async function createOrUpdateDraft(payload, options) {
    const opts = options || {};
    const explicitDraftId = typeof opts.draftId === 'string' ? opts.draftId.trim() : '';
    const stored = getStoredDraft();
    const resolvedDraftId = explicitDraftId || stored.draftId;

    if (resolvedDraftId) {
      try {
        return await patchDraft(resolvedDraftId, payload);
      } catch (error) {
        if (error && (error.status === 404 || error.status === 400)) {
          return createDraft(payload);
        }
        throw error;
      }
    }

    return createDraft(payload);
  }

  window.CPGDrafts = {
    getApiBase,
    getStoredDraft,
    createDraft,
    patchDraft,
    createOrUpdateDraft
  };
})();
