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

document.querySelectorAll("form[data-travelgtc-lead-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitLeadForm(form);
  });
});

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

async function submitLeadForm(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const successMessage = form.getAttribute("data-success-message") || "Спасибо. Ваша заявка получена.";

  setFormStatus(status, "Отправляем заявку...", "pending");
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const payload = buildLeadPayload(form);
    const response = await fetch(`${getApiBaseUrl()}/api/travelgtc/v1/public/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.ok) {
      throw new Error(resolveApiErrorMessage(body, response.status));
    }

    setFormStatus(status, `${successMessage} Номер заявки: ${body.lead_id}.`, "success");
    form.reset();
    resetRoleSelector(form);
  } catch (error) {
    setFormStatus(status, error.message || "Не удалось отправить заявку. Попробуйте позже.", "error");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function buildLeadPayload(form) {
  const formData = new FormData(form);
  const get = (name) => String(formData.get(name) || "").trim();
  const defaultRole = form.getAttribute("data-default-role") || "unsure";
  const defaultInterest = form.getAttribute("data-default-interest") || "not_sure";
  const primaryInterest = get("primary_interest") || defaultInterest;
  const message = get("message") || buildMessageFromForm(formData);
  const travelFormat = get("travel_format");
  const audienceType = get("audience_type");

  return {
    name: get("name"),
    preferred_channel: get("preferred_channel") || "whatsapp",
    contact_value: get("contact_value") || get("contact"),
    declared_role: get("declared_role") || defaultRole,
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
    const value = String(formData.get(name) || "").trim();
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
    return "Приём заявок сейчас выключен. Напишите в WhatsApp, если хотите связаться сразу.";
  }
  if (code === "validation_failed") {
    return "Проверьте обязательные поля и согласия.";
  }
  if (code === "duplicate_submission") {
    return "Эта заявка уже была отправлена.";
  }
  if (code === "rate_limited") {
    return "Слишком много отправок подряд. Попробуйте немного позже.";
  }
  return `Не удалось отправить заявку. Код ответа: ${statusCode}.`;
}

function setFormStatus(status, message, type) {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = type;
}

function resetRoleSelector(form) {
  const defaultRole = form.getAttribute("data-default-role") || "unsure";
  const roleInput = form.querySelector("[data-declared-role-input]");
  if (roleInput) {
    roleInput.value = defaultRole;
  }
  form.querySelectorAll("[data-role-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.roleOption === defaultRole);
  });
}

function inferBusinessInterest(primaryInterest) {
  return primaryInterest === "business_model" ? "want_to_understand" : "none";
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
