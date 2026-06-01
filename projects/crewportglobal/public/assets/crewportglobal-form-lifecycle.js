(function () {
  function normalizePath(path) {
    const value = typeof path === 'string' && path ? path : '/';
    return value.endsWith('/') ? value : `${value}/`;
  }

  function fieldCodeFor(item) {
    return item && typeof item.field_code === 'string' ? item.field_code : '';
  }

  function targetUrlFor(item) {
    return item && typeof item.target_url === 'string' ? item.target_url : '';
  }

  function labelFor(item) {
    return item && typeof item.label === 'string' ? item.label : '';
  }

  function createCompletenessNavigator(config) {
    const options = config || {};
    const doc = options.document || document;
    const missingClass = options.missingClass || 'is-completeness-missing';
    const fieldCardSelector = options.fieldCardSelector || '.field-card';
    const sectionTabSelector = options.sectionTabSelector || '.section-tab';
    const sectionTabTargetAttribute = options.sectionTabTargetAttribute || 'data-section-target';
    const fieldTargets = options.fieldTargets || {};
    const sectionTargets = options.sectionTargets || {};
    const getDraftId = typeof options.getDraftId === 'function' ? options.getDraftId : () => '';
    const defaultPath = normalizePath(options.defaultPath || window.location.pathname || '/');
    const targetPathResolver = typeof options.targetPathResolver === 'function'
      ? options.targetPathResolver
      : () => defaultPath;
    const fallbackLabel = typeof options.fallbackLabel === 'function'
      ? options.fallbackLabel
      : () => 'Open section';

    function clearHighlights() {
      doc.querySelectorAll(`.${missingClass}`).forEach((element) => {
        element.classList.remove(missingClass);
      });
    }

    function openSection(targetId) {
      if (!targetId) {
        return;
      }
      const target = doc.getElementById(targetId);
      if (!target) {
        return;
      }
      doc.querySelectorAll(sectionTabSelector).forEach((item) => {
        item.classList.toggle('is-current', item.getAttribute(sectionTabTargetAttribute) === targetId);
      });
      if (target instanceof HTMLDetailsElement) {
        target.open = true;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
    }

    function sectionIdForMissingItem(item) {
      const fieldCode = fieldCodeFor(item);
      if (fieldCode && sectionTargets[fieldCode]) {
        return sectionTargets[fieldCode];
      }
      const targetUrl = targetUrlFor(item);
      const hash = targetUrl.includes('#') ? targetUrl.split('#').pop() : '';
      return hash ? decodeURIComponent(hash) : '';
    }

    function pathWithDraftId(path) {
      const draftId = getDraftId();
      return draftId ? `${path}?draft_id=${encodeURIComponent(draftId)}` : path;
    }

    function hrefForMissingItem(item) {
      const sectionId = sectionIdForMissingItem(item);
      const targetPath = normalizePath(targetPathResolver(item) || defaultPath);
      const basePath = pathWithDraftId(targetPath);
      return `${basePath}${sectionId ? `#${encodeURIComponent(sectionId)}` : ''}`;
    }

    function isCurrentPageHref(href) {
      try {
        const target = new URL(href, window.location.origin);
        const currentPath = window.location.pathname.replace(/\/$/, '');
        const targetPath = target.pathname.replace(/\/$/, '');
        return currentPath === targetPath;
      } catch (error) {
        return true;
      }
    }

    function labelForMissingItem(item) {
      const fieldCode = fieldCodeFor(item);
      const label = labelFor(item);
      if (fieldCode && label) {
        return `${fieldCode}: ${label}`;
      }
      return fieldCode || label || fallbackLabel();
    }

    function applyHighlights(missingItems) {
      clearHighlights();
      const sectionIds = new Set();
      (missingItems || []).forEach((item) => {
        const fieldCode = fieldCodeFor(item);
        const targetIds = fieldTargets[fieldCode] || [];
        targetIds.forEach((targetId) => {
          const field = doc.getElementById(targetId);
          const card = field ? field.closest(fieldCardSelector) : null;
          if (card) {
            card.classList.add(missingClass);
          }
        });
        const sectionId = sectionIdForMissingItem(item);
        if (sectionId) {
          sectionIds.add(sectionId);
        }
      });

      sectionIds.forEach((sectionId) => {
        const section = doc.getElementById(sectionId);
        if (section) {
          section.classList.add(missingClass);
        }
        doc.querySelectorAll(sectionTabSelector).forEach((button) => {
          if (button.getAttribute(sectionTabTargetAttribute) === sectionId) {
            button.classList.add(missingClass);
          }
        });
      });
    }

    function renderMissingList(listNode, missingItems, emptyText) {
      if (!listNode) {
        return;
      }
      listNode.innerHTML = '';
      applyHighlights(missingItems || []);

      if (!missingItems || missingItems.length === 0) {
        const item = doc.createElement('li');
        item.textContent = emptyText || '';
        listNode.appendChild(item);
        return;
      }

      missingItems.forEach((entry) => {
        const item = doc.createElement('li');
        const link = doc.createElement('a');
        const href = hrefForMissingItem(entry);
        link.href = href;
        link.textContent = labelForMissingItem(entry);
        link.addEventListener('click', (event) => {
          if (!isCurrentPageHref(href)) {
            return;
          }
          event.preventDefault();
          const sectionId = sectionIdForMissingItem(entry);
          if (sectionId) {
            window.history.replaceState(null, '', href);
            openSection(sectionId);
          }
        });
        item.appendChild(link);
        listNode.appendChild(item);
      });
    }

    return {
      clearHighlights,
      openSection,
      sectionIdForMissingItem,
      hrefForMissingItem,
      isCurrentPageHref,
      labelForMissingItem,
      applyHighlights,
      renderMissingList
    };
  }

  function createAutosaveController(config) {
    const options = config || {};
    const delayMs = Number.isFinite(Number(options.delayMs)) ? Number(options.delayMs) : 1000;
    const canRun = typeof options.canRun === 'function' ? options.canRun : () => true;
    const run = typeof options.run === 'function' ? options.run : async () => {};
    let timer = null;
    let inFlight = false;
    let pending = false;

    function cancel() {
      window.clearTimeout(timer);
      timer = null;
      pending = false;
    }

    function schedule() {
      window.clearTimeout(timer);
      if (!canRun()) {
        return;
      }
      if (inFlight) {
        pending = true;
        return;
      }

      timer = window.setTimeout(async () => {
        inFlight = true;
        pending = false;
        try {
          await run();
        } finally {
          inFlight = false;
          if (pending) {
            schedule();
          }
        }
      }, delayMs);
    }

    return {
      schedule,
      cancel,
      isInFlight: () => inFlight,
      hasPending: () => pending
    };
  }

  const ignoredLanguageGuardInputTypes = new Set([
    'button',
    'checkbox',
    'color',
    'date',
    'datetime-local',
    'email',
    'file',
    'hidden',
    'month',
    'number',
    'password',
    'radio',
    'range',
    'reset',
    'submit',
    'tel',
    'time',
    'url',
    'week'
  ]);

  function isTextEntryControl(control) {
    if (control instanceof HTMLTextAreaElement) {
      return true;
    }
    if (!(control instanceof HTMLInputElement)) {
      return false;
    }
    const type = (control.getAttribute('type') || 'text').toLowerCase();
    return !ignoredLanguageGuardInputTypes.has(type);
  }

  function containsNonLatinLetters(value) {
    const source = typeof value === 'string' ? value : '';
    for (const character of source) {
      if (/\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character)) {
        return true;
      }
    }
    return false;
  }

  function removeNonLatinLetters(value) {
    return String(value || '').replace(/\p{L}/gu, (character) => (
      /\p{Script=Latin}/u.test(character) ? character : ''
    ));
  }

  function createLanguageInputGuard(config) {
    const options = config || {};
    const root = options.root || document;
    const doc = options.document || document;
    const invalidClass = options.invalidClass || 'is-language-invalid';
    const fieldCardSelector = options.fieldCardSelector || '.field-card';
    const statusNode = options.statusNode || null;
    const message = typeof options.message === 'function'
      ? options.message
      : () => (options.message || 'Use English and Latin characters in form fields.');
    const onInvalid = typeof options.onInvalid === 'function' ? options.onInvalid : null;

    function controls() {
      return Array.from(root.querySelectorAll('input, textarea')).filter(isTextEntryControl);
    }

    function cardFor(control) {
      return control ? control.closest(fieldCardSelector) : null;
    }

    function reportInvalid(control) {
      const text = message(control);
      if (statusNode) {
        statusNode.removeAttribute('data-i18n');
        statusNode.textContent = text;
      }
      if (onInvalid) {
        onInvalid({ control, message: text });
      }
    }

    function markControl(control) {
      const invalid = containsNonLatinLetters(control.value);
      const card = cardFor(control);
      if (card) {
        card.classList.toggle(invalidClass, invalid);
      }
      control.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      return invalid;
    }

    function markInvalidFields() {
      return controls().filter((control) => markControl(control));
    }

    function validate(validateOptions) {
      const validateConfig = validateOptions || {};
      const invalidControls = markInvalidFields();
      if (invalidControls.length === 0) {
        return true;
      }
      const firstInvalid = invalidControls[0];
      reportInvalid(firstInvalid);
      if (validateConfig.focus !== false && typeof firstInvalid.focus === 'function') {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    function handleBeforeInput(event) {
      const data = typeof event.data === 'string' ? event.data : '';
      if (!data || !containsNonLatinLetters(data)) {
        return;
      }
      event.preventDefault();
      markControl(event.currentTarget);
      reportInvalid(event.currentTarget);
    }

    function handlePaste(event) {
      const control = event.currentTarget;
      const text = event.clipboardData ? event.clipboardData.getData('text') : '';
      if (!containsNonLatinLetters(text)) {
        return;
      }
      event.preventDefault();
      const sanitized = removeNonLatinLetters(text);
      if (sanitized && typeof control.setRangeText === 'function') {
        const start = Number.isInteger(control.selectionStart) ? control.selectionStart : control.value.length;
        const end = Number.isInteger(control.selectionEnd) ? control.selectionEnd : control.value.length;
        control.setRangeText(sanitized, start, end, 'end');
        control.dispatchEvent(new Event('input', { bubbles: true }));
      }
      markControl(control);
      reportInvalid(control);
    }

    function handleInput(event) {
      markControl(event.currentTarget);
    }

    function attach() {
      controls().forEach((control) => {
        if (control.dataset.cpgLanguageGuardAttached === 'true') {
          return;
        }
        control.dataset.cpgLanguageGuardAttached = 'true';
        control.addEventListener('beforeinput', handleBeforeInput);
        control.addEventListener('paste', handlePaste);
        control.addEventListener('input', handleInput);
        control.addEventListener('change', handleInput);
        markControl(control);
      });
    }

    attach();

    return {
      attach,
      validate,
      markInvalidFields,
      hasInvalidText: () => markInvalidFields().length > 0,
      sanitizeText: removeNonLatinLetters,
      containsInvalidText: containsNonLatinLetters,
      document: doc
    };
  }

  window.CPGFormLifecycle = {
    createCompletenessNavigator,
    createAutosaveController,
    createLanguageInputGuard
  };
})();
