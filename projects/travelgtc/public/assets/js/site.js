const AUTH_DRAFT_KEY = "travelgtc.leadDraft.v1";
const IDENTITY_CONSENT_VERSION = "travelgtc-identity-consent-v1";
const AI_CONSULTANT_NAME = "Мира TravelGTC";
const AI_SCENARIO_QUESTIONS = {
  "personal-travel": "Я хочу путешествовать чаще. Как Travel Advantage может помочь и какой уровень Membership стоит сравнить?",
  family: "Хочу путешествовать с семьёй и близкими. Какой Membership лучше сравнить, чтобы не выбрать слишком слабый уровень?",
  groups: "У меня есть группа, ученики или клиенты. Как использовать Travel Advantage для поездок, событий и Membership?",
  events: "Хочу понять, как события и клубная среда помогают выбрать Membership и познакомиться с проектом.",
  "ambassador-business": "Хочу понять, как построить business-направление вокруг Travel Advantage и роли Lifestyle Ambassador.",
  "next-step": "Я хочу понять, какой следующий шаг мне подходит: Free Guest Pass, Membership, VIP Membership, регистрация по партнёрской ссылке или сопровождение TravelGTC. Помоги выбрать по моей ситуации.",
};
const AI_SCENARIO_KEYS = new Set(Object.keys(AI_SCENARIO_QUESTIONS));
const TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL = "https://vip.traveladvantage.com/KFilip909";
const TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL = "https://free.traveladvantage.com/KFilip909";
const OFFICIAL_SOURCE_TEXT =
  "Официальные источники для проверки: MWR Life https://www.mwrlife.com/, Membership https://www.mwrlife.com/home/membership, Company https://www.mwrlife.com/home/company, Travel Advantage https://www.traveladvantage.com/home, Membership Benefits PDF https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf, VIP Membership https://vip.traveladvantage.com/KFilip909, Free Guest Pass https://free.traveladvantage.com/KFilip909.";

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
initMiraContactLinks();
initAuthForms();
initAuthPageContext();
initMiraEntryLinks();
initLeadForms();
initPrototypeForms();
initFormatButtons();
initRoleButtons();
initAiConsultant();
initCrmPage();

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
    setFormStatus(status, authReturnMessage("Аккаунт создан"), "success");
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
    setFormStatus(status, authReturnMessage("Вход выполнен"), "success");
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
  const message = get("message") || buildMessageFromForm(form, formData);
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

function buildMessageFromForm(form, formData) {
  const parts = [];
  const selectedInterest = form.querySelector('select[name="primary_interest"] option:checked');
  if (selectedInterest && selectedInterest.textContent) {
    parts.push(`Интерес: ${selectedInterest.textContent.trim()}.`);
  }
  ["destination_interest", "approx_dates", "estimated_group_size", "important_details"].forEach((name) => {
    const value = getFormValue(formData, name);
    if (value) {
      parts.push(value);
    }
  });
  return parts.join("\n") || "Хочу получить консультацию TravelGTC.";
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
      canAccessCrm: Boolean(body.can_access_crm),
      canManageChats: Boolean(body.can_manage_chats),
    });
  } catch (error) {
    setAuthState({ authenticated: false, user: null, canAccessCrm: false, canManageChats: false });
  }
  return authState;
}

function setAuthState(nextState) {
  authState.loaded = true;
  authState.authenticated = Boolean(nextState.authenticated);
  authState.user = nextState.user || null;
  authState.canAccessCrm = Boolean(nextState.canAccessCrm);
  authState.canManageChats = Boolean(nextState.canManageChats);
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
  document.querySelectorAll("[data-auth-user]").forEach((accountUser) => {
    const existingLink = accountUser.querySelector("[data-auth-crm-link]");
    if (!authState.authenticated || !authState.canAccessCrm) {
      existingLink?.remove();
      return;
    }
    if (!existingLink) {
      const crmLink = document.createElement("a");
      crmLink.className = "account-crm-link";
      crmLink.href = "/crm/";
      crmLink.dataset.authCrmLink = "";
      crmLink.textContent = "CRM";
      accountUser.querySelector("[data-auth-logout]")?.before(crmLink);
    }
  });
}

function initMiraContactLinks() {
  document.querySelectorAll(".site-footer .footer-links").forEach((links) => {
    if (links.querySelector('[href="/mira/"]')) {
      return;
    }
    const miraLink = document.createElement("a");
    miraLink.href = "/mira/";
    miraLink.textContent = "Связаться через Миру";
    links.appendChild(miraLink);
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

function initAuthPageContext() {
  const context = document.querySelector("[data-auth-entry-context]");
  if (!context || !window.location.pathname.startsWith("/auth/")) {
    return;
  }

  const next = safeNextPath();
  if (!next.startsWith("/mira/")) {
    return;
  }

  context.hidden = false;
  context.textContent = "После входа вы вернётесь к Мире: выбранный сценарий сохранится, а разговор появится в вашем профиле TravelGTC.";
}

function authReturnMessage(prefix) {
  return safeNextPath().startsWith("/mira/")
    ? `${prefix}. Возвращаемся к разговору с Мирой...`
    : `${prefix}. Возвращаемся к заявке...`;
}

function initMiraEntryLinks() {
  document.querySelectorAll('a[href^="/mira/"]').forEach((link) => {
    link.addEventListener("click", async (event) => {
      if (window.location.pathname.startsWith("/mira/")) {
        return;
      }

      event.preventDefault();
      const target = buildMiraTargetPath(link.getAttribute("href") || "/mira/");
      const state = await loadCurrentAuthState();
      window.location.href = state.authenticated ? target : buildMiraAuthUrl(target, "register");
    });
  });
}

function buildMiraTargetPath(rawTarget) {
  const target = new URL(rawTarget, window.location.origin);
  const scenario = target.searchParams.get("scenario");
  if (scenario && !AI_SCENARIO_KEYS.has(scenario)) {
    target.searchParams.delete("scenario");
  }
  if (!target.searchParams.has("source")) {
    target.searchParams.set("source", window.location.pathname === "/" ? "home" : window.location.pathname.replace(/^\/+|\/+$/g, "").slice(0, 80) || "site");
  }
  return `${target.pathname}${target.search}${target.hash}`;
}

function buildMiraAuthUrl(next, mode = "register") {
  return `/auth/?mode=${encodeURIComponent(mode)}&next=${encodeURIComponent(next)}`;
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
  return ["business_model", "partner_model", "learn_lifestyle_ambassador"].includes(primaryInterest)
    ? "want_to_understand"
    : "none";
}

function inferDeclaredRole(primaryInterest, fallbackRole) {
  if (primaryInterest === "create_trip") return "trip_author";
  if (primaryInterest === "event") return "event_organizer";
  if (primaryInterest === "events") return "event_organizer";
  if (primaryInterest === "club") return "community_leader";
  if (primaryInterest === "business_model" || primaryInterest === "presentation") return "partner_candidate";
  if (primaryInterest === "partner_model" || primaryInterest === "learn_lifestyle_ambassador") return "partner_candidate";
  if (primaryInterest === "presentation_request") return "partner_candidate";
  if (primaryInterest === "learn_travel_advantage" || primaryInterest === "become_travel_advantage_member") return "traveler";
  if (primaryInterest === "learn_mwr_life" || primaryInterest === "question") return "unsure";
  if (primaryInterest === "travel") return "traveler";
  return fallbackRole || "unsure";
}

function initAiConsultant() {
  const widget = document.querySelector("[data-ai-widget]");
  const panel = document.querySelector("[data-ai-panel]");
  const form = document.querySelector("[data-ai-form]");
  const messages = document.querySelector("[data-ai-messages]");
  const starters = document.querySelector("[data-ai-starters]");
  const questionSelect = document.querySelector("[data-ai-question-select]");
  if (!panel || !messages) {
    return;
  }

  restoreAiWidgetPosition(widget);
  initAiPanelDrag(widget, panel);
  initAiScenarioQuestion(form, questionSelect);
  initAiEntryActions(panel);
  initAiPendingQuestion(panel, form, messages);

  if (panel.closest("[data-ai-page]")) {
    window.setTimeout(() => syncAiPanelState(panel), 80);
  }

  document.querySelectorAll("[data-ai-open]").forEach((trigger) => {
    trigger.addEventListener("click", async (event) => {
      event.preventDefault();
      openAiPanel(panel);
      await syncAiPanelState(panel);
    });
  });

  document.querySelectorAll("[data-ai-close]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      panel.hidden = true;
      if (widget) {
        widget.classList.remove("is-open");
      }
    });
  });

  document.querySelectorAll("[data-ai-minimize]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      panel.hidden = true;
      if (widget) {
        widget.classList.remove("is-open");
      }
    });
  });

  if (starters && form) {
    starters.querySelectorAll("[data-ai-starter]").forEach((starter) => {
      starter.addEventListener("click", () => {
        const input = form.querySelector('input[name="question"]');
        if (input) {
          input.value = starter.dataset.aiStarter || starter.textContent.trim();
        }
        form.requestSubmit();
      });
    });
  }

  if (questionSelect && form) {
    questionSelect.addEventListener("change", () => {
      const input = form.querySelector('input[name="question"]');
      if (input && questionSelect.value) {
        input.value = questionSelect.value;
        input.focus();
      }
    });
  }

  if (form) {
    initAiVoiceInput(form);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
        const input = form.querySelector('input[name="question"]');
        const panel = form.closest("[data-ai-panel]");
        const select = panel ? panel.querySelector("[data-ai-question-select]") : document.querySelector("[data-ai-question-select]");
        const submitButton = form.querySelector('button[type="submit"]');
        const selectedQuestion = select && select.value ? select.value.trim() : "";
        const question = input && input.value.trim() ? input.value.trim() : selectedQuestion;
        if (!question) {
          return;
        }
        dismissAiQuestionPrompt(form);
        const authenticated = await ensureAuthenticatedForAiChat(question, panel, messages);
        if (!authenticated) {
          return;
        }
        await askAiQuestion(form, messages, question, submitButton);
      });
  }
}

function initAiScenarioQuestion(form, questionSelect) {
  if (!form) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get("scenario") || "";
  const question = AI_SCENARIO_QUESTIONS[scenario];
  if (!question) {
    return;
  }
  const input = form.querySelector('input[name="question"]');
  if (input) {
    input.value = question;
  }
  if (questionSelect) {
    questionSelect.value = question;
  }
}

function dismissAiQuestionPrompt(form) {
  const panel = form.closest("[data-ai-panel]");
  const prompt = panel ? panel.querySelector("[data-ai-question-prompt]") : document.querySelector("[data-ai-question-prompt]");
  if (prompt) {
    prompt.hidden = true;
  }
}

async function initAiPendingQuestion(panel, form, messages) {
  const pendingQuestion = window.sessionStorage.getItem("travelgtc_ai_pending_question");
  if (!pendingQuestion || !form) {
    return;
  }

  const state = await loadCurrentAuthState();
  if (!state.authenticated) {
    return;
  }

  window.sessionStorage.removeItem("travelgtc_ai_pending_question");
  openAiPanel(panel);
  await syncAiPanelState(panel, { forceReload: true });
  const input = form.querySelector('input[name="question"]');
  if (input) {
    input.value = pendingQuestion;
  }
  window.setTimeout(() => form.requestSubmit(), 350);
}

function openAiPanel(panel) {
  panel.hidden = false;
  const widget = panel.closest("[data-ai-widget]");
  if (widget) {
    widget.classList.add("is-open");
    window.setTimeout(() => constrainAiWidgetInViewport(widget), 30);
  }
  const input = panel.querySelector('input[name="question"]');
  if (input) {
    window.setTimeout(() => input.focus(), 80);
  }
}

async function syncAiPanelState(panel, options = {}) {
  const messages = panel.querySelector("[data-ai-messages]");
  if (!messages) {
    return;
  }
  const state = await loadCurrentAuthState();
  if (!state.authenticated) {
    setAiConversationAccess(panel, false);
    return;
  }
  setAiConversationAccess(panel, true);
  removeAiAuthGate(messages);
  await loadAiChatHistory(panel, state.user, { forceReload: Boolean(options.forceReload) });
}

function initAiEntryActions(panel) {
  const next = buildMiraTargetPath(`${window.location.pathname}${window.location.search}#ai-consultant`);
  const login = panel.querySelector("[data-ai-entry-login]");
  const register = panel.querySelector("[data-ai-entry-register]");
  if (login) {
    login.setAttribute("href", buildMiraAuthUrl(next, "login"));
  }
  if (register) {
    register.setAttribute("href", buildMiraAuthUrl(next, "register"));
  }
}

function setAiConversationAccess(panel, authenticated) {
  const gate = panel.querySelector("[data-ai-entry-gate]");
  const messages = panel.querySelector("[data-ai-messages]");
  const form = panel.querySelector("[data-ai-form]");
  if (gate) {
    gate.hidden = authenticated;
  }
  if (messages) {
    messages.hidden = !authenticated;
  }
  if (form) {
    form.hidden = !authenticated;
  }
}

function appendAiMessage(messages, text, type, options = {}) {
  const message = document.createElement("div");
  message.className = `ai-message ${type}`;
  if (options.authGate) {
    message.dataset.aiAuthGate = "true";
  }
  if (type === "bot" && options.markdown !== false) {
    renderAiMarkdown(message, text);
  } else {
    message.textContent = text;
  }
  messages.appendChild(message);
  return message;
}

async function ensureAuthenticatedForAiChat(question, panel, messages) {
  const state = await loadCurrentAuthState();
  if (state.authenticated) {
    removeAiAuthGate(messages);
    return true;
  }

  window.sessionStorage.setItem("travelgtc_ai_pending_question", question);
  showAiAuthGate(panel, messages);
  window.setTimeout(() => {
    window.location.href = buildAiAuthUrl();
  }, 900);
  return false;
}

function showAiAuthGate(panel, messages) {
  if (messages.querySelector("[data-ai-auth-gate]")) {
    return;
  }
  appendAiMessage(
    messages,
    "Чтобы Мира могла сохранить историю диалога, отправить документы и передать ваш запрос в CRM, сначала войдите или зарегистрируйтесь в TravelGTC.\n\nЯ сохраню выбранный вопрос и верну вас обратно в чат.",
    "bot",
    { authGate: true },
  );
  messages.scrollTop = messages.scrollHeight;
  const input = panel.querySelector('input[name="question"]');
  if (input) {
    input.placeholder = "Войдите, чтобы начать диалог с Мирой";
  }
}

function removeAiAuthGate(messages) {
  messages.querySelectorAll("[data-ai-auth-gate]").forEach((item) => item.remove());
}

function buildAiAuthUrl() {
  const next = buildMiraTargetPath(`${window.location.pathname}${window.location.search}#ai-consultant`);
  return buildMiraAuthUrl(next, "register");
}

async function loadAiChatHistory(panel, user, options = {}) {
  const messages = panel.querySelector("[data-ai-messages]");
  if (!messages || (panel.dataset.aiHistoryLoaded === "true" && !options.forceReload)) {
    return;
  }

  try {
    const body = await requestApi("/api/travelgtc/v1/account/ai/chat/history", { method: "GET" });
    const history = Array.isArray(body.messages) ? body.messages : [];
    panel.dataset.aiHistoryLoaded = "true";
    if (!history.length) {
      return;
    }

    messages.innerHTML = "";
    appendAiMessage(
      messages,
      buildAiReturnGreeting(user, history.length),
      "bot",
    );
    history.forEach((item) => {
      appendAiMessage(messages, item.body || "", item.direction === "inbound" ? "user" : "bot", {
        markdown: item.direction !== "inbound",
      });
    });
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    panel.dataset.aiHistoryLoaded = "false";
  }
}

function buildAiReturnGreeting(user, turnCount) {
  const name = user && user.displayName ? user.displayName.split(/\s+/)[0] : "";
  const greetingName = name ? `, ${name}` : "";
  return `С возвращением${greetingName} 🌍\n\nПродолжаем наш разговор с Мирой TravelGTC: я подняла историю из CRM, чтобы не начинать заново. В диалоге уже ${turnCount} сохранённых реплик, поэтому следующий ответ будет учитывать ваш предыдущий интерес.`;
}

async function askAiQuestion(form, messages, question, submitButton) {
  appendAiMessage(messages, question, "user", { markdown: false });
  form.reset();
  setSubmitDisabled(submitButton, true);
  const pending = appendAiMessage(messages, buildAiThinkingMessage(question), "bot");
  messages.scrollTop = messages.scrollHeight;
  try {
    const body = await requestApi("/api/travelgtc/v1/account/ai/chat", {
      method: "POST",
      body: JSON.stringify({ question, ...getAiChatContext() }),
    });
    renderAiMarkdown(pending, body.answer || buildAiStubAnswer(question));
    appendAiFeedbackControls(pending, body.answer || "", body.lead_id || "");
    revealAiMessageStart(messages, pending);
    const panel = form.closest("[data-ai-panel]");
    if (panel) {
      panel.dataset.aiHistoryLoaded = "true";
    }
  } catch (error) {
    if (error.message && error.message.includes("auth_required")) {
      window.sessionStorage.setItem("travelgtc_ai_pending_question", question);
      renderAiMarkdown(pending, "Для продолжения войдите или зарегистрируйтесь в TravelGTC. Я сохраню ваш вопрос и верну вас в чат.");
      window.setTimeout(() => {
        window.location.href = buildAiAuthUrl();
      }, 900);
    } else {
      renderAiMarkdown(pending, buildAiStubAnswer(question));
    }
  } finally {
    setSubmitDisabled(submitButton, false);
  }
}

function revealAiMessageStart(messages, message) {
  if (!messages || !message) {
    return;
  }
  window.requestAnimationFrame(() => {
    messages.scrollTop = Math.max(0, message.offsetTop - messages.offsetTop - 10);
  });
}

function getAiChatContext() {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get("scenario") || "";
  const source = params.get("source") || "";
  const cta = params.get("cta") || "";
  return {
    scenario: AI_SCENARIO_KEYS.has(scenario) ? scenario : undefined,
    source: source.slice(0, 80) || undefined,
    cta: cta.slice(0, 80) || undefined,
  };
}

function appendAiFeedbackControls(message, answer, leadId) {
  if (!message || message.querySelector("[data-ai-feedback]")) {
    return;
  }
  const controls = document.createElement("div");
  controls.className = "ai-feedback";
  controls.dataset.aiFeedback = "";

  const label = document.createElement("span");
  label.textContent = "Ответ помог?";
  controls.appendChild(label);

  [
    ["positive", "👍", "Да, полезно"],
    ["negative", "👎", "Нет, не то"],
  ].forEach(([rating, icon, title]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = icon;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.addEventListener("click", async () => {
      await submitAiFeedback(button, controls, rating, answer, leadId);
    });
    controls.appendChild(button);
  });

  message.appendChild(controls);
}

async function submitAiFeedback(button, controls, rating, answer, leadId) {
  if (!controls || controls.dataset.aiFeedbackSent === "true") {
    return;
  }
  controls.dataset.aiFeedbackSent = "true";
  controls.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    item.classList.toggle("is-selected", item === button);
  });
  try {
    await requestApi("/api/travelgtc/v1/account/ai/chat/feedback", {
      method: "POST",
      body: JSON.stringify({
        rating,
        lead_id: leadId,
        message: String(answer || "").replace(/\s+/g, " ").trim().slice(0, 360),
      }),
    });
    const note = document.createElement("em");
    note.textContent = rating === "positive" ? "Спасибо, Мира учится попадать точнее." : "Спасибо, это поможет улучшить ответ.";
    controls.appendChild(note);
  } catch (error) {
    controls.dataset.aiFeedbackSent = "false";
    controls.querySelectorAll("button").forEach((item) => {
      item.disabled = false;
      item.classList.remove("is-selected");
    });
  }
}

function buildAiThinkingMessage(question) {
  if (/(тариф|membership|elite|vip|turbo|семь|семьи|балл|loyalty)/i.test(question)) {
    return "Хороший вопрос ⭐\n\nСейчас разложу по полочкам и помогу понять, какой уровень стоит сравнить первым. Заодно уточним ваши travel-хотелки, чтобы не выбрать слишком слабый вариант.";
  }
  if (/(групп|клиент|ретрит|йог|цигун|wellness|ambassador|бизнес)/i.test(question)) {
    return "О, это уже похоже на travel-направление 🧭\n\nСейчас посмотрю на ваш сценарий как на сочетание поездок, сообщества и возможной Ambassador-модели.";
  }
  return "Рада, что вы здесь 🌍\n\nСейчас подготовлю обстоятельный ответ и постараюсь связать его с вашей реальной любовью к путешествиям.";
}

function renderAiMarkdown(container, text) {
  container.innerHTML = "";
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  let list = null;

  const finishList = () => {
    if (list) {
      container.appendChild(list);
      list = null;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || /^-{3,}$/.test(line)) {
      finishList();
      return;
    }

    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      finishList();
      const element = document.createElement("strong");
      element.className = "ai-message-heading";
      appendInlineMarkdown(element, heading[1]);
      container.appendChild(element);
      return;
    }

    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bullet) {
      if (!list) {
        list = document.createElement("ul");
      }
      const item = document.createElement("li");
      appendInlineMarkdown(item, bullet[1]);
      list.appendChild(item);
      return;
    }

    finishList();
    const paragraph = document.createElement("p");
    appendInlineMarkdown(paragraph, line);
    container.appendChild(paragraph);
  });

  finishList();
}

function appendInlineMarkdown(parent, text) {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  String(text).replace(pattern, (match, _token, offset) => {
    if (offset > lastIndex) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
    }
    if (match.startsWith("**") && match.endsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = match.slice(2, -2);
      parent.appendChild(strong);
    } else {
      const markdownLink = match.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      const link = document.createElement("a");
      link.href = markdownLink ? markdownLink[2] : match;
      link.textContent = markdownLink ? markdownLink[1] : match;
      link.target = "_blank";
      link.rel = "noopener";
      parent.appendChild(link);
    }
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < text.length) {
    parent.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function restoreAiWidgetPosition(widget) {
  if (!widget || window.matchMedia("(max-width: 760px)").matches) {
    return;
  }
  const saved = window.localStorage.getItem("travelgtc_ai_widget_position");
  if (!saved) {
    return;
  }
  try {
    const position = JSON.parse(saved);
    if (Number.isFinite(position.left) && Number.isFinite(position.top)) {
      widget.style.left = `${Math.max(12, Math.min(position.left, window.innerWidth - 120))}px`;
      widget.style.top = `${Math.max(12, Math.min(position.top, window.innerHeight - 80))}px`;
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    }
  } catch (error) {
    window.localStorage.removeItem("travelgtc_ai_widget_position");
  }
}

function initAiPanelDrag(widget, panel) {
  const handle = panel.querySelector("[data-ai-drag-handle]");
  if (!widget || !handle || window.matchMedia("(max-width: 760px)").matches) {
    return;
  }
  let dragState = null;

  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    const rect = widget.getBoundingClientRect();
    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    widget.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragState) {
      return;
    }
    const width = widget.offsetWidth || 430;
    const height = widget.offsetHeight || 540;
    const left = Math.max(12, Math.min(event.clientX - dragState.offsetX, window.innerWidth - width - 12));
    const top = Math.max(12, Math.min(event.clientY - dragState.offsetY, window.innerHeight - height - 12));
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
  });

  handle.addEventListener("pointerup", (event) => {
    if (!dragState) {
      return;
    }
    dragState = null;
    widget.classList.remove("is-dragging");
    const rect = widget.getBoundingClientRect();
    window.localStorage.setItem(
      "travelgtc_ai_widget_position",
      JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) }),
    );
    handle.releasePointerCapture(event.pointerId);
  });
}

function constrainAiWidgetInViewport(widget) {
  if (!widget || window.matchMedia("(max-width: 760px)").matches) {
    return;
  }
  const rect = widget.getBoundingClientRect();
  const margin = 12;
  let nextLeft = rect.left;
  let nextTop = rect.top;

  if (rect.right > window.innerWidth - margin) {
    nextLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  }
  if (rect.left < margin) {
    nextLeft = margin;
  }
  if (rect.bottom > window.innerHeight - margin) {
    nextTop = Math.max(margin, window.innerHeight - rect.height - margin);
  }
  if (rect.top < margin) {
    nextTop = margin;
  }

  if (Math.round(nextLeft) !== Math.round(rect.left) || Math.round(nextTop) !== Math.round(rect.top)) {
    widget.style.left = `${nextLeft}px`;
    widget.style.top = `${nextTop}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    window.localStorage.setItem(
      "travelgtc_ai_widget_position",
      JSON.stringify({ left: Math.round(nextLeft), top: Math.round(nextTop) }),
    );
  }
}

function initAiVoiceInput(form) {
  const button = form.querySelector("[data-ai-voice]");
  const input = form.querySelector('input[name="question"]');
  if (!button || !input) return;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    button.disabled = true;
    button.title = "Голосовой ввод не поддерживается этим браузером";
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.addEventListener("start", () => {
    button.classList.add("is-recording");
    button.title = "Слушаю вопрос...";
  });

  recognition.addEventListener("end", () => {
    button.classList.remove("is-recording");
    button.title = "Задать вопрос голосом";
  });

  recognition.addEventListener("result", (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0] && result[0].transcript ? result[0].transcript : "")
      .join(" ")
      .trim();
    if (transcript) {
      input.value = transcript;
    }
  });

  recognition.addEventListener("error", () => {
    button.classList.remove("is-recording");
    button.title = "Голосовой ввод недоступен";
  });

  button.addEventListener("click", () => {
    try {
      recognition.start();
    } catch (error) {
      recognition.stop();
    }
  });
}

function buildAiStubAnswer(question) {
  const normalized = question.toLowerCase();
  const nextStepPattern = /(зарегистр|регистрац|стоим|цена|сколько|участник|купить|оплат|checkout|ambassador|амбассад|страна|доступ|ссылка|связ|контакт|whatsapp|telegram|телефон|email)/i;
  const tariffPattern = /(тариф|membership|уровн|покуп|подключ|семь|семьи|друз|premium|elite|элит|turbo|турбо|vip|пакет|подобрать)/i;
  const sourcePattern = /(официальн|источник|сайт|документ|pdf|benefits|правил|услов)/i;
  const guestAccessPattern = /(guest pass|гостев|demo|демо|trial|тест|посмотреть|доступ|free|vip)/i;
  const storyPattern = /(истори|знаком|встреч|событ|пара|друг|партн[её]р|впечатл|путешеств)/i;
  const groupBusinessPattern = /(групп|ученик|клиент|ретрит|wellness|йог|цигун|тренер|организ|сообществ|business|бизнес|заработ|рекомендац|ambassador|амбассад)/i;
  const familyPattern = /(семь|семьи|близк|дет|свадеб|подар|родител|друз)/i;

  if (guestAccessPattern.test(normalized)) {
    const vipFit = /(vip|elite|элит|membership|тариф|семь|друз|групп|клиент|балл|loyalty|событ|ambassador|амбассад|куп|оплат|сравн)/i.test(normalized);
    const primaryLine = vipFit
      ? `🌟 VIP Membership: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}`
      : `🆓 Free Guest Pass: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}`;
    const secondaryLine = vipFit
      ? `🆓 Free Guest Pass, если хотите начать совсем мягко: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}`
      : `🌟 VIP Membership, если уже хотите перейти к платному VIP-членству: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}`;
    return `Можно начать мягко: сначала выбрать правильный вход Travel Advantage, а уже потом обсуждать Membership и официальный шаг.\n\n${primaryLine}\n${secondaryLine}\n\nFree Guest Pass подходит для первого знакомства без кредитной карты и даёт гостевой доступ с ограничением: 1 hotel booking максимум на 2 ночи. VIP Membership — это продающая страница платного VIP-членства с переходом к official checkout.\n\nЕсли у вас семья, группа, клиенты, интерес к баллам, Elite, Turbo или Ambassador, я бы сначала сравнила уровни Membership, чтобы не выбрать слишком слабый тариф.`;
  }

  if (groupBusinessPattern.test(normalized)) {
    return `Это уже сильнее, чем просто “забронировать поездку” 🚀

Если у вас есть группа, ученики, клиенты, ретрит, wellness-направление или своё сообщество, Travel Advantage можно рассматривать как travel-инструмент для существующей аудитории:

- создавать поездки и события вокруг вашей темы;
- усиливать ценность для учеников, клиентов и партнёров;
- использовать Guest Passes и Membership как путь знакомства;
- отдельно рассмотреть роль Lifestyle Ambassador, если вы хотите развивать рекомендации и сеть.

В таком сценарии я бы не начинала с самого слабого уровня. Сначала стоит сравнить Elite и, если важна loyalty-механика, Turbo add-on: там могут быть важны Additional Users, Guest Passes и Loyalty Points.

Скажите, у вас уже есть своя аудитория или вы только хотите собрать первую группу?`;
  }

  if (familyPattern.test(normalized)) {
    return `Семейный сценарий часто недооценивают 👨‍👩‍👧

Если вы хотите путешествовать с близкими, дарить поездки, планировать отдых заранее или сделать, например, свадебное путешествие детям, важно смотреть не только на цену входа.

Я бы сравнила Membership через вопросы:

- кто будет пользоваться возможностями кроме вас;
- нужны ли дополнительные пользователи;
- хотите ли вы приглашать близких через Guest Passes;
- планируете одну поездку или несколько поездок в течение года.

По официальному PDF у Elite есть расширенные семейные и гостевые возможности, поэтому сначала лучше проверить, не является ли он более подходящим уровнем. А если бюджет сейчас ниже, тогда спокойно сравним VIP180 или VIP.

Кого вы хотите вовлечь в поездки первым: семью, друзей или детей?`;
  }

  if (tariffPattern.test(normalized)) {
    return `Хороший вопрос. Я бы начала не с названия тарифа, а с ваших задач 🌍

Чтобы не купить слишком слабый уровень, сначала проверяем “maximum fit”:

1. Вы путешествуете один, с семьёй или с друзьями?
2. Хотите ли вы приглашать близких, клиентов или участников группы?
3. Важны ли вам Guest Passes, Additional Users, Life Experiences или Loyalty Points?
4. Рассматриваете ли вы роль Lifestyle Ambassador в будущем?

Если есть семья, группа, клиенты, события или интерес к баллам, сначала стоит сравнить Elite и Turbo add-on. Если потребности проще или бюджет ограничен, тогда смотрим VIP180 или VIP.

Официальное сравнение уровней: https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf

Какой сценарий главный для вас сейчас: личные поездки, семья или группа/клиенты?`;
  }
  if (nextStepPattern.test(normalized)) {
    return `Похоже, вы уже близко к практическому шагу ✅

Есть три корректных входа:

- 🆓 Free Guest Pass, если хотите сначала посмотреть платформу без кредитной карты: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}
- 🌟 VIP Membership, если уже хотите перейти к платному VIP-членству: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}
- 🔗 официальная партнёрская регистрация TravelGTC, если готовы регистрироваться или обсуждать Ambassador: https://www.mwrlife.com/KFilip909

Перед оплатой я бы всё же быстро проверила: вам нужен только личный доступ или важны семья, друзья, группы, клиенты, Guest Passes, Elite, Turbo add-on и Loyalty Points? Это помогает не выбрать уровень слабее ваших реальных задач.`;
  }
  if (sourcePattern.test(normalized)) {
    return `${OFFICIAL_SOURCE_TEXT} TravelGTC — партнёрская информационная страница независимого Lifestyle Ambassador, поэтому финальные цены, условия, правила членства, документы и региональную доступность нужно сверять именно там.`;
  }
  if (normalized.includes("travel advantage") || normalized.includes("членств")) {
    return "Travel Advantage — это онлайн/мобильное приложение для членов клуба путешественников. Его ценность лучше оценивать через ваши реальные планы: где вы хотите отдыхать, как часто ездите, с кем путешествуете и хотите ли использовать клубные события. Категории включают отели, перелёты, курорты, аренду авто, круизы, экскурсии, активности, трансферы, Travel Credits и Member Support. Чтобы подобрать Membership, скажите: вы хотите путешествовать для себя, с семьёй или использовать возможности для группы/клиентов?";
  }
  if (normalized.includes("mwr") || normalized.includes("компан")) {
    return "MWR Life — деловая сторона проекта: компания, Lifestyle Ambassador, события, обучение и партнёрская модель. На официальной странице компании указаны ориентиры масштаба: 10 лет работы, 300K+ участников, 150+ стран и 10 языков. TravelGTC не является официальным сайтом MWR Life, а помогает разобраться и подготовиться к следующему шагу.";
  }
  if (normalized.includes("доход") || normalized.includes("заработ")) {
    return "Доход в партнёрской модели не гарантирован. Любые результаты зависят от личной активности, навыков, времени, репутации и соблюдения официальных правил. Перед решением нужно изучить официальные раскрытия и документы.";
  }
  if (storyPattern.test(normalized)) {
    return "В travel-сообществах часто самое ценное начинается не с бронирования, а со встречи: кто-то находит компанию для поездки, кто-то — делового партнёра, кто-то — друга по интересам, а иногда и пару. Звучит как хороший маршрут: сначала люди, потом впечатления, потом новые возможности. Это пример атмосферы, не как обещание результата. При этом любые условия участия всё равно проверяются только по официальным материалам MWR Life / Travel Advantage.";
  }
  return "Я Мира TravelGTC. Помогаю не просто ответить на вопрос, а подобрать путь к Membership через вашу реальную потребность. Давайте начнём с практики: что сейчас важнее — путешествовать чаще, вовлечь семью, собрать друзей, организовать поездку для группы или понять Ambassador-направление?";
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

function initCrmPage() {
  const page = document.querySelector("[data-crm-page]");
  if (!page) {
    return;
  }

  const status = page.querySelector("[data-crm-status]");
  const workspace = page.querySelector("[data-crm-workspace]");
  const list = page.querySelector("[data-crm-leads]");
  const detail = page.querySelector("[data-crm-detail]");
  const empty = page.querySelector("[data-crm-detail-empty]");
  const refreshButton = page.querySelector("[data-crm-refresh]");
  const chatBulk = page.querySelector("[data-crm-chat-bulk]");
  const chatBulkAction = page.querySelector("[data-crm-chat-bulk-action]");
  const chatBulkApply = page.querySelector("[data-crm-chat-bulk-apply]");
  let selectedLeadId = new URLSearchParams(window.location.search).get("lead");
  let leads = [];
  const selectedChatLeadIds = new Set();

  refreshButton?.addEventListener("click", () => loadCrmLeads());
  chatBulkAction?.addEventListener("change", updateChatBulkControls);
  chatBulkApply?.addEventListener("click", applyChatBulkAction);
  void initializeCrmPage();

  async function initializeCrmPage() {
    await authStatePromise;
    if (chatBulk) chatBulk.hidden = !authState.canManageChats;
    await loadCrmLeads();
  }

  async function loadCrmLeads() {
    setCrmStatus(status, "Загружаем заявки...", "pending");
    try {
      const body = await requestApi("/api/travelgtc/v1/crm/leads", { method: "GET" });
      leads = body.leads || [];
      const availableChatIds = new Set(leads.filter(isMiraChatLead).map((lead) => lead.lead_id));
      selectedChatLeadIds.forEach((leadId) => {
        if (!availableChatIds.has(leadId)) selectedChatLeadIds.delete(leadId);
      });
      if (workspace) workspace.hidden = false;
      renderCrmLeadList(list, leads, selectedLeadId, openLead, {
        canManageChats: authState.canManageChats,
        selectedChatLeadIds,
        onChatSelectionChange: updateChatSelection,
      });
      updateChatBulkControls();
      if (selectedLeadId && leads.some((lead) => lead.lead_id === selectedLeadId)) {
        await openLead(selectedLeadId);
      } else {
        setCrmStatus(status, `Загружено заявок: ${leads.length}`, "success");
      }
    } catch (error) {
      if (workspace) workspace.hidden = true;
      const message =
        error.message && error.message.includes("crm_access_denied")
          ? "Доступ к CRM требует роли team. Войдите под командным аккаунтом TravelGTC."
          : error.message || "Не удалось загрузить CRM.";
      setCrmStatus(status, message, "error");
    }
  }

  async function openLead(leadId) {
    selectedLeadId = leadId;
    setCrmStatus(status, "Открываем заявку...", "pending");
    try {
      const body = await requestApi(`/api/travelgtc/v1/crm/leads/${encodeURIComponent(leadId)}`, { method: "GET" });
      if (empty) empty.hidden = true;
      if (detail) {
        detail.hidden = false;
        renderCrmLeadDetail(detail, body.lead, body.interactions || [], {
          onStageChange: updateLeadStage,
          onNoteSubmit: addLeadNote,
        });
      }
      list?.querySelectorAll("[data-crm-lead]").forEach((button) => {
        button.classList.toggle("active", button.dataset.crmLead === leadId);
      });
      setCrmStatus(status, "Заявка открыта.", "success");
    } catch (error) {
      setCrmStatus(status, error.message || "Не удалось открыть заявку.", "error");
    }
  }

  async function updateLeadStage(leadId, stage) {
    await requestApi(`/api/travelgtc/v1/crm/leads/${encodeURIComponent(leadId)}`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    await openLead(leadId);
    await loadCrmLeads();
  }

  async function addLeadNote(leadId, note) {
    await requestApi(`/api/travelgtc/v1/crm/leads/${encodeURIComponent(leadId)}/interactions`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    await openLead(leadId);
  }

  function updateChatSelection(leadId, selected) {
    if (selected) selectedChatLeadIds.add(leadId);
    else selectedChatLeadIds.delete(leadId);
    updateChatBulkControls();
  }

  function updateChatBulkControls() {
    if (!chatBulk || !chatBulkApply) return;
    chatBulk.hidden = !authState.canManageChats;
    chatBulkApply.disabled = !chatBulkAction?.value || selectedChatLeadIds.size === 0;
  }

  async function applyChatBulkAction() {
    const nextStatus = chatBulkAction?.value;
    if (!nextStatus || selectedChatLeadIds.size === 0) return;
    if (nextStatus === "deleted" && !window.confirm("Удалить отмеченные чаты из рабочего списка? Переписка сохранится для аудита.")) return;

    chatBulkApply.disabled = true;
    try {
      await Promise.all([...selectedChatLeadIds].map((leadId) => requestApi(`/api/travelgtc/v1/crm/chats/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })));
      const count = selectedChatLeadIds.size;
      selectedChatLeadIds.clear();
      if (chatBulkAction) chatBulkAction.value = "";
      await loadCrmLeads();
      setCrmStatus(status, `Обновлено чатов: ${count}`, "success");
    } catch (error) {
      setCrmStatus(status, error.message || "Не удалось обновить выбранные чаты.", "error");
    } finally {
      updateChatBulkControls();
    }
  }
}

function isMiraChatLead(lead) {
  return lead.source_path === "ai_chat";
}

function renderCrmLeadList(container, leads, selectedLeadId, onOpen, options = {}) {
  if (!container) return;
  container.innerHTML = "";
  if (!leads.length) {
    const empty = document.createElement("p");
    empty.className = "crm-empty";
    empty.textContent = "Заявок пока нет.";
    container.appendChild(empty);
    return;
  }

  leads.forEach((lead) => {
    const isMiraChat = options.canManageChats && isMiraChatLead(lead);
    const row = document.createElement("div");
    row.className = "crm-lead-entry";
    if (!isMiraChat) row.classList.add("plain");
    if (isMiraChat) {
      const label = document.createElement("label");
      label.className = "crm-chat-select";
      label.title = "Отметить диалог Миры";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.crmChatCheckbox = lead.lead_id;
      checkbox.checked = options.selectedChatLeadIds?.has(lead.lead_id) || false;
      checkbox.setAttribute("aria-label", `Отметить чат ${lead.display_name || "без имени"}`);
      checkbox.addEventListener("change", () => options.onChatSelectionChange?.(lead.lead_id, checkbox.checked));
      label.appendChild(checkbox);
      row.appendChild(label);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crm-lead-row";
    button.dataset.crmLead = lead.lead_id;
    button.classList.toggle("active", lead.lead_id === selectedLeadId);
    button.innerHTML = `
      <span><strong>${escapeHtml(lead.display_name || "Без имени")}</strong><small>${escapeHtml(formatCrmDate(lead.created_at))}</small></span>
      <span>${escapeHtml(crmInterestLabel(lead.primary_interest))}</span>
      <span class="crm-stage">${escapeHtml(isMiraChatLead(lead) ? `Мира: ${crmChatStatusLabel(lead.chat_status || "active")}` : crmStageLabel(lead.stage))}</span>
    `;
    button.addEventListener("click", () => onOpen(lead.lead_id));
    row.appendChild(button);
    container.appendChild(row);
  });
}

function renderCrmLeadDetail(container, lead, interactions, actions) {
  container.innerHTML = `
    <div class="crm-detail-head">
      <div>
        <p class="eyebrow dark">Заявка</p>
        <h2>${escapeHtml(lead.display_name || "Без имени")}</h2>
      </div>
      <select data-crm-stage-select>
        ${crmStageOptions(lead.stage)}
      </select>
    </div>
    <div class="crm-detail-grid">
      <article><strong>Контакт</strong><span>${escapeHtml(lead.primary_contact || "")}</span></article>
      <article><strong>Канал</strong><span>${escapeHtml(lead.primary_channel || "")}</span></article>
      <article><strong>Интерес</strong><span>${escapeHtml(crmInterestLabel(lead.primary_interest))}</span></article>
      <article><strong>Роль</strong><span>${escapeHtml(lead.declared_role || "")}</span></article>
    </div>
    <div class="crm-request">
      <h3>Запрос</h3>
      <p>${escapeHtml(lead.travel_description || lead.summary || "Нет текста запроса.")}</p>
      ${lead.recommended_next_step ? `<p><strong>Следующий шаг:</strong> ${escapeHtml(lead.recommended_next_step)}</p>` : ""}
    </div>
    <form class="crm-note-form" data-crm-note-form>
      <label for="crm-note">Внутренняя заметка</label>
      <textarea id="crm-note" name="note" rows="3" required></textarea>
      <button class="button small" type="submit">Добавить заметку</button>
    </form>
    <div class="crm-history">
      <h3>История</h3>
      ${interactions
        .map(
          (item) => `
            <article>
              <strong>${escapeHtml(formatCrmDate(item.created_at))} · ${escapeHtml(item.interaction_type || "")}</strong>
              <p>${escapeHtml(item.body || "")}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;

  const stage = container.querySelector("[data-crm-stage-select]");
  stage?.addEventListener("change", async () => {
    stage.disabled = true;
    try {
      await actions.onStageChange(lead.lead_id, stage.value);
    } finally {
      stage.disabled = false;
    }
  });

  const noteForm = container.querySelector("[data-crm-note-form]");
  noteForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const field = noteForm.querySelector('[name="note"]');
    const note = field ? field.value.trim() : "";
    if (!note) return;
    await actions.onNoteSubmit(lead.lead_id, note);
  });

}

function initCrmCustomersPage() {
  const page = document.querySelector("[data-crm-customers-page]");
  if (!page) return;

  const status = page.querySelector("[data-crm-customers-status]");
  const workspace = page.querySelector("[data-crm-customers-workspace]");
  const list = page.querySelector("[data-crm-customers]");
  const detail = page.querySelector("[data-crm-customer-detail]");
  const empty = page.querySelector("[data-crm-customer-empty]");
  const refreshButton = page.querySelector("[data-crm-customers-refresh]");
  const searchField = page.querySelector("[data-crm-customer-search]");
  const requestedCustomerId = new URLSearchParams(window.location.search).get("id");
  let selectedCustomerId = requestedCustomerId;
  let searchTimer = null;

  refreshButton?.addEventListener("click", () => loadCustomers());
  searchField?.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => loadCustomers(), 220);
  });
  loadCustomers();

  async function loadCustomers() {
    setCrmStatus(status, "Загружаем клиентов...", "pending");
    try {
      const search = searchField?.value.trim() || "";
      const body = await requestApi(`/api/travelgtc/v1/crm/customers?q=${encodeURIComponent(search)}`, { method: "GET" });
      if (workspace) workspace.hidden = false;
      renderCrmCustomerList(list, body.customers || [], selectedCustomerId, openCustomer);
      if (selectedCustomerId) {
        await openCustomer(selectedCustomerId);
      } else {
        setCrmStatus(status, `Загружено клиентов: ${(body.customers || []).length}`, "success");
      }
    } catch (error) {
      if (workspace) workspace.hidden = true;
      const message =
        error.message && error.message.includes("crm_access_denied")
          ? "Доступ к CRM требует роли team или admin."
          : error.message || "Не удалось загрузить клиентов.";
      setCrmStatus(status, message, "error");
    }
  }

  async function openCustomer(contactId) {
    selectedCustomerId = contactId;
    setCrmStatus(status, "Открываем карточку клиента...", "pending");
    try {
      const [body, conversation] = await Promise.all([
        requestApi(`/api/travelgtc/v1/crm/customers/${encodeURIComponent(contactId)}`, { method: "GET" }),
        requestApi(`/api/travelgtc/v1/crm/customers/${encodeURIComponent(contactId)}/conversations`, { method: "GET" }),
      ]);
      body.conversation = conversation.messages || [];
      if (empty) empty.hidden = true;
      if (detail) {
        detail.hidden = false;
        renderCrmCustomerDetail(detail, body, {
          onUpdate: updateCustomer,
          onNoteSubmit: addCustomerNote,
          onOpenLead: openLead,
          onSendEmail: sendCustomerEmail,
          onOpenExternalContact: openExternalContact,
          onContactOutcome: saveContactOutcome,
        });
      }
      list?.querySelectorAll("[data-crm-customer]").forEach((button) => {
        button.classList.toggle("active", button.dataset.crmCustomer === contactId);
      });
      const current = new URL(window.location.href);
      current.searchParams.set("id", contactId);
      window.history.replaceState({}, "", `${current.pathname}${current.search}`);
      setCrmStatus(status, "Карточка клиента открыта.", "success");
    } catch (error) {
      setCrmStatus(status, error.message || "Не удалось открыть карточку клиента.", "error");
    }
  }

  async function updateCustomer(contactId, payload) {
    await requestApi(`/api/travelgtc/v1/crm/customers/${encodeURIComponent(contactId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await openCustomer(contactId);
    await loadCustomers();
  }

  async function addCustomerNote(contactId, note) {
    await requestApi(`/api/travelgtc/v1/crm/customers/${encodeURIComponent(contactId)}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    await openCustomer(contactId);
  }

  async function sendCustomerEmail(contactId, payload) {
    await requestApi(`/api/travelgtc/v1/crm/customers/${encodeURIComponent(contactId)}/contact-actions/email`, {
      method: "POST", body: JSON.stringify(payload),
    });
    await openCustomer(contactId);
  }

  async function openExternalContact(contactId, payload) {
    const body = await requestApi(`/api/travelgtc/v1/crm/customers/${encodeURIComponent(contactId)}/contact-actions/external`, {
      method: "POST", body: JSON.stringify(payload),
    });
    if (body.href) window.location.assign(body.href);
    await openCustomer(contactId);
  }

  async function saveContactOutcome(actionId, payload) {
    await requestApi(`/api/travelgtc/v1/crm/contact-actions/${encodeURIComponent(actionId)}/outcome`, {
      method: "POST", body: JSON.stringify(payload),
    });
    await openCustomer(selectedCustomerId);
  }

  function openLead(leadId) {
    if (!leadId) return;
    window.location.assign(`/crm/?lead=${encodeURIComponent(leadId)}`);
  }
}

function crmChatStatusLabel(status) {
  return { active: "Активный", hidden: "Скрыт", archived: "Архив", deleted: "Удалён" }[status] || status || "";
}

function renderCrmCustomerList(container, customers, selectedCustomerId, onOpen) {
  if (!container) return;
  container.innerHTML = "";
  if (!customers.length) {
    const empty = document.createElement("p");
    empty.className = "crm-empty";
    empty.textContent = "Клиентов по этому запросу пока нет.";
    container.appendChild(empty);
    return;
  }
  customers.forEach((customer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crm-lead-row";
    button.dataset.crmCustomer = customer.contact_id;
    button.classList.toggle("active", customer.contact_id === selectedCustomerId);
    button.innerHTML = `
      <span><strong>${escapeHtml(customer.display_name || "Без имени")}</strong><small>${escapeHtml(customer.email || customer.phone || "Контакт не указан")}</small></span>
      <span>${Number(customer.lead_count || 0)} ${crmLeadCountLabel(customer.lead_count)}</span>
      <span class="crm-stage">${escapeHtml(crmCustomerStatusLabel(customer.relationship_status))}</span>
    `;
    button.addEventListener("click", () => onOpen(customer.contact_id));
    container.appendChild(button);
  });
}

function renderCrmCustomerDetail(container, data, actions) {
  const { customer, leads = [], tasks = [], notes = [], interactions = [], audit = [], roles = [], conversation = [] } = data;
  const primaryEmail = customer.registration_email || customer.contact_email || "Не указан";
  const primaryPhone = customer.registration_phone || customer.contact_phone || "Не указан";
  const timeline = [
    ...interactions.map((item) => ({ ...item, kind: "interaction", title: crmTimelineLabel(item) })),
    ...notes.map((item) => ({ ...item, kind: "note", title: "Внутренняя заметка" })),
    ...audit.map((item) => ({ ...item, kind: "audit", body: crmAuditLabel(item), title: "Изменение карточки" })),
  ].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  const conversations = crmConversationSessions(conversation);

  container.innerHTML = `
    <div class="crm-detail-head">
      <div>
        <p class="eyebrow dark">Клиент</p>
        <h2>${escapeHtml(customer.display_name || "Без имени")}</h2>
      </div>
      <select data-crm-customer-status-select>
        ${crmCustomerStatusOptions(customer.relationship_status)}
      </select>
    </div>
    <div class="crm-customer-profile-grid">
      <article><strong>Email</strong><span>${escapeHtml(primaryEmail)}</span></article>
      <article><strong>Телефон</strong><span>${escapeHtml(primaryPhone)}</span></article>
      <article><strong>Регистрация</strong><span>${escapeHtml(formatCrmDate(customer.registered_at || customer.contact_created_at))}</span></article>
      <article><strong>Статус аккаунта</strong><span>${escapeHtml(crmAccountStatusLabel(customer.account_status))}</span></article>
      <article><strong>Предпочтительный канал</strong><span>${escapeHtml(customer.registration_primary_channel || customer.contact_primary_channel || "Не указан")}</span></article>
      <article><strong>Роли TravelGTC</strong><span>${escapeHtml(roles.map((role) => role.role_code).join(", ") || "Нет")}</span></article>
    </div>
    <form class="crm-assignee-form" data-crm-assignee-form>
      <label for="crm-customer-assignee">Ответственный</label>
      <div><input id="crm-customer-assignee" name="assigned_to" maxlength="160" value="${escapeHtml(customer.assigned_to || "")}" placeholder="Например: Константин"><button class="button ghost small" type="submit">Сохранить</button></div>
    </form>
    <section class="crm-contact-actions crm-customer-section">
      <h3>Связаться с клиентом</h3>
      <p class="crm-contact-hint">Предпочтительный канал: <strong>${escapeHtml(customer.registration_primary_channel || customer.contact_primary_channel || "не указан")}</strong>. Действия сохраняются в истории карточки.</p>
      <div class="crm-contact-buttons">
        ${primaryPhone !== "Не указан" ? '<button type="button" class="button ghost small" data-crm-phone>Позвонить</button><button type="button" class="button ghost small" data-crm-whatsapp>WhatsApp</button>' : ''}
        ${primaryEmail !== "Не указан" ? '<button type="button" class="button small" data-crm-email-toggle>Написать email</button>' : ''}
      </div>
      ${primaryEmail !== "Не указан" ? `<form class="crm-email-form" data-crm-email-form hidden>
        <label>Тема<input name="subject" maxlength="180" required value="TravelGTC: продолжаем разговор"></label>
        <label>Сообщение<textarea name="body" rows="5" maxlength="5000" required>Здравствуйте, ${escapeHtml(customer.display_name || "")}. Продолжаем наш разговор о Travel Advantage.</textarea></label>
        <button class="button small" type="submit">Отправить письмо</button>
      </form>` : ''}
    </section>
    <section class="crm-customer-section">
      <h3>Заявки клиента</h3>
      <div class="crm-customer-leads">
        ${leads.length ? leads.map((lead) => `<button type="button" class="crm-customer-lead" data-crm-customer-lead="${escapeHtml(lead.lead_id)}"><strong>${escapeHtml(crmInterestLabel(lead.primary_interest))}</strong><span>${escapeHtml(crmStageLabel(lead.stage))} · ${escapeHtml(formatCrmDate(lead.created_at))}</span><small>${escapeHtml(lead.summary || lead.recommended_next_step || "Без дополнительного описания")}</small></button>`).join("") : "<p class=\"crm-empty\">Заявок пока нет.</p>"}
      </div>
    </section>
    <section class="crm-customer-section">
      <h3>Открытые задачи</h3>
      <div class="crm-customer-tasks">
        ${tasks.length ? tasks.map((task) => `<article><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.priority || "normal")} · ${escapeHtml(formatCrmDate(task.created_at))}</span>${task.description ? `<p>${escapeHtml(task.description)}</p>` : ""}</article>`).join("") : "<p class=\"crm-empty\">Открытых задач нет.</p>"}
      </div>
    </section>
    <form class="crm-note-form" data-crm-customer-note-form>
      <label for="crm-customer-note">Внутренняя заметка по клиенту</label>
      <textarea id="crm-customer-note" name="note" rows="3" required></textarea>
      <button class="button small" type="submit">Добавить заметку</button>
    </form>
    <section class="crm-conversations crm-customer-section">
      <h3>Диалог с Мирой</h3>
      ${conversations.length ? conversations.map((session, index) => `<details class="crm-conversation"${index === 0 ? " open" : ""}><summary>${escapeHtml(session.label)} <span>${session.messages.length} ${crmMessageCountLabel(session.messages.length)}</span></summary><div class="crm-conversation-messages">${session.messages.map((message) => `<article class="crm-message ${message.direction === "inbound" ? "from-customer" : "from-mira"}"><strong>${message.direction === "inbound" ? "Клиент" : "Мира"} · ${escapeHtml(formatCrmDate(message.created_at))}</strong><div>${crmMessageHtml(message.body)}</div></article>`).join("")}</div></details>`).join("") : '<p class="crm-empty">Диалог с Мирой пока не начинался.</p>'}
    </section>
    <section class="crm-history">
      <h3>Операционная история</h3>
      ${timeline.length ? timeline.map((item) => crmTimelineHtml(item)).join("") : "<p class=\"crm-empty\">История пока пуста.</p>"}
    </section>
  `;

  const statusSelect = container.querySelector("[data-crm-customer-status-select]");
  statusSelect?.addEventListener("change", async () => {
    statusSelect.disabled = true;
    try {
      await actions.onUpdate(customer.contact_id, {
        relationship_status: statusSelect.value,
        assigned_to: container.querySelector('[name="assigned_to"]')?.value.trim() || "",
      });
    } finally {
      statusSelect.disabled = false;
    }
  });
  container.querySelector("[data-crm-assignee-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await actions.onUpdate(customer.contact_id, {
      relationship_status: statusSelect?.value || customer.relationship_status,
      assigned_to: container.querySelector('[name="assigned_to"]')?.value.trim() || "",
    });
  });
  container.querySelector("[data-crm-customer-note-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const field = container.querySelector('[data-crm-customer-note-form] [name="note"]');
    const note = field?.value.trim() || "";
    if (note) await actions.onNoteSubmit(customer.contact_id, note);
  });
  container.querySelectorAll("[data-crm-customer-lead]").forEach((button) => {
    button.addEventListener("click", () => actions.onOpenLead(button.dataset.crmCustomerLead));
  });
  container.querySelector("[data-crm-email-toggle]")?.addEventListener("click", () => {
    const form = container.querySelector("[data-crm-email-form]");
    if (form) form.hidden = !form.hidden;
  });
  container.querySelector("[data-crm-email-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await actions.onSendEmail(customer.contact_id, { subject: form.elements.subject.value.trim(), body: form.elements.body.value.trim() });
  });
  container.querySelector("[data-crm-phone]")?.addEventListener("click", () => actions.onOpenExternalContact(customer.contact_id, { channel: "phone", message: "" }));
  container.querySelector("[data-crm-whatsapp]")?.addEventListener("click", () => actions.onOpenExternalContact(customer.contact_id, { channel: "whatsapp", message: `Здравствуйте, ${customer.display_name || ""}. Продолжаем наш разговор о Travel Advantage.` }));
  container.querySelectorAll("[data-crm-contact-outcome]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await actions.onContactOutcome(form.dataset.crmContactOutcome, { status: form.elements.status.value, note: form.elements.note.value.trim() });
    });
  });
}

function crmTimelineHtml(item) {
  const metadata = crmMetadata(item.metadata_json);
  const title = item.kind === "interaction" && item.interaction_type === "contact_action" ? crmContactActionTitle(item, metadata) : item.title;
  const outcomeForm = item.kind === "interaction" && item.interaction_type === "contact_action" && !metadata.outcome_at ? `<form class="crm-contact-outcome" data-crm-contact-outcome="${escapeHtml(item.interaction_id)}"><select name="status"><option value="sent_placed">Связь состоялась</option><option value="no_answer">Нет ответа</option><option value="follow_up_needed" selected>Нужен повторный контакт</option><option value="not_sent">Не отправлено</option></select><input name="note" maxlength="2000" placeholder="Короткая внутренняя заметка"><button type="submit" class="button ghost small">Зафиксировать</button></form>` : (metadata.outcome_note ? `<p class="crm-outcome-note">${escapeHtml(metadata.outcome_note)}</p>` : "");
  return `<article><strong>${escapeHtml(formatCrmDate(item.created_at))} · ${escapeHtml(title)}</strong>${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}${outcomeForm}</article>`;
}

function crmMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function crmContactActionTitle(item, metadata) {
  const labels = { email_sent: "Отправлено email-сообщение", call_opened: "Открыт звонок по телефону", whatsapp_draft_opened: "Открыт черновик WhatsApp" };
  const outcome = { sent_placed: " · связь состоялась", no_answer: " · нет ответа", follow_up_needed: " · нужен повторный контакт", not_sent: " · не отправлено" };
  return `${labels[metadata.action] || "Контакт с клиентом"}${outcome[metadata.status] || ""}`;
}

function crmConversationSessions(messages) {
  const gap = 45 * 60 * 1000;
  const ordered = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const sessions = [];
  ordered.forEach((message) => {
    const previous = sessions.at(-1);
    if (!previous || new Date(message.created_at) - new Date(previous.messages.at(-1).created_at) > gap) sessions.push({ messages: [message] });
    else previous.messages.push(message);
  });
  return sessions.reverse().map((session) => ({ ...session, label: `Диалог с Мирой · ${formatCrmDate(session.messages[0].created_at)}` }));
}

function crmMessageCountLabel(count) { return count === 1 ? "сообщение" : count < 5 ? "сообщения" : "сообщений"; }

function crmMessageHtml(value) {
  return escapeHtml(value || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^###\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/s, "<p>$1</p>");
}

function crmStageOptions(current) {
  return [
    ["new_lead", "Новая"],
    ["in_consultation", "Консультация"],
    ["membership_interest", "Интерес к членству"],
    ["closed_won", "Успешно"],
    ["closed_lost", "Не актуально"],
    ["archived", "Архив"],
  ]
    .map(([value, label]) => `<option value="${value}"${value === current ? " selected" : ""}>${label}</option>`)
    .join("");
}

function crmStageLabel(stage) {
  const labels = {
    new_lead: "Новая",
    in_consultation: "Консультация",
    membership_interest: "Интерес к членству",
    closed_won: "Успешно",
    closed_lost: "Не актуально",
    archived: "Архив",
  };
  return labels[stage] || stage || "";
}

function crmCustomerStatusOptions(current) {
  return [
    ["new", "Новый клиент"],
    ["active", "В работе"],
    ["waiting_for_customer", "Ждём клиента"],
    ["consultation", "Консультация"],
    ["official_step", "Официальный шаг"],
    ["closed", "Закрыт"],
  ]
    .map(([value, label]) => `<option value="${value}"${value === current ? " selected" : ""}>${label}</option>`)
    .join("");
}

function crmCustomerStatusLabel(status) {
  const labels = {
    new: "Новый клиент",
    active: "В работе",
    waiting_for_customer: "Ждём клиента",
    consultation: "Консультация",
    official_step: "Официальный шаг",
    closed: "Закрыт",
  };
  return labels[status] || status || "Новый клиент";
}

function crmLeadCountLabel(count) {
  const value = Number(count || 0);
  if (value % 10 === 1 && value % 100 !== 11) return "заявка";
  if ([2, 3, 4].includes(value % 10) && ![12, 13, 14].includes(value % 100)) return "заявки";
  return "заявок";
}

function crmAccountStatusLabel(status) {
  const labels = {
    pending_verification: "Ожидает подтверждения",
    active: "Активен",
    suspended: "Приостановлен",
    closed: "Закрыт",
  };
  return labels[status] || "Не связан с аккаунтом";
}

function crmTimelineLabel(item) {
  const labels = {
    ai_chat: "Диалог с Мирой",
    ai_feedback: "Оценка ответа Миры",
    note: "Заметка по заявке",
  };
  return labels[item.interaction_type] || item.interaction_type || "Действие";
}

function crmAuditLabel(item) {
  if (item.action === "customer_profile_updated") return "Обновлены статус отношений или ответственный.";
  if (item.action === "customer_note_added") return "Добавлена внутренняя заметка.";
  return item.action || "Изменение карточки.";
}

function crmInterestLabel(interest) {
  const labels = {
    become_travel_advantage_member: "Членство Travel Advantage",
    learn_travel_advantage: "Travel Advantage",
    learn_mwr_life: "MWR Life",
    learn_lifestyle_ambassador: "Lifestyle Ambassador",
    create_trip: "Создать поездку",
    question: "Вопрос",
  };
  return labels[interest] || interest || "";
}

function formatCrmDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

function setCrmStatus(status, message, type) {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = type;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
