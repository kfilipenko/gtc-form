const AUTH_DRAFT_KEY = "travelgtc.leadDraft.v1";
const IDENTITY_CONSENT_VERSION = "travelgtc-identity-consent-v1";

const authState = {
  loaded: false,
  authenticated: false,
  user: null,
};

let authStatePromise = null;

const menuButton = document.querySelector("[data-menu-toggle]");

if (menuButton) {
  menuButton.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    const isOpen = document.body.classList.contains("menu-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
});

initAuthState();
initAuthForms();
initLeadForms();
initPrototypeForms();
initFormatButtons();
initRoleButtons();

function initAuthState() {
  decorateAuthLinks();
  authStatePromise = refreshAuthState();

  document.querySelectorAll("[data-auth-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await requestApi("/api/travelgtc/v1/auth/logout", { method: "POST" });
        setAuthState({ authenticated: false, user: null });
        if (window.location.pathname.startsWith("/auth/")) {
          return;
        }
        window.location.reload();
      } catch (error) {
        button.disabled = false;
      }
    });
  });
}

function initAuthForms() {
  document.querySelectorAll("form[data-auth-register-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitRegisterForm(form);
    });
  });

  document.querySelectorAll("form[data-auth-login-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitLoginForm(form);
    });
  });
}

function initLeadForms() {
  document.querySelectorAll("form[data-travelgtc-lead-form]").forEach((form) => {
    insertLeadAuthNote(form);
    restoreLeadDraft(form);

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.addEventListener("click", async (event) => {
        if (submitButton.dataset.successAction === "home") {
          event.preventDefault();
          window.location.href = "/";
          return;
        }
        if (authState.loaded && authState.authenticated) {
          return;
        }
        event.preventDefault();
        const isAuthenticated = await ensureAuthenticatedForLeadForm(form);
        if (isAuthenticated) {
          form.requestSubmit();
        }
      });
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitLeadForm(form);
    });
  });
}

function initPrototypeForms() {
  document.querySelectorAll("form[data-prototype-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      const message = form.getAttribute("data-success-message") || "Спасибо. Сообщение получено.";
      if (status) {
        status.textContent = message;
      }
      form.reset();
    });
  });
}

function initFormatButtons() {
  document.querySelectorAll("[data-fill-format]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector('[name="travel_format"], #trip-format');
      if (target) {
        const value = mapTravelFormat(button.textContent.trim());
        target.value = value || target.value;
        target.focus();
      }
    });
  });
}

function initRoleButtons() {
  document.querySelectorAll("[data-role-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const form = button.closest("form");
      const scope = form || button.closest(".funnel-split") || document;
      const input = scope.querySelector("[data-declared-role-input]");
      scope.querySelectorAll("[data-role-option]").forEach((option) => {
        option.classList.toggle("active", option === button);
      });
      if (input) {
        input.value = button.dataset.roleOption || "unsure";
      }
    });
  });
}

async function submitRegisterForm(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  setFormStatus(status, "Создаем аккаунт TravelGTC...", "pending");
  setSubmitDisabled(submitButton, true);

  try {
    const formData = new FormData(form);
    const payload = {
      display_name: getFormValue(formData, "display_name"),
      email: getFormValue(formData, "email"),
      password: String(formData.get("password") || ""),
      primary_channel: getFormValue(formData, "primary_channel") || "email",
      phone: getFormValue(formData, "phone") || undefined,
      consent_version: getFormValue(formData, "consent_version") || IDENTITY_CONSENT_VERSION,
      account_terms_consent: formData.get("account_terms_consent") === "on",
      privacy_consent: formData.get("privacy_consent") === "on",
    };

    const body = await requestApi("/api/travelgtc/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setAuthState({ authenticated: true, user: body.user || null });
    setFormStatus(status, "Аккаунт создан. Возвращаемся к заявке...", "success");
    redirectAfterAuth();
  } catch (error) {
    setFormStatus(status, error.message || "Не удалось создать аккаунт.", "error");
  } finally {
    setSubmitDisabled(submitButton, false);
  }
}

async function submitLoginForm(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  setFormStatus(status, "Входим в аккаунт...", "pending");
  setSubmitDisabled(submitButton, true);

  try {
    const formData = new FormData(form);
    const body = await requestApi("/api/travelgtc/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: getFormValue(formData, "email"),
        password: String(formData.get("password") || ""),
      }),
    });

    setAuthState({ authenticated: true, user: body.user || null });
    setFormStatus(status, "Вход выполнен. Возвращаемся к заявке...", "success");
    redirectAfterAuth();
  } catch (error) {
    setFormStatus(status, error.message || "Не удалось войти.", "error");
  } finally {
    setSubmitDisabled(submitButton, false);
  }
}

async function submitLeadForm(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const successMessage = form.getAttribute("data-success-message") || "Спасибо. Ваша заявка получена.";

  const isAuthenticated = await ensureAuthenticatedForLeadForm(form);
  if (!isAuthenticated) {
    return;
  }

  setFormStatus(status, "Отправляем заявку...", "pending");
  setSubmitDisabled(submitButton, true);

  try {
    prefillLeadContactFromUser(form);
    const payload = buildLeadPayload(form);
    const body = await requestApi("/api/travelgtc/v1/account/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setFormStatus(status, `${successMessage} Номер заявки: ${body.lead_id}.`, "success");
    sessionStorage.removeItem(AUTH_DRAFT_KEY);
    form.reset();
    resetRoleSelector(form);
    prefillLeadContactFromUser(form);
    updateLeadAuthNotes();
    setLeadFormSubmitted(submitButton);
  } catch (error) {
    setFormStatus(status, error.message || "Не удалось отправить заявку. Попробуйте позже.", "error");
  } finally {
    setSubmitDisabled(submitButton, false);
  }
}

async function ensureAuthenticatedForLeadForm(form) {
  const status = form.querySelector("[data-form-status]");
  const state = await loadCurrentAuthState();
  if (state.authenticated) {
    prefillLeadContactFromUser(form);
    return true;
  }

  saveLeadDraft(form);
  setFormStatus(
    status,
    "Чтобы отправить заявку, войдите или зарегистрируйтесь. Сейчас откроется форма аккаунта TravelGTC.",
    "pending",
  );
  window.setTimeout(() => {
    window.location.href = buildAuthUrlForForm(form);
  }, 350);
  return false;
}

function buildLeadPayload(form) {
  const formData = new FormData(form);
  const get = (name) => getFormValue(formData, name);
  const user = authState.authenticated ? authState.user : null;
  const defaultRole = form.getAttribute("data-default-role") || "unsure";
  const defaultInterest = form.getAttribute("data-default-interest") || "not_sure";
  const primaryInterest = get("primary_interest") || defaultInterest;
  const message = get("message") || buildMessageFromForm(formData);
  const declaredRole = get("declared_role") || defaultRole;
  const travelFormat = get("travel_format");
  const audienceType = get("audience_type");
  const preferredChannel = get("preferred_channel") || resolveUserPreferredChannel(user);

  return {
    name: get("name") || (user && (user.displayName || user.email)),
    preferred_channel: preferredChannel,
    contact_value: get("contact_value") || get("contact") || resolveUserContactValue(user, preferredChannel),
    declared_role: declaredRole === "unsure" ? inferDeclaredRole(primaryInterest, defaultRole) : declaredRole,
    primary_interest: primaryInterest,
    message,
    personal_data_consent: formData.get("personal_data_consent") === "on",
    communication_consent: formData.get("communication_consent") === "on",
    consent_version: get("consent_version") || "travelgtc-consent-v1",
    travel_format: travelFormat ? [travelFormat] : undefined,
    destination_interest: get("destination_interest") || undefined,
    approx_dates: get("approx_dates") || undefined,
    audience_type: audienceType ? [audienceType] : undefined,
    estimated_group_size: get("estimated_group_size") || undefined,
    business_interest_level: get("business_interest_level") || inferBusinessInterest(primaryInterest),
    consultation_preference: get("consultation_preference") || "message_first",
    best_contact_time: get("best_contact_time") || undefined,
    important_details: get("important_details") || undefined,
    tracking: buildTrackingPayload(),
  };
}

function buildMessageFromForm(formData) {
  const parts = [];
  ["destination_interest", "approx_dates", "estimated_group_size", "important_details"].forEach((name) => {
    const value = getFormValue(formData, name);
    if (value) {
      parts.push(value);
    }
  });
  return parts.join("\n") || "Хочу обсудить travel-направление.";
}

function buildTrackingPayload() {
  const params = new URLSearchParams(window.location.search);
  return {
    landing_path: window.location.pathname,
    referrer: document.referrer || undefined,
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
    referral_code: params.get("ref") || params.get("referral_code") || undefined,
    locale: navigator.language || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    client_event_id: createClientEventId(),
  };
}

function createClientEventId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `travelgtc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function loadCurrentAuthState() {
  if (authState.loaded) {
    return authState;
  }
  if (!authStatePromise) {
    authStatePromise = refreshAuthState();
  }
  await authStatePromise;
  return authState;
}

async function refreshAuthState() {
  try {
    const body = await requestApi("/api/travelgtc/v1/auth/me", { method: "GET" });
    setAuthState({
      authenticated: Boolean(body.authenticated),
      user: body.user || null,
    });
  } catch (error) {
    setAuthState({ authenticated: false, user: null });
  }
  return authState;
}

function setAuthState(nextState) {
  authState.loaded = true;
  authState.authenticated = Boolean(nextState.authenticated);
  authState.user = nextState.user || null;
  updateAuthStateUi();
  updateLeadAuthNotes();
  document.querySelectorAll("form[data-travelgtc-lead-form]").forEach((form) => {
    prefillLeadContactFromUser(form);
  });
}

function updateAuthStateUi() {
  document.querySelectorAll("[data-auth-anonymous]").forEach((element) => {
    element.hidden = authState.authenticated;
  });
  document.querySelectorAll("[data-auth-user]").forEach((element) => {
    element.hidden = !authState.authenticated;
  });
  document.querySelectorAll("[data-auth-user-name]").forEach((element) => {
    element.textContent = authState.user ? authState.user.displayName || authState.user.email : "Аккаунт";
  });
  document.querySelectorAll("[data-auth-user-email]").forEach((element) => {
    element.textContent = authState.user ? authState.user.email : "";
  });
}

function decorateAuthLinks() {
  document.querySelectorAll('a[href^="/auth/"]').forEach((link) => {
    const href = new URL(link.getAttribute("href"), window.location.origin);
    if (!href.searchParams.has("next")) {
      href.searchParams.set("next", currentReturnPath());
    }
    link.setAttribute("href", `${href.pathname}${href.search}${href.hash}`);
  });
}

function currentReturnPath() {
  if (window.location.pathname.startsWith("/auth/")) {
    return safeNextPath();
  }
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function safeNextPath() {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/auth/")) {
    return "/";
  }
  return next;
}

function redirectAfterAuth() {
  window.setTimeout(() => {
    window.location.href = safeNextPath();
  }, 450);
}

function buildAuthUrlForForm(form) {
  const next = formReturnPath(form);
  return `/auth/?mode=register&next=${encodeURIComponent(next)}`;
}

function formReturnPath(form) {
  const anchor = form.id || (form.closest("[id]") && form.closest("[id]").id);
  const hash = anchor ? `#${anchor}` : window.location.hash;
  return `${window.location.pathname}${window.location.search}${hash || ""}`;
}

function insertLeadAuthNote(form) {
  if (form.querySelector("[data-lead-auth-note]")) {
    return;
  }
  const note = document.createElement("p");
  note.className = "auth-gate-note";
  note.setAttribute("data-lead-auth-note", "");
  note.setAttribute("aria-live", "polite");
  const status = form.querySelector("[data-form-status]");
  form.insertBefore(note, status || form.firstElementChild);
  updateLeadAuthNote(note);
}

function updateLeadAuthNotes() {
  document.querySelectorAll("[data-lead-auth-note]").forEach(updateLeadAuthNote);
}

function updateLeadAuthNote(note) {
  if (authState.authenticated && authState.user) {
    note.textContent = `Вы вошли как ${authState.user.displayName || authState.user.email}. Контакты для связи берём из профиля: ${leadProfileContactSummary(authState.user)}.`;
    note.dataset.state = "user";
    return;
  }
  note.textContent = "Сначала войдите или зарегистрируйтесь. Контакты берём из профиля аккаунта.";
  note.dataset.state = "anonymous";
}

function prefillLeadContactFromUser(form) {
  if (!authState.authenticated || !authState.user) {
    return;
  }
  const name = form.querySelector('[name="name"]');
  const contact = form.querySelector('[name="contact_value"], [name="contact"]');
  const channel = form.querySelector('[name="preferred_channel"]');

  if (name && !name.value) {
    name.value = authState.user.displayName || "";
  }
  if (contact && !contact.value) {
    contact.value = authState.user.phone || authState.user.email || "";
  }
  if (channel && authState.user.primaryChannel && !channel.value) {
    channel.value = authState.user.primaryChannel;
  }
}

function saveLeadDraft(form) {
  const formData = new FormData(form);
  const safeFields = [
    "declared_role",
    "primary_interest",
    "travel_format",
    "destination_interest",
    "audience_type",
    "approx_dates",
    "estimated_group_size",
    "business_interest_level",
    "consultation_preference",
    "best_contact_time",
    "important_details",
    "message",
  ];
  const fields = {};
  safeFields.forEach((name) => {
    const value = getFormValue(formData, name);
    if (value) {
      fields[name] = value;
    }
  });
  sessionStorage.setItem(
    AUTH_DRAFT_KEY,
    JSON.stringify({
      path: window.location.pathname,
      anchor: form.id || (form.closest("[id]") && form.closest("[id]").id) || "",
      fields,
    }),
  );
}

function restoreLeadDraft(form) {
  const raw = sessionStorage.getItem(AUTH_DRAFT_KEY);
  if (!raw) {
    return;
  }

  try {
    const draft = JSON.parse(raw);
    if (!draft || draft.path !== window.location.pathname || !draft.fields) {
      return;
    }
    Object.entries(draft.fields).forEach(([name, value]) => {
      const field = form.querySelector(`[name="${cssEscape(name)}"]`);
      if (field && !field.value) {
        field.value = value;
      }
    });
    resetRoleSelector(form);
  } catch (error) {
    sessionStorage.removeItem(AUTH_DRAFT_KEY);
  }
}

async function requestApi(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.ok === false) {
    throw new Error(resolveApiErrorMessage(body, response.status));
  }

  return body;
}

function getApiBaseUrl() {
  const explicit = document.body.getAttribute("data-travelgtc-api-base-url");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    const localApiPorts = {
      "4173": "4301",
      "4174": "4302",
    };
    const apiPort = localApiPorts[window.location.port];
    if (apiPort) {
      return `http://127.0.0.1:${apiPort}`;
    }
  }
  return "";
}

function resolveApiErrorMessage(body, statusCode) {
  const code = body && body.error && body.error.code;
  if (code === "lead_capture_disabled") {
    return "Приём заявок сейчас выключен. Откройте страницу контактов, если хотите связаться сразу.";
  }
  if (code === "auth_required") {
    return "Для отправки заявки войдите или зарегистрируйтесь.";
  }
  if (code === "account_already_exists") {
    return "Аккаунт с таким email уже есть. Войдите с паролем.";
  }
  if (code === "invalid_credentials") {
    return "Неверный email или пароль.";
  }
  if (code === "validation_failed" || code === "auth_validation_failed") {
    return "Проверьте обязательные поля и согласия.";
  }
  if (code === "duplicate_submission") {
    return "Эта заявка уже была отправлена.";
  }
  if (code === "rate_limited") {
    return "Слишком много отправок подряд. Попробуйте немного позже.";
  }
  return `Не удалось выполнить действие. Код ответа: ${statusCode}.`;
}

function setFormStatus(status, message, type) {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = type;
}

function setSubmitDisabled(button, disabled) {
  if (button) {
    button.disabled = disabled;
  }
}

function setLeadFormSubmitted(button) {
  if (!button) {
    return;
  }
  button.textContent = "Вернуться на главную";
  button.type = "button";
  button.dataset.successAction = "home";
}

function resetRoleSelector(form) {
  const defaultRole = form.getAttribute("data-default-role") || "unsure";
  const roleInput = form.querySelector("[data-declared-role-input]");
  if (roleInput && !roleInput.value) {
    roleInput.value = defaultRole;
  }
  const currentRole = roleInput ? roleInput.value : defaultRole;
  form.querySelectorAll("[data-role-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.roleOption === currentRole);
  });
}

function inferBusinessInterest(primaryInterest) {
  return primaryInterest === "business_model" ? "want_to_understand" : "none";
}

function inferDeclaredRole(primaryInterest, fallbackRole) {
  if (primaryInterest === "create_trip") return "trip_author";
  if (primaryInterest === "event") return "event_organizer";
  if (primaryInterest === "club") return "community_leader";
  if (primaryInterest === "business_model" || primaryInterest === "presentation") return "partner_candidate";
  if (primaryInterest === "travel") return "traveler";
  return fallbackRole || "unsure";
}

function resolveUserPreferredChannel(user) {
  if (user && user.primaryChannel === "phone" && user.phone) return "phone";
  if (user && user.primaryChannel === "email") return "email";
  if (user && user.phone) return "phone";
  return "email";
}

function resolveUserContactValue(user, preferredChannel) {
  if (!user) return "";
  if (preferredChannel === "phone" && user.phone) return user.phone;
  if (preferredChannel === "email" && user.email) return user.email;
  return user.phone || user.email || "";
}

function leadProfileContactSummary(user) {
  const contacts = [];
  if (user.email) contacts.push(user.email);
  if (user.phone) contacts.push(user.phone);
  return contacts.join(", ") || "аккаунт TravelGTC";
}

function mapTravelFormat(label) {
  const normalized = label.toLowerCase();
  if (normalized.includes("йога")) return "yoga";
  if (normalized.includes("фридайв")) return "freediving";
  if (normalized.includes("ретрит")) return "retreat";
  if (normalized.includes("бизнес")) return "business_weekend";
  if (normalized.includes("спорт")) return "sport";
  if (normalized.includes("сем")) return "family";
  if (normalized.includes("круиз")) return "cruise";
  if (normalized.includes("отдых")) return "rest";
  return "other";
}

function getFormValue(formData, name) {
  return String(formData.get(name) || "").trim();
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return String(value).replace(/"/g, '\\"');
}
