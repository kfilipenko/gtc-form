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

  window.CPGFormLifecycle = {
    createCompletenessNavigator,
    createAutosaveController
  };
})();
