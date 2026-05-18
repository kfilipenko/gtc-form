(function () {
  const SITE_ORIGIN = 'https://crewportglobal.com';

  const APPLICATION_LINKS = [
    { href: '/', key: 'nav.home', label: 'Home' },
    { href: '/vacancies/', key: 'nav.vacancies', label: 'Vacancies' },
  ];

  const DOCUMENT_LINKS = [
    { href: '/for-seafarers/', key: 'nav.forSeafarers', label: 'For Seafarers' },
    { href: '/for-shipowners/', key: 'nav.forShipowners', label: 'For Employers' },
    { href: '/how-it-works/', key: 'nav.howItWorks', label: 'How It Works' },
    { href: '/legal/verification-policy/', key: 'nav.trustSafety', label: 'Trust & Safety' },
  ];

  const OPERATOR_LANES = [
    { lane: 'all', key: 'operator.lane.all', label: 'All work' },
    { lane: 'verifier', key: 'operator.role.verifier', label: 'Verifier' },
    { lane: 'reviewer', key: 'operator.role.reviewer', label: 'Reviewer' },
    { lane: 'complaint_operator', key: 'operator.role.complaintOperator', label: 'Complaint Operator' },
    { lane: 'billing_operator', key: 'operator.role.billingOperator', label: 'Billing Operator' },
    { lane: 'support_operator', key: 'operator.role.supportOperator', label: 'Support Operator' },
    { lane: 'platform_administrator', key: 'operator.role.platformAdministrator', label: 'Platform Administrator' },
  ];

  function absoluteHref(href) {
    return `${SITE_ORIGIN}${href}`;
  }

  function createLink(item, activeHref) {
    const active = activeHref && item.href === activeHref ? ' is-active' : '';
    return `<a class="nav-link${active}" href="${absoluteHref(item.href)}" data-i18n="${item.key}">${item.label}</a>`;
  }

  function createApplicationLinks(activeHref) {
    return APPLICATION_LINKS.map((item) => createLink(item, activeHref)).join('\n');
  }

  function createDocumentLinks(activeHref) {
    return DOCUMENT_LINKS.map((item) => createLink(item, activeHref)).join('\n');
  }

  function createDocumentsMenu() {
    return [
      '<details class="nav-menu nav-menu--documents">',
      '  <summary class="nav-menu__summary">',
      '    <span data-i18n="nav.documents">Documents</span>',
      '    <span class="nav-menu__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="nav-menu__panel" data-i18n-aria-label="nav.documentsMenu">',
      createDocumentLinks('').split('\n').map((line) => `    ${line}`).join('\n'),
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function createOperatorRolesMenu() {
    const laneButtons = OPERATOR_LANES.map((item) => {
      const active = item.lane === 'all' ? ' is-active' : '';
      const pressed = item.lane === 'all' ? 'true' : 'false';
      return [
        `    <button class="nav-link nav-menu__button${active}" type="button" data-operator-lane="${item.lane}" aria-pressed="${pressed}">`,
        `      <span data-i18n="${item.key}">${item.label}</span>`,
        `      <span class="operator-lane-count" data-operator-lane-count="${item.lane}" aria-hidden="true">0</span>`,
        '    </button>',
      ].join('');
    }).join('\n');

    return [
      '<details class="nav-menu nav-menu--operator-roles">',
      '  <summary class="nav-menu__summary">',
      '    <span data-i18n="operator.nav.roles">Role lanes</span>',
      '    <span class="nav-menu__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="nav-menu__panel" data-i18n-aria-label="operator.nav.rolesMenu">',
      laneButtons,
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function createPublicAppMenu() {
    return [
      '<details class="nav-menu nav-menu--application">',
      '  <summary class="nav-menu__summary">',
      '    <span data-i18n="operator.nav.publicApp">Public app</span>',
      '    <span class="nav-menu__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="nav-menu__panel" data-i18n-aria-label="operator.nav.publicAppMenu">',
      createApplicationLinks('').split('\n').map((line) => `    ${line}`).join('\n'),
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function currentDraftCabinetHref() {
    try {
      const draftId = window.localStorage.getItem('crewportglobal.registration.draft_id') || '';
      const trimmed = draftId.trim();
      return trimmed ? `/cabinet/?draft_id=${encodeURIComponent(trimmed)}` : '';
    } catch (error) {
      return '';
    }
  }

  function createAccountArea() {
    const cabinetHref = currentDraftCabinetHref();
    const cabinetLink = cabinetHref
      ? `<a class="cpg-account__action cpg-account__action--secondary" href="${absoluteHref(cabinetHref)}" data-i18n="account.currentCabinet">Current cabinet</a>`
      : '';

    return [
      '<details class="cpg-account" data-cpg-account-menu>',
      '  <summary class="cpg-account__summary">',
      '    <span class="cpg-account__label" data-i18n="account.entry">Account / Login</span>',
      '    <span class="cpg-account__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="cpg-account__panel">',
      '    <a class="cpg-account__action" href="https://crewportglobal.com/register/" data-i18n="account.register">Registration</a>',
      '    <button class="cpg-account__action cpg-account__action--secondary" type="button" data-cpg-login-shell-toggle data-i18n="account.login">Login</button>',
      cabinetLink ? `    ${cabinetLink}` : '',
      '    <div class="cpg-account__login-shell" data-cpg-login-shell hidden>',
      '      <strong data-i18n="account.loginUnavailableTitle">Password login is not enabled yet.</strong>',
      '      <p data-i18n="account.loginUnavailableCopy">Registration and cabinet access currently continue through the registration draft context. Real password login requires the next authentication implementation slice.</p>',
      '      <label class="cpg-account__field">',
      '        <span data-i18n="account.email">Email</span>',
      '        <input type="email" autocomplete="email" disabled placeholder="name@example.com">',
      '      </label>',
      '      <label class="cpg-account__field">',
      '        <span data-i18n="account.password">Password</span>',
      '        <input type="password" autocomplete="current-password" disabled placeholder="••••••••">',
      '      </label>',
      '    </div>',
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function bindAccountArea(root) {
    const toggle = root.querySelector('[data-cpg-login-shell-toggle]');
    const shell = root.querySelector('[data-cpg-login-shell]');
    if (toggle && shell) {
      toggle.addEventListener('click', () => {
        shell.hidden = !shell.hidden;
      });
    }

    root.querySelectorAll('.cpg-account__action[href]').forEach((link) => {
      link.addEventListener('click', () => {
        const menu = root.querySelector('[data-cpg-account-menu]');
        if (menu) {
          menu.open = false;
        }
      });
    });
  }

  function renderAccountArea(mount) {
    mount.innerHTML = createAccountArea();
    bindAccountArea(mount);
  }

  function ensureHeaderActions(header) {
    let actions = header.querySelector(':scope > .site-header__actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'site-header__actions';
      const languageSelector = header.querySelector(':scope > .language-selector');
      if (languageSelector) {
        header.insertBefore(actions, languageSelector);
        actions.appendChild(languageSelector);
      } else {
        header.appendChild(actions);
      }
    }

    return actions;
  }

  function renderHeaderAccountAreas() {
    document.querySelectorAll('[data-cpg-account-area]').forEach(renderAccountArea);

    document.querySelectorAll('.site-header').forEach((header) => {
      if (header.querySelector('.cpg-account') || header.querySelector('[data-cpg-account-area]')) {
        return;
      }

      const actions = ensureHeaderActions(header);
      const mount = document.createElement('div');
      mount.setAttribute('data-cpg-account-area', '');
      actions.appendChild(mount);
      renderAccountArea(mount);
    });
  }

  function createReferenceDocumentsMenu() {
    return [
      '<details class="nav-menu nav-menu--documents">',
      '  <summary class="nav-menu__summary">',
      '    <span data-i18n="operator.nav.documents">Reference documents</span>',
      '    <span class="nav-menu__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="nav-menu__panel" data-i18n-aria-label="operator.nav.documentsMenu">',
      createDocumentLinks('').split('\n').map((line) => `    ${line}`).join('\n'),
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function renderApplicationNav(activeHref) {
    return [
      '<nav class="site-nav site-nav--application" aria-label="Application navigation" data-i18n-aria-label="nav.applicationMenu">',
      createApplicationLinks(activeHref).split('\n').map((line) => `  ${line}`).join('\n'),
      `  ${createDocumentsMenu().split('\n').join('\n  ')}`,
      '</nav>',
    ].join('\n');
  }

  function renderDocumentsNav(activeHref) {
    return [
      '<nav class="site-nav site-nav--documents" aria-label="Document navigation" data-i18n-aria-label="nav.documentsMenu">',
      createApplicationLinks('').split('\n').map((line) => `  ${line}`).join('\n'),
      '  <span class="nav-section-label" data-i18n="nav.documents">Documents</span>',
      createDocumentLinks(activeHref).split('\n').map((line) => `  ${line}`).join('\n'),
      '</nav>',
    ].join('\n');
  }

  function renderOperatorNav() {
    return [
      '<nav class="site-nav site-nav--operator" aria-label="Operator portal navigation" data-i18n-aria-label="operator.nav.menu">',
      '  <a class="nav-link is-active" href="https://crewportglobal.com/verify/" data-i18n="verify.nav.queue">Operator Queue</a>',
      `  ${createOperatorRolesMenu().split('\n').join('\n  ')}`,
      `  ${createPublicAppMenu().split('\n').join('\n  ')}`,
      `  ${createReferenceDocumentsMenu().split('\n').join('\n  ')}`,
      '</nav>',
    ].join('\n');
  }

  function renderNavigation(mount) {
    const type = mount.dataset.cpgNavigation;
    const activeHref = mount.dataset.cpgNavActive || '';
    if (type === 'application') {
      mount.innerHTML = renderApplicationNav(activeHref);
      return;
    }
    if (type === 'documents') {
      mount.innerHTML = renderDocumentsNav(activeHref);
      return;
    }
    if (type === 'operator') {
      mount.innerHTML = renderOperatorNav();
    }
  }

  document.querySelectorAll('[data-cpg-navigation]').forEach(renderNavigation);
  renderHeaderAccountAreas();
})();
