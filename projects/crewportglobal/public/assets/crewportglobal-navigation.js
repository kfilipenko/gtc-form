(function () {
  const SITE_ORIGIN = 'https://crewportglobal.com';

  const APPLICATION_LINKS = [
    { href: '/', key: 'nav.home', label: 'Home' },
    { href: '/vacancies/', key: 'nav.vacancies', label: 'Vacancies' },
  ];

  const DOCUMENT_LINKS = [
    { href: '/legal/terms/', key: 'nav.terms', label: 'Terms' },
    { href: '/legal/privacy/', key: 'nav.privacy', label: 'Privacy' },
    { href: '/legal/no-recruitment-fees/', key: 'nav.noRecruitmentFees', label: 'No Recruitment Fees' },
    { href: '/legal/seafarer-candidate-agreement/', key: 'nav.seafarerAgreement', label: 'Seafarer Agreement' },
    { href: '/legal/shipowner-service-terms/', key: 'nav.shipownerAgreement', label: 'Shipowner Agreement' },
    { href: '/legal/recruitment-and-matching-policy/', key: 'nav.matchingPolicy', label: 'Matching Policy' },
    { href: '/legal/verification-policy/', key: 'nav.verificationPolicy', label: 'Verification Policy' },
    { href: '/legal/complaints/', key: 'nav.complaints', label: 'Complaints' },
  ];

  const SITE_MENU_GROUPS = [
    {
      className: 'home',
      key: 'nav.homeGroup',
      label: 'Home',
      menuKey: 'nav.homeGroupMenu',
      hintKey: 'nav.homeGroupHint',
      hint: 'Open the main public page with live registry indicators and BP-015 cycle.',
      links: [
        { href: '/', key: 'nav.home', label: 'Home', hintKey: 'nav.homeHint', hint: 'Main public entry page.' },
      ],
    },
    {
      className: 'seafarers',
      key: 'nav.seafarerPages',
      label: 'Seafarers',
      menuKey: 'nav.seafarerPagesMenu',
      hintKey: 'nav.seafarerPagesHint',
      hint: 'Actions for seafarer profile completion and reviewed vacancy access.',
      links: [
        { href: '/create-profile/', key: 'nav.createProfile', label: 'Create Profile', hint: 'Complete the seafarer profile and documents.' },
        { href: '/vacancies/', key: 'nav.vacancies', label: 'Vacancies', hint: 'Open reviewed vacancy information.' },
      ],
    },
    {
      className: 'employers',
      key: 'nav.employerPages',
      label: 'Employers',
      menuKey: 'nav.employerPagesMenu',
      hintKey: 'nav.employerPagesHint',
      hint: 'Actions for employer registration, vessel data and crew requests.',
      links: [
        { href: '/for-shipowners/', key: 'nav.forShipowners', label: 'For Employers', hint: 'Employer service entry page.' },
        { href: '/post-vacancy/', key: 'nav.postVacancy', label: 'Post Vacancy', hint: 'Add company, vessel and crew request data.' },
      ],
    },
    {
      className: 'documents',
      key: 'nav.documents',
      label: 'Documents',
      menuKey: 'nav.documentsMenu',
      hintKey: 'nav.documentsHint',
      hint: 'Open legal, trust and policy documents.',
      links: [
        { href: '/legal/terms/', key: 'nav.terms', label: 'Terms', hint: 'Platform terms.' },
        { href: '/legal/privacy/', key: 'nav.privacy', label: 'Privacy', hint: 'Privacy policy.' },
        { href: '/legal/no-recruitment-fees/', key: 'nav.noRecruitmentFees', label: 'No Recruitment Fees', hint: 'No-fee rule for seafarers.' },
        { href: '/legal/seafarer-candidate-agreement/', key: 'nav.seafarerAgreement', label: 'Seafarer Agreement', hint: 'Candidate agreement.' },
        { href: '/legal/shipowner-service-terms/', key: 'nav.shipownerAgreement', label: 'Shipowner Agreement', hint: 'B2B service terms.' },
        { href: '/legal/recruitment-and-matching-policy/', key: 'nav.matchingPolicy', label: 'Matching Policy', hint: 'Human-reviewed matching policy.' },
        { href: '/legal/verification-policy/', key: 'nav.verificationPolicy', label: 'Verification Policy', hint: 'Verification policy.' },
        { href: '/legal/complaints/', key: 'nav.complaints', label: 'Complaints', hint: 'Complaint handling procedure.' },
      ],
    },
    {
      className: 'team',
      key: 'nav.teamPages',
      label: 'Team',
      menuKey: 'nav.teamPagesMenu',
      hintKey: 'nav.teamPagesHint',
      hint: 'Protected team workspaces for computed tasks and operations.',
      links: [
        { href: '/team/', key: 'nav.teamPortal', label: 'Team Portal', hint: 'Computed team task list.' },
        { href: '/team/documents/', key: 'nav.teamDocuments', label: 'Team Documents', hint: 'Protected document review.' },
        { href: '/team/matching/', key: 'nav.teamMatching', label: 'Request-Supply Comparison', hint: 'Compare crew request and candidate supply.' },
        { href: '/team/registry/', key: 'nav.teamRegistry', label: 'Registry Detail', hint: 'Safe internal registry view.' },
        { href: '/team/shortlists/', key: 'nav.teamShortlists', label: 'Shortlist Drafts', hint: 'Internal shortlist drafts.' },
        { href: '/team/translations/', key: 'nav.teamTranslations', label: 'Translation Review', hint: 'Sensitive machine translation review queue.' },
        { href: '/verify/', key: 'nav.operatorQueue', label: 'Operator Queue', hint: 'Operator workbench.' },
        { href: '/admin/access/', key: 'nav.adminAccess', label: 'Access Admin', hint: 'Protected access administration.' },
      ],
    },
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

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function titleAttributes(item) {
    const titleKey = item.hintKey || item.key;
    const title = item.hint || item.label;
    return ` title="${escapeAttribute(title)}" data-i18n-title="${titleKey}"`;
  }

  function createLink(item, activeHref) {
    const active = activeHref && item.href === activeHref ? ' is-active' : '';
    return `<a class="nav-link${active}" href="${absoluteHref(item.href)}" data-i18n="${item.key}"${titleAttributes(item)}>${item.label}</a>`;
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

  function createSiteMenuGroup(group, activeHref) {
    const isActive = group.links.some((item) => item.href === activeHref);
    const active = isActive ? ' is-active' : '';
    if (group.links.length === 1) {
      const item = group.links[0];
      return `<a class="nav-link site-menu-group-link site-menu-group-link--${group.className}${active}" href="${absoluteHref(item.href)}" data-i18n="${group.key}"${titleAttributes(group)}>${group.label}</a>`;
    }

    return [
      `<details class="nav-menu nav-menu--site-group nav-menu--${group.className}">`,
      `  <summary class="nav-menu__summary${active}"${titleAttributes(group)} aria-label="${escapeAttribute(group.label)}" data-i18n-aria-label="${group.menuKey}">`,
      `    <span data-i18n="${group.key}">${group.label}</span>`,
      '    <span class="nav-menu__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      `  <div class="nav-menu__panel" data-i18n-aria-label="${group.menuKey}">`,
      group.links.map((item) => createLink(item, activeHref)).join('\n').split('\n').map((line) => `    ${line}`).join('\n'),
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function createSiteMenuGroups(activeHref) {
    return [
      '<div class="site-map-nav" data-i18n-aria-label="nav.fullSiteMenu">',
      SITE_MENU_GROUPS.map((group) => createSiteMenuGroup(group, activeHref)).join('\n').split('\n').map((line) => `  ${line}`).join('\n'),
      '</div>',
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

  const ACCOUNT_LABELS = {
    en: {
      entry: 'Account / Login',
      register: 'Registration',
      login: 'Login',
      currentCabinet: 'Current cabinet',
      email: 'Email',
      password: 'Password',
      loginSubmit: 'Log in',
      loginPreparing: 'Checking credentials...',
      loginFailed: 'Invalid email or password.',
      myCabinet: 'My Cabinet',
      profileSettings: 'Profile settings',
      logout: 'Logout',
      loggingOut: 'Signing out...',
      avatarLabel: 'Profile menu',
      verifiedEmail: 'Verified email',
      emailNotVerified: 'Email not verified',
      theme: 'Theme',
      themeAuto: 'Auto',
      themeDark: 'Dark',
      themeLight: 'Light'
    },
    ru: {
      entry: 'Аккаунт / Войти',
      register: 'Регистрация',
      login: 'Вход',
      currentCabinet: 'Текущий кабинет',
      email: 'Email',
      password: 'Пароль',
      loginSubmit: 'Войти',
      loginPreparing: 'Проверяем данные...',
      loginFailed: 'Неверный email или пароль.',
      myCabinet: 'Мой кабинет',
      profileSettings: 'Настройки профиля',
      logout: 'Выйти',
      loggingOut: 'Выходим...',
      avatarLabel: 'Меню профиля',
      verifiedEmail: 'Email подтверждён',
      emailNotVerified: 'Email не подтверждён',
      theme: 'Тема',
      themeAuto: 'Авто',
      themeDark: 'Тёмная',
      themeLight: 'Светлая'
    },
    pt: {
      entry: 'Conta / Entrar',
      register: 'Registar',
      login: 'Entrar',
      currentCabinet: 'Gabinete atual',
      email: 'Email',
      password: 'Senha',
      loginSubmit: 'Entrar',
      loginPreparing: 'A verificar credenciais...',
      loginFailed: 'Email ou senha invalidos.',
      myCabinet: 'Meu gabinete',
      profileSettings: 'Definicoes do perfil',
      logout: 'Sair',
      loggingOut: 'A terminar sessao...',
      avatarLabel: 'Menu do perfil',
      verifiedEmail: 'Email verificado',
      emailNotVerified: 'Email nao verificado',
      theme: 'Tema',
      themeAuto: 'Auto',
      themeDark: 'Escuro',
      themeLight: 'Claro'
    }
  };

  const THEME_STORAGE_KEY = 'crewportglobal.theme.mode';
  const THEME_MODES = ['auto', 'dark', 'light'];

  let themeMode = readThemeMode();

  let accountState = {
    loaded: false,
    authenticated: false,
    user: null,
    draft: null
  };

  applyThemeMode(themeMode);

  function accountLanguage() {
    const language = document.documentElement.lang || 'en';
    return ACCOUNT_LABELS[language] ? language : 'en';
  }

  function accountLabel(key) {
    const language = accountLanguage();
    return ACCOUNT_LABELS[language][key] || ACCOUNT_LABELS.en[key] || key;
  }

  function readThemeMode() {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      return THEME_MODES.includes(stored) ? stored : 'dark';
    } catch (error) {
      return 'dark';
    }
  }

  function systemTheme() {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function resolvedTheme(mode) {
    return mode === 'auto' ? systemTheme() : mode;
  }

  function applyThemeMode(mode) {
    const normalized = THEME_MODES.includes(mode) ? mode : 'dark';
    const resolved = resolvedTheme(normalized);
    document.documentElement.dataset.cpgThemeMode = normalized;
    document.documentElement.dataset.cpgTheme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }

  function setThemeMode(mode) {
    themeMode = THEME_MODES.includes(mode) ? mode : 'dark';
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (error) {
      // Theme choice still applies for the current page when local storage is unavailable.
    }
    applyThemeMode(themeMode);
    renderAllThemeSwitchers();
    window.dispatchEvent(new CustomEvent('crewportglobal:themechange', {
      detail: {
        mode: themeMode,
        theme: resolvedTheme(themeMode)
      }
    }));
  }

  function themeModeLabel(mode) {
    if (mode === 'auto') {
      return accountLabel('themeAuto');
    }
    if (mode === 'light') {
      return accountLabel('themeLight');
    }
    return accountLabel('themeDark');
  }

  function createThemeSwitcher() {
    const buttons = THEME_MODES.map((mode) => {
      const active = mode === themeMode ? ' is-active' : '';
      const pressed = mode === themeMode ? 'true' : 'false';
      return `<button class="cpg-theme-option${active}" type="button" data-cpg-theme-mode="${mode}" aria-pressed="${pressed}">${themeModeLabel(mode)}</button>`;
    }).join('\n');

    return [
      '<details class="cpg-theme-switcher" data-cpg-theme-switcher-menu>',
      '  <summary class="cpg-theme-switcher__summary">',
      `    <span class="cpg-theme-switcher__label">${accountLabel('theme')}</span>`,
      `    <span class="cpg-theme-switcher__value">${themeModeLabel(themeMode)}</span>`,
      '    <span class="cpg-theme-switcher__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="cpg-theme-switcher__panel">',
      buttons.split('\n').map((line) => `    ${line}`).join('\n'),
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bindThemeSwitcher(root) {
    root.querySelectorAll('[data-cpg-theme-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        setThemeMode(button.dataset.cpgThemeMode || 'dark');
        const menu = root.querySelector('[data-cpg-theme-switcher-menu]');
        if (menu) {
          menu.open = false;
        }
      });
    });
  }

  function renderThemeSwitcher(mount) {
    mount.innerHTML = createThemeSwitcher();
    bindThemeSwitcher(mount);
  }

  function renderAllThemeSwitchers() {
    document.querySelectorAll('[data-cpg-theme-switcher]').forEach(renderThemeSwitcher);
  }

  function accountDisplayName(user) {
    if (!user || typeof user !== 'object') {
      return accountLabel('entry');
    }

    const displayName = typeof user.display_name === 'string' ? user.display_name.trim() : '';
    const email = typeof user.email === 'string' ? user.email.trim() : '';
    return displayName || email || accountLabel('avatarLabel');
  }

  function accountInitials(user) {
    const source = accountDisplayName(user);
    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'CPG';
  }

  function accountProfilePhotoUrl(user) {
    if (!user || typeof user !== 'object' || !user.profile_photo || typeof user.profile_photo !== 'object') {
      return '';
    }

    const imageUrl = typeof user.profile_photo.image_url === 'string' ? user.profile_photo.image_url.trim() : '';
    return imageUrl.startsWith('/api/v1/user/profile-photo/image') ? imageUrl : '';
  }

  function accountAvatarMarkup(user) {
    const imageUrl = accountProfilePhotoUrl(user);
    if (imageUrl) {
      return `<span class="cpg-account__avatar has-image" aria-hidden="true"><img src="${escapeHtml(imageUrl)}" alt=""></span>`;
    }

    return `<span class="cpg-account__avatar" aria-hidden="true">${escapeHtml(accountInitials(user))}</span>`;
  }

  function persistAuthDraft(draft) {
    if (!draft || typeof draft !== 'object') {
      return;
    }

    try {
      if (typeof draft.draft_id === 'string' && draft.draft_id) {
        window.localStorage.setItem('crewportglobal.registration.draft_id', draft.draft_id);
      }
      if (typeof draft.role === 'string' && draft.role) {
        window.localStorage.setItem('crewportglobal.registration.role', draft.role === 'crewing_manager' ? 'crewing-manager' : draft.role);
      }
      if (typeof draft.email === 'string' && draft.email) {
        window.localStorage.setItem('crewportglobal.registration.email', draft.email);
      }
      window.localStorage.setItem('crewportglobal.registration.last_response', JSON.stringify(draft));
    } catch (error) {
      // Local draft persistence is a convenience fallback; authenticated session remains canonical.
    }
  }

  async function fetchAccountState() {
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body && body.authenticated === true) {
        accountState = {
          loaded: true,
          authenticated: true,
          user: body.user || null,
          draft: body.draft || null
        };
        persistAuthDraft(body.draft || null);
        return;
      }
    } catch (error) {
      // Keep the public account entry usable when auth/me is unavailable.
    }

    accountState = {
      loaded: true,
      authenticated: false,
      user: null,
      draft: null
    };
  }

  function createAuthenticatedAccountArea() {
    const user = accountState.user || {};
    const display = accountDisplayName(user);
    const emailVerified = user.email_verified === true;
    const verificationLabel = emailVerified ? accountLabel('verifiedEmail') : accountLabel('emailNotVerified');
    const verificationClass = emailVerified ? ' is-verified' : ' is-unverified';

    return [
      '<details class="cpg-account is-authenticated" data-cpg-account-menu>',
      '  <summary class="cpg-account__summary">',
      `    ${accountAvatarMarkup(user)}`,
      `    <span class="cpg-account__label">${escapeHtml(display)}</span>`,
      `    <span class="cpg-account__email-status${verificationClass}">${verificationLabel}</span>`,
      '    <span class="cpg-account__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="cpg-account__panel">',
      `    <a class="cpg-account__action" href="${absoluteHref('/cabinet/')}">${accountLabel('myCabinet')}</a>`,
      `    <a class="cpg-account__action cpg-account__action--secondary" href="${absoluteHref('/cabinet/#profile')}">${accountLabel('profileSettings')}</a>`,
      `    <button class="cpg-account__action cpg-account__action--danger" type="button" data-cpg-logout>${accountLabel('logout')}</button>`,
      '    <p class="cpg-account__status" data-cpg-auth-status></p>',
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function createUnauthenticatedAccountArea() {
    const cabinetHref = currentDraftCabinetHref();
    const cabinetLink = cabinetHref
      ? `<a class="cpg-account__action cpg-account__action--secondary" href="${absoluteHref(cabinetHref)}">${accountLabel('currentCabinet')}</a>`
      : '';

    return [
      '<details class="cpg-account" data-cpg-account-menu>',
      '  <summary class="cpg-account__summary">',
      `    <span class="cpg-account__label">${accountLabel('entry')}</span>`,
      '    <span class="cpg-account__chevron" aria-hidden="true">▾</span>',
      '  </summary>',
      '  <div class="cpg-account__panel">',
      `    <a class="cpg-account__action" href="https://crewportglobal.com/register/">${accountLabel('register')}</a>`,
      `    <button class="cpg-account__action cpg-account__action--secondary" type="button" data-cpg-login-shell-toggle>${accountLabel('login')}</button>`,
      cabinetLink ? `    ${cabinetLink}` : '',
      '    <div class="cpg-account__login-shell" data-cpg-login-shell hidden>',
      '      <form class="cpg-account__login-form" data-cpg-login-form>',
      '        <label class="cpg-account__field">',
      `          <span>${accountLabel('email')}</span>`,
      '          <input type="email" autocomplete="email" name="email" placeholder="name@example.com" required>',
      '        </label>',
      '        <label class="cpg-account__field">',
      `          <span>${accountLabel('password')}</span>`,
      '          <input type="password" autocomplete="current-password" name="password" placeholder="••••••••" required>',
      '        </label>',
      `        <button class="cpg-account__action" type="submit">${accountLabel('loginSubmit')}</button>`,
      '        <p class="cpg-account__status" data-cpg-auth-status></p>',
      '      </form>',
      '    </div>',
      '  </div>',
      '</details>',
    ].join('\n');
  }

  function createAccountArea() {
    return accountState.authenticated ? createAuthenticatedAccountArea() : createUnauthenticatedAccountArea();
  }

  function renderAllAccountAreas() {
    document.querySelectorAll('[data-cpg-account-area]').forEach(renderAccountArea);
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

    const form = root.querySelector('[data-cpg-login-form]');
    const status = root.querySelector('[data-cpg-auth-status]');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const email = form.elements.email ? form.elements.email.value.trim() : '';
        const password = form.elements.password ? form.elements.password.value : '';
        if (status) {
          status.textContent = accountLabel('loginPreparing');
          status.classList.remove('is-error');
        }
        if (submit) {
          submit.disabled = true;
        }

        try {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || body.authenticated !== true) {
            throw new Error('invalid_login');
          }
          accountState = {
            loaded: true,
            authenticated: true,
            user: body.user || null,
            draft: body.draft || null
          };
          persistAuthDraft(body.draft || null);
          window.dispatchEvent(new CustomEvent('crewportglobal:authchanged', { detail: accountState }));
          window.location.assign(body.next_url || '/cabinet/');
        } catch (error) {
          if (status) {
            status.textContent = accountLabel('loginFailed');
            status.classList.add('is-error');
          }
        } finally {
          if (submit) {
            submit.disabled = false;
          }
        }
      });
    }

    const logout = root.querySelector('[data-cpg-logout]');
    if (logout) {
      logout.addEventListener('click', async () => {
        const status = root.querySelector('[data-cpg-auth-status]');
        logout.disabled = true;
        if (status) {
          status.textContent = accountLabel('loggingOut');
          status.classList.remove('is-error');
        }
        try {
          await fetch('/api/v1/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
        } finally {
          accountState = {
            loaded: true,
            authenticated: false,
            user: null,
            draft: null
          };
          renderAllAccountAreas();
          window.dispatchEvent(new CustomEvent('crewportglobal:authchanged', { detail: accountState }));
        }
      });
    }
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

  function renderHeaderThemeSwitchers() {
    document.querySelectorAll('[data-cpg-theme-switcher]').forEach(renderThemeSwitcher);

    document.querySelectorAll('.site-header').forEach((header) => {
      if (header.querySelector('.cpg-theme-switcher') || header.querySelector('[data-cpg-theme-switcher]')) {
        return;
      }

      const actions = ensureHeaderActions(header);
      const mount = document.createElement('div');
      mount.setAttribute('data-cpg-theme-switcher', '');
      const languageSelector = actions.querySelector(':scope > .language-selector');
      if (languageSelector) {
        actions.insertBefore(mount, languageSelector);
      } else {
        actions.appendChild(mount);
      }
      renderThemeSwitcher(mount);
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
      createSiteMenuGroups(activeHref).split('\n').map((line) => `  ${line}`).join('\n'),
      '</nav>',
    ].join('\n');
  }

  function renderDocumentsNav(activeHref) {
    return [
      '<nav class="site-nav site-nav--documents" aria-label="Document navigation" data-i18n-aria-label="nav.documentsMenu">',
      createSiteMenuGroups(activeHref).split('\n').map((line) => `  ${line}`).join('\n'),
      '</nav>',
    ].join('\n');
  }

  function renderOperatorNav() {
    return [
      '<nav class="site-nav site-nav--operator" aria-label="Operator portal navigation" data-i18n-aria-label="operator.nav.menu">',
      '  <a class="nav-link is-active" href="https://crewportglobal.com/verify/" data-i18n="verify.nav.queue">Operator Queue</a>',
      `  ${createOperatorRolesMenu().split('\n').join('\n  ')}`,
      createSiteMenuGroups('/verify/').split('\n').map((line) => `  ${line}`).join('\n'),
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

  const themeMedia = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: light)') : null;
  if (themeMedia) {
    const handleSystemThemeChange = () => {
      if (themeMode === 'auto') {
        applyThemeMode(themeMode);
        renderAllThemeSwitchers();
      }
    };
    if (typeof themeMedia.addEventListener === 'function') {
      themeMedia.addEventListener('change', handleSystemThemeChange);
    } else if (typeof themeMedia.addListener === 'function') {
      themeMedia.addListener(handleSystemThemeChange);
    }
  }

  document.querySelectorAll('[data-cpg-navigation]').forEach(renderNavigation);
  renderHeaderThemeSwitchers();
  renderHeaderAccountAreas();
  fetchAccountState().then(renderAllAccountAreas);
  window.addEventListener('crewportglobal:authchanged', () => fetchAccountState().then(renderAllAccountAreas));
  window.addEventListener('crewportglobal:profilephotochanged', () => fetchAccountState().then(renderAllAccountAreas));
  window.addEventListener('crewportglobal:languagechange', () => {
    renderAllThemeSwitchers();
    renderAllAccountAreas();
  });
})();
