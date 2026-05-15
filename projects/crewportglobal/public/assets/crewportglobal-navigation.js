(function () {
  const SITE_ORIGIN = 'https://crewportglobal.com';

  const APPLICATION_LINKS = [
    { href: '/', key: 'nav.home', label: 'Home' },
    { href: '/vacancies/', key: 'nav.vacancies', label: 'Vacancies' },
    { href: '/create-profile/', key: 'nav.createProfile', label: 'Create Profile' },
    { href: '/post-vacancy/', key: 'nav.postVacancy', label: 'Post Vacancy' },
    { href: '/register/', key: 'nav.loginRegister', label: 'Login / Register' },
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

  function createApplicationPagesMenu() {
    return [
      '<details class="nav-menu nav-menu--application-pages">',
      '  <summary class="nav-menu__summary">',
      '    <span data-i18n="nav.functionalPages">Functional pages</span>',
      '    <span class="nav-menu__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="nav-menu__panel" data-i18n-aria-label="nav.applicationMenu">',
      createApplicationLinks('').split('\n').map((line) => `    ${line}`).join('\n'),
      '  </div>',
      '</details>',
    ].join('\n');
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
      `  ${createLink({ href: '/', key: 'nav.application', label: 'Application' }, '')}`,
      `  ${createApplicationPagesMenu().split('\n').join('\n  ')}`,
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
})();
