(function () {
  const STORAGE_KEY = 'crewportglobal.language';
  const DEFAULT_LANGUAGE = 'en';
  const RTL_LANGUAGES = new Set(['ar']);

  const LANGUAGES = [
    { code: 'en', flag: '🇬🇧', english: 'English', native: 'English' },
    { code: 'ru', flag: '🇷🇺', english: 'Russian', native: 'Русский' },
    { code: 'pt', flag: '🇵🇹', english: 'Portuguese', native: 'Português' },
    { code: 'uk', flag: '🇺🇦', english: 'Ukrainian', native: 'Українська' },
    { code: 'ar', flag: '🇦🇪', english: 'Arabic', native: 'العربية' },
    { code: 'fil', flag: '🇵🇭', english: 'Filipino', native: 'Filipino' },
    { code: 'hi', flag: '🇮🇳', english: 'Hindi', native: 'हिन्दी' },
    { code: 'id', flag: '🇮🇩', english: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'es', flag: '🇪🇸', english: 'Spanish', native: 'Español' },
    { code: 'fr', flag: '🇫🇷', english: 'French', native: 'Français' },
    { code: 'tr', flag: '🇹🇷', english: 'Turkish', native: 'Türkçe' },
    { code: 'el', flag: '🇬🇷', english: 'Greek', native: 'Ελληνικά' }
  ];

  const PAGE_TRANSLATIONS = window.CREWPORTGLOBAL_PAGE_TRANSLATIONS || {};

  const CHROME_TRANSLATIONS = {
    en: {
      'site.tagline': 'Maritime jobs and crew platform',
      'site.languageLabel': 'Language',
      'nav.home': 'Home',
      'nav.vacancies': 'Vacancies',
      'nav.howItWorks': 'BP-015 Cycle',
      'nav.forShipowners': 'For Employers',
      'nav.forSeafarers': 'For Seafarers',
      'nav.createProfile': 'Create Profile',
      'nav.postVacancy': 'Post Vacancy',
      'nav.trustSafety': 'Trust & Safety',
      'nav.loginRegister': 'Login / Register',
      'nav.application': 'Application',
      'nav.functionalPages': 'Functional pages',
      'nav.documents': 'Documents',
      'nav.applicationMenu': 'Application menu',
      'nav.documentsMenu': 'Documents menu',
      'nav.fullSiteMenu': 'Full site menu',
      'nav.homeGroup': 'Home',
      'nav.homeHint': 'Main public entry page.',
      'nav.homeGroupMenu': 'Home and overview pages',
      'nav.homeGroupHint': 'Open the main public page with live registry indicators and BP-015 cycle.',
      'nav.seafarerPages': 'Seafarers',
      'nav.seafarerPagesMenu': 'Seafarer pages',
      'nav.seafarerPagesHint': 'Actions for seafarer registration, profile completion and vacancy review.',
      'nav.employerPages': 'Employers',
      'nav.employerPagesMenu': 'Employer pages',
      'nav.employerPagesHint': 'Actions for employer registration, vessel data and crew requests.',
      'nav.documentsHint': 'Open legal, trust and policy documents.',
      'nav.teamPages': 'Team',
      'nav.teamPagesMenu': 'Team pages',
      'nav.teamPagesHint': 'Protected team workspaces for computed tasks and operations.',
      'nav.loginCabinet': 'Login / Cabinet',
      'nav.registrationCabinet': 'Registration / Cabinet',
      'nav.registrationCabinetMenu': 'Registration and cabinet pages',
      'nav.languageFallback': 'Language fallback',
      'nav.vacancyDetail': 'Vacancy Detail',
      'nav.teamPortal': 'Team Portal',
      'nav.teamDocuments': 'Document Review',
      'nav.teamMatching': 'Request-Supply Comparison',
      'nav.teamRegistry': 'Registry Detail',
      'nav.teamShortlists': 'Shortlist Drafts',
      'nav.operatorQueue': 'Operator Queue',
      'nav.adminAccess': 'Access Admin',
      'nav.registerAuthorization': 'Authorization',
      'nav.registerAuthorizationSelected': 'Selected Authorization',
      'nav.registerAuthorizationSeafarer': 'Seafarer Authorization',
      'nav.registerAuthorizationEmployer': 'Employer Authorization',
      'nav.registerConfirm': 'Email Confirmation',
      'nav.registerNext': 'Next Step',
      'nav.myCabinet': 'My Cabinet',
      'account.entry': 'Account / Login',
      'account.register': 'Registration',
      'account.login': 'Login',
      'account.currentCabinet': 'Current cabinet',
      'account.loginUnavailableTitle': 'Password login is not enabled yet.',
      'account.loginUnavailableCopy': 'Registration and cabinet access currently continue through the registration draft context. Real password login requires the next authentication implementation slice.',
      'account.email': 'Email',
      'account.password': 'Password',
      'account.loginSubmit': 'Log in',
      'account.loginFailed': 'Invalid email or password.',
      'account.myCabinet': 'My Cabinet',
      'account.profileSettings': 'Profile settings',
      'account.logout': 'Logout',
      'account.verifiedEmail': 'Verified email',
      'account.emailNotVerified': 'Email not verified',
      'nav.projectScope': 'Project Scope',
      'nav.noRecruitmentFees': 'No Recruitment Fees',
      'nav.privacy': 'Privacy',
      'nav.seafarerAgreement': 'Seafarer Agreement',
      'nav.terms': 'Terms',
      'nav.shipownerAgreement': 'Shipowner Agreement',
      'nav.matchingPolicy': 'Matching Policy',
      'nav.verificationPolicy': 'Verification Policy',
      'nav.complaints': 'Complaints',
      'doc.primaryFocus': 'Primary focus',
      'doc.backToHome': 'Back to home',
      'doc.canonicalMarkdown': 'Canonical Markdown',
      'doc.publicationSet': 'Publication set',
      'doc.clientFacingLibrary': 'Client-facing library',
      'doc.libraryBody': 'All public CrewPortGlobal documents share the same navigation, routing model and visual treatment.',
      'doc.relatedEyebrow': 'Related Trust Center links',
      'doc.relatedTitle': 'Next documents to review',
      'doc.acknowledgementEyebrow': 'Onboarding acknowledgement',
      'doc.acknowledgementTitle': 'Candidate confirmations for registration'
    },
    ru: {
      'site.tagline': 'Морская платформа вакансий и экипажей',
      'site.languageLabel': 'Язык',
      'nav.home': 'Главная',
      'nav.vacancies': 'Вакансии',
      'nav.projectScope': 'О проекте',
      'nav.howItWorks': 'Цикл BP-015',
      'nav.forShipowners': 'Для работодателей',
      'nav.forSeafarers': 'Для моряков',
      'nav.createProfile': 'Создать профиль',
      'nav.postVacancy': 'Разместить вакансию',
      'nav.trustSafety': 'Доверие и безопасность',
      'nav.loginRegister': 'Вход / Регистрация',
      'nav.application': 'Приложение',
      'nav.functionalPages': 'Функциональные страницы',
      'nav.documents': 'Документы',
      'nav.applicationMenu': 'Меню приложения',
      'nav.documentsMenu': 'Меню документов',
      'nav.fullSiteMenu': 'Полное меню сайта',
      'nav.homeGroup': 'Главная',
      'nav.homeHint': 'Главная публичная страница.',
      'nav.homeGroupMenu': 'Главная и обзорные страницы',
      'nav.homeGroupHint': 'Открыть главную страницу с реестром и циклом BP-015.',
      'nav.seafarerPages': 'Моряки',
      'nav.seafarerPagesMenu': 'Страницы для моряков',
      'nav.seafarerPagesHint': 'Действия для регистрации моряка, заполнения профиля и просмотра вакансий.',
      'nav.employerPages': 'Работодатели',
      'nav.employerPagesMenu': 'Страницы для работодателей',
      'nav.employerPagesHint': 'Действия для регистрации работодателя, судов и заявок на экипаж.',
      'nav.documentsHint': 'Открыть юридические документы, trust-center и политики.',
      'nav.teamPages': 'Команда',
      'nav.teamPagesMenu': 'Страницы команды',
      'nav.teamPagesHint': 'Защищенные рабочие пространства команды для задач и операций.',
      'nav.loginCabinet': 'Вход / кабинет',
      'nav.registrationCabinet': 'Регистрация / кабинет',
      'nav.registrationCabinetMenu': 'Страницы регистрации и кабинета',
      'nav.languageFallback': 'Выбор языка',
      'nav.vacancyDetail': 'Детали вакансии',
      'nav.teamPortal': 'Кабинет команды',
      'nav.teamDocuments': 'Проверка документов',
      'nav.teamMatching': 'Сравнение запроса и кандидатов',
      'nav.teamRegistry': 'Реестр данных',
      'nav.teamShortlists': 'Черновики shortlists',
      'nav.operatorQueue': 'Очередь оператора',
      'nav.adminAccess': 'Управление доступом',
      'nav.registerAuthorization': 'Авторизация роли',
      'nav.registerAuthorizationSelected': 'Выбранная авторизация',
      'nav.registerAuthorizationSeafarer': 'Авторизация моряка',
      'nav.registerAuthorizationEmployer': 'Авторизация работодателя',
      'nav.registerConfirm': 'Подтверждение email',
      'nav.registerNext': 'Следующий шаг',
      'nav.myCabinet': 'Мой кабинет',
      'account.entry': 'Аккаунт / Войти',
      'account.register': 'Регистрация',
      'account.login': 'Вход',
      'account.currentCabinet': 'Текущий кабинет',
      'account.loginUnavailableTitle': 'Вход по паролю пока не включён.',
      'account.loginUnavailableCopy': 'Регистрация и доступ к кабинету сейчас продолжаются через регистрационный черновик. Настоящий вход по паролю требует следующего этапа реализации аутентификации.',
      'account.email': 'Email',
      'account.password': 'Пароль',
      'account.loginSubmit': 'Войти',
      'account.loginFailed': 'Неверный email или пароль.',
      'account.myCabinet': 'Мой кабинет',
      'account.profileSettings': 'Настройки профиля',
      'account.logout': 'Выйти',
      'account.verifiedEmail': 'Email подтверждён',
      'account.emailNotVerified': 'Email не подтверждён',
      'nav.noRecruitmentFees': 'Без рекрутинговых сборов',
      'nav.privacy': 'Конфиденциальность',
      'nav.seafarerAgreement': 'Соглашение моряка',
      'nav.terms': 'Условия',
      'nav.shipownerAgreement': 'Соглашение судовладельца',
      'nav.matchingPolicy': 'Политика подбора',
      'nav.verificationPolicy': 'Политика проверки',
      'nav.complaints': 'Жалобы',
      'doc.primaryFocus': 'Основной фокус',
      'doc.backToHome': 'Назад на главную',
      'doc.canonicalMarkdown': 'Исходный Markdown',
      'doc.publicationSet': 'Пакет публикации',
      'doc.clientFacingLibrary': 'Публичная библиотека',
      'doc.libraryBody': 'Все публичные документы CrewPortGlobal используют единую навигацию, структуру маршрутов и визуальный стиль.',
      'doc.relatedEyebrow': 'Связанные материалы центра доверия',
      'doc.relatedTitle': 'Следующие документы для просмотра',
      'doc.acknowledgementEyebrow': 'Подтверждение онбординга',
      'doc.acknowledgementTitle': 'Подтверждения кандидата для регистрации'
    },
    pt: {
      'site.tagline': 'Plataforma marítima de empregos e tripulação',
      'site.languageLabel': 'Idioma',
      'nav.home': 'Início',
      'nav.vacancies': 'Vagas',
      'nav.howItWorks': 'Como funciona',
      'nav.forShipowners': 'Para empregadores',
      'nav.forSeafarers': 'Para marítimos',
      'nav.createProfile': 'Criar perfil',
      'nav.postVacancy': 'Publicar vaga',
      'nav.trustSafety': 'Confiança e segurança',
      'nav.loginRegister': 'Entrar / Registar',
      'nav.application': 'Aplicacao',
      'nav.functionalPages': 'Paginas funcionais',
      'nav.documents': 'Documentos',
      'nav.applicationMenu': 'Menu da aplicacao',
      'nav.documentsMenu': 'Menu de documentos',
      'nav.fullSiteMenu': 'Menu completo do site',
      'nav.homeGroup': 'Inicio',
      'nav.homeHint': 'Pagina publica principal.',
      'nav.homeGroupMenu': 'Paginas iniciais e de visao geral',
      'nav.homeGroupHint': 'Abrir a pagina principal com indicadores e ciclo BP-015.',
      'nav.seafarerPages': 'Marítimos',
      'nav.seafarerPagesMenu': 'Paginas para marítimos',
      'nav.seafarerPagesHint': 'Acoes para registo, perfil e vagas de marítimos.',
      'nav.employerPages': 'Empregadores',
      'nav.employerPagesMenu': 'Paginas para empregadores',
      'nav.employerPagesHint': 'Acoes para empregadores, navios e pedidos de tripulacao.',
      'nav.documentsHint': 'Abrir documentos legais, confianca e politicas.',
      'nav.teamPages': 'Equipe',
      'nav.teamPagesMenu': 'Paginas da equipe',
      'nav.teamPagesHint': 'Areas protegidas da equipe para tarefas e operacoes.',
      'nav.loginCabinet': 'Entrar / gabinete',
      'nav.registrationCabinet': 'Registo / gabinete',
      'nav.registrationCabinetMenu': 'Paginas de registo e gabinete',
      'nav.languageFallback': 'Escolha de idioma',
      'nav.vacancyDetail': 'Detalhe da vaga',
      'nav.teamPortal': 'Portal da equipe',
      'nav.teamDocuments': 'Revisao de documentos',
      'nav.teamMatching': 'Comparacao pedido-oferta',
      'nav.teamRegistry': 'Registro de dados',
      'nav.teamShortlists': 'Rascunhos de shortlist',
      'nav.operatorQueue': 'Fila do operador',
      'nav.adminAccess': 'Administracao de acesso',
      'nav.registerAuthorization': 'Autorizacao',
      'nav.registerAuthorizationSelected': 'Autorizacao selecionada',
      'nav.registerAuthorizationSeafarer': 'Autorizacao do marítimo',
      'nav.registerAuthorizationEmployer': 'Autorizacao do empregador',
      'nav.registerConfirm': 'Confirmacao de email',
      'nav.registerNext': 'Proximo passo',
      'nav.myCabinet': 'Meu gabinete',
      'account.entry': 'Conta / Entrar',
      'account.register': 'Registar',
      'account.login': 'Entrar',
      'account.currentCabinet': 'Gabinete atual',
      'account.loginUnavailableTitle': 'O login por senha ainda nao esta ativado.',
      'account.loginUnavailableCopy': 'O registo e o acesso ao gabinete continuam pelo contexto do rascunho de registo. O login real por senha requer a proxima etapa de autenticacao.',
      'account.email': 'Email',
      'account.password': 'Senha',
      'account.loginSubmit': 'Entrar',
      'account.loginFailed': 'Email ou senha invalidos.',
      'account.myCabinet': 'Meu gabinete',
      'account.profileSettings': 'Definicoes do perfil',
      'account.logout': 'Sair',
      'account.verifiedEmail': 'Email verificado',
      'account.emailNotVerified': 'Email nao verificado',
      'nav.projectScope': 'Escopo do projeto',
      'nav.noRecruitmentFees': 'Sem taxas de recrutamento',
      'nav.privacy': 'Privacidade',
      'nav.seafarerAgreement': 'Acordo do marítimo',
      'nav.terms': 'Termos',
      'nav.shipownerAgreement': 'Acordo do armador',
      'nav.matchingPolicy': 'Política de matching',
      'nav.verificationPolicy': 'Política de verificação',
      'nav.complaints': 'Reclamações'
    }
  };

  function getLanguageOption(code) {
    return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
  }

  function normalizeLanguageCode(code) {
    if (!code || typeof code !== 'string') {
      return null;
    }

    const normalized = code.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const baseCode = normalized.split(/[-_]/)[0];
    if (baseCode === 'tl') {
      return 'fil';
    }

    return baseCode;
  }

  function getTranslation(language, key) {
    return (PAGE_TRANSLATIONS[language] && PAGE_TRANSLATIONS[language][key])
      || (CHROME_TRANSLATIONS[language] && CHROME_TRANSLATIONS[language][key])
      || (PAGE_TRANSLATIONS.en && PAGE_TRANSLATIONS.en[key])
      || (CHROME_TRANSLATIONS.en && CHROME_TRANSLATIONS.en[key]);
  }

  function translate(language, key) {
    return getTranslation(language, key) || key;
  }

  function readStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? getLanguageOption(stored).code : null;
    } catch (error) {
      return null;
    }
  }

  function setStoredLanguage(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      return;
    }
  }

  function detectBrowserLanguage() {
    const candidates = [];
    const navigatorLanguages = window.navigator.languages;

    if (Array.isArray(navigatorLanguages)) {
      candidates.push(...navigatorLanguages);
    }

    if (window.navigator.language) {
      candidates.push(window.navigator.language);
    }

    for (const candidate of candidates) {
      const normalized = normalizeLanguageCode(candidate);
      if (normalized && LANGUAGES.some((language) => language.code === normalized)) {
        return normalized;
      }
    }

    return DEFAULT_LANGUAGE;
  }

  function updateLanguageToggle(language) {
    const option = getLanguageOption(language);
    const flag = document.getElementById('current-language-flag');
    const label = document.getElementById('current-language-label');
    const toggle = document.getElementById('current-language-toggle');

    if (flag) {
      flag.textContent = option.flag;
    }

    if (label) {
      label.textContent = option.native;
    }

    if (toggle) {
      toggle.setAttribute('aria-label', `${option.english} language selector`);
    }
  }

  function setLanguageMenuOpen(isOpen) {
    const selector = document.getElementById('language-selector');
    const toggle = document.getElementById('current-language-toggle');
    const menu = document.getElementById('header-language-menu');

    if (!selector || !toggle || !menu) {
      return;
    }

    selector.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    menu.hidden = !isOpen;
  }

  function renderHeaderLanguageOptions(language) {
    const container = document.getElementById('header-language-options');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    LANGUAGES.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = option.code === language ? 'language-option is-current' : 'language-option';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(option.code === language));

      const flag = document.createElement('span');
      flag.className = 'language-option__flag';
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = option.flag;

      const label = document.createElement('span');
      label.className = 'language-option__label';
      label.textContent = option.native;

      button.append(flag, label);
      button.addEventListener('click', () => {
        setStoredLanguage(option.code);
        applyLanguage(option.code, true);
        setLanguageMenuOpen(false);
      });

      container.appendChild(button);
    });
  }

  function applyChromeTranslations(language) {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = translate(language, element.dataset.i18n);
    });
  }

  function applyAttributeTranslations(language) {
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.setAttribute('placeholder', translate(language, element.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.setAttribute('title', translate(language, element.dataset.i18nTitle));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', translate(language, element.dataset.i18nAriaLabel));
    });
  }

  function applyPageMetadata(language) {
    const pageTitle = getTranslation(language, 'site.pageTitle');
    const pageDescription = getTranslation(language, 'site.metaDescription');
    const metaDescription = document.getElementById('page-description');

    if (pageTitle) {
      document.title = pageTitle;
    }

    if (metaDescription && pageDescription) {
      metaDescription.setAttribute('content', pageDescription);
    }
  }

  function applyLanguage(language) {
    const resolved = getLanguageOption(language).code;
    document.documentElement.lang = resolved;
    document.documentElement.dir = RTL_LANGUAGES.has(resolved) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('translate', 'yes');
    updateLanguageToggle(resolved);
    renderHeaderLanguageOptions(resolved);
    applyChromeTranslations(resolved);
    applyAttributeTranslations(resolved);
    applyPageMetadata(resolved);
    window.dispatchEvent(new CustomEvent('crewportglobal:languagechange', {
      detail: { language: resolved }
    }));
  }

  function wireLanguageMenu() {
    const selector = document.getElementById('language-selector');
    const toggle = document.getElementById('current-language-toggle');

    if (!selector || !toggle) {
      return;
    }

    toggle.addEventListener('click', () => {
      const shouldOpen = toggle.getAttribute('aria-expanded') !== 'true';
      setLanguageMenuOpen(shouldOpen);
    });

    document.addEventListener('click', (event) => {
      if (!selector.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
        toggle.focus();
      }
    });
  }

  function getInitialLanguage() {
    const storedLanguage = readStoredLanguage();
    if (storedLanguage) {
      return storedLanguage;
    }

    const detectedLanguage = detectBrowserLanguage();
    setStoredLanguage(detectedLanguage);
    return detectedLanguage;
  }

  wireLanguageMenu();
  applyLanguage(getInitialLanguage());
  setLanguageMenuOpen(false);
})();
