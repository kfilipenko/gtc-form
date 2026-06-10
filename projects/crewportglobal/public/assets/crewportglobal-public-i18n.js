(function () {
  const STORAGE_KEY = 'crewportglobal.language';
  const DEFAULT_LANGUAGE = 'en';
  const RTL_LANGUAGES = new Set(['ar']);
  const AUTO_TEXT_KEY_PREFIX = 'auto.text.';
  const AUTO_ATTRIBUTE_KEY_PREFIX = 'auto.attr.';
  const AUTO_TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
  const AUTO_TRANSLATION_EXCLUDED_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'TEMPLATE',
    'NOSCRIPT',
    'SVG',
    'PRE',
    'CODE',
    'KBD',
    'SAMP',
    'INPUT',
    'TEXTAREA',
    'SELECT',
    'OPTION'
  ]);

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
  const MACHINE_TRANSLATION_BUNDLE_KEY = 'CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE';

  const CHROME_TRANSLATIONS = {
    en: {
      'site.tagline': 'Maritime jobs and crew platform',
      'site.languageLabel': 'Language',
      'nav.home': 'Home',
      'nav.vacancies': 'Vacancies',
      'nav.howItWorks': 'BP-015 Cycle',
      'nav.forShipowners': 'For Shipowners',
      'nav.forSeafarers': 'For Seafarers',
      'nav.createProfile': 'Create Profile',
      'nav.jobSearch': 'Job Search',
      'nav.jobSearchHint': 'Find matching vacancies from the saved seafarer profile.',
      'nav.postVacancy': 'Post Vacancy',
      'nav.selectCandidate': 'Select Candidate',
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
      'nav.seafarerPagesHint': 'Actions for seafarer registration, profile completion, job search and vacancy review.',
      'nav.seafarersOverview': 'Seafarers Overview',
      'nav.seafarersOverviewHint': 'Understand the seafarer role, process and next actions.',
      'nav.seafarerCabinet': 'My Cabinet',
      'nav.seafarerCabinetHint': 'Open the personal cabinet with current seafarer tasks.',
      'nav.employerPages': 'Shipowners',
      'nav.employerPagesMenu': 'Shipowner pages',
      'nav.employerPagesHint': 'Actions for shipowner vessel data, crew requests and candidate selection.',
      'nav.shipownersOverview': 'Shipowners Overview',
      'nav.shipownersOverviewHint': 'Understand the shipowner role, request cycle and next actions.',
      'nav.shipownerCabinet': 'My Cabinet',
      'nav.shipownerCabinetHint': 'Open the personal cabinet with current shipowner tasks.',
      'nav.agentPages': 'Agents',
      'nav.agentPagesMenu': 'Agent pages',
      'nav.agentPagesHint': 'Agent organization workspace for scoped client objects and full-cycle operations.',
      'nav.agentsOverview': 'Agents Overview',
      'nav.agentsOverviewHint': 'Understand the agent role, authority and platform boundaries.',
      'nav.agentPortal': 'Agent Portal',
      'nav.agentPortalHint': 'Open the agent organization workbench.',
      'nav.agentSeafarer': 'Seafarer',
      'nav.agentSeafarerHint': 'Create or maintain a seafarer profile for a represented client.',
      'nav.agentDemand': 'Demand',
      'nav.agentDemandHint': 'Create shipowner, vessel and vacancy data for a represented client.',
      'nav.agentCandidates': 'Candidates',
      'nav.agentCandidatesHint': 'Review scoped candidate-selection work.',
      'nav.agentContracts': 'Contracts',
      'nav.agentContractsHint': 'Open scoped contract workspaces.',
      'nav.documentsHint': 'Open legal, trust and policy documents.',
      'nav.agentAgreement': 'Agent Agreement',
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
      'nav.teamTranslations': 'Translation Review',
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
      'nav.forShipowners': 'Для судовладельцев',
      'nav.forSeafarers': 'Для моряков',
      'nav.createProfile': 'Создать профиль',
      'nav.jobSearch': 'Поиск работы',
      'nav.jobSearchHint': 'Найти подходящие вакансии по сохраненному профилю моряка.',
      'nav.postVacancy': 'Разместить вакансию',
      'nav.selectCandidate': 'Подобрать кандидата',
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
      'nav.seafarerPagesHint': 'Действия для регистрации моряка, заполнения профиля, поиска работы и просмотра вакансий.',
      'nav.seafarersOverview': 'Обзор для моряков',
      'nav.seafarersOverviewHint': 'Понять роль моряка, процесс и следующие действия.',
      'nav.seafarerCabinet': 'Мой кабинет',
      'nav.seafarerCabinetHint': 'Открыть личный кабинет с текущими задачами моряка.',
      'nav.employerPages': 'Судовладельцы',
      'nav.employerPagesMenu': 'Страницы судовладельца',
      'nav.employerPagesHint': 'Действия для данных судна, заявок на экипаж и подбора кандидатов.',
      'nav.shipownersOverview': 'Обзор для судовладельцев',
      'nav.shipownersOverviewHint': 'Понять роль судовладельца, цикл заявки и следующие действия.',
      'nav.shipownerCabinet': 'Мой кабинет',
      'nav.shipownerCabinetHint': 'Открыть личный кабинет с текущими задачами судовладельца.',
      'nav.agentPages': 'Агенты',
      'nav.agentPagesMenu': 'Страницы агента',
      'nav.agentPagesHint': 'Рабочее пространство агентской организации для клиентских объектов и полного цикла операций.',
      'nav.agentsOverview': 'Обзор для агентов',
      'nav.agentsOverviewHint': 'Понять роль агента, полномочия и границы платформы.',
      'nav.agentPortal': 'Кабинет агента',
      'nav.agentPortalHint': 'Открыть рабочее пространство агентской организации.',
      'nav.agentSeafarer': 'Моряк',
      'nav.agentSeafarerHint': 'Создать или вести профиль моряка для представляемого клиента.',
      'nav.agentDemand': 'Спрос',
      'nav.agentDemandHint': 'Создать данные судовладельца, судна и вакансии для представляемого клиента.',
      'nav.agentCandidates': 'Кандидаты',
      'nav.agentCandidatesHint': 'Проверить подбор кандидатов в пределах agent scope.',
      'nav.agentContracts': 'Контракты',
      'nav.agentContractsHint': 'Открыть contract workspace в пределах agent scope.',
      'nav.documentsHint': 'Открыть юридические документы, trust-center и политики.',
      'nav.agentAgreement': 'Агентский договор',
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
      'nav.forShipowners': 'Para armadores',
      'nav.forSeafarers': 'Para marítimos',
      'nav.createProfile': 'Criar perfil',
      'nav.jobSearch': 'Buscar trabalho',
      'nav.jobSearchHint': 'Encontrar vagas compativeis a partir do perfil salvo do marítimo.',
      'nav.postVacancy': 'Publicar vaga',
      'nav.selectCandidate': 'Selecionar candidato',
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
      'nav.seafarerPagesHint': 'Acoes para registo, perfil, busca de trabalho e vagas de marítimos.',
      'nav.seafarersOverview': 'Visao geral para maritimos',
      'nav.seafarersOverviewHint': 'Entender o papel do maritimo, o processo e as proximas acoes.',
      'nav.seafarerCabinet': 'Meu gabinete',
      'nav.seafarerCabinetHint': 'Abrir o gabinete pessoal com tarefas atuais do marítimo.',
      'nav.employerPages': 'Armadores',
      'nav.employerPagesMenu': 'Paginas para armadores',
      'nav.employerPagesHint': 'Acoes para dados de navio, pedidos de tripulacao e selecao de candidatos.',
      'nav.shipownersOverview': 'Visao geral para armadores',
      'nav.shipownersOverviewHint': 'Entender o papel do armador, o ciclo do pedido e as proximas acoes.',
      'nav.shipownerCabinet': 'Meu gabinete',
      'nav.shipownerCabinetHint': 'Abrir o gabinete pessoal com tarefas atuais do armador.',
      'nav.agentPages': 'Agentes',
      'nav.agentPagesMenu': 'Paginas de agentes',
      'nav.agentPagesHint': 'Espaco da organizacao agente para objetos de clientes e operacoes de ciclo completo.',
      'nav.agentsOverview': 'Visao geral para agentes',
      'nav.agentsOverviewHint': 'Entender o papel do agente, a autoridade e os limites da plataforma.',
      'nav.agentPortal': 'Portal do agente',
      'nav.agentPortalHint': 'Abrir o espaco da organizacao agente.',
      'nav.agentSeafarer': 'Maritimo',
      'nav.agentSeafarerHint': 'Criar ou manter perfil de maritimo para cliente representado.',
      'nav.agentDemand': 'Demanda',
      'nav.agentDemandHint': 'Criar dados de armador, navio e vaga para cliente representado.',
      'nav.agentCandidates': 'Candidatos',
      'nav.agentCandidatesHint': 'Rever selecao de candidatos no escopo do agente.',
      'nav.agentContracts': 'Contratos',
      'nav.agentContractsHint': 'Abrir contratos no escopo do agente.',
      'nav.documentsHint': 'Abrir documentos legais, confianca e politicas.',
      'nav.agentAgreement': 'Contrato de agente',
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

  function getDictionaryValue(dictionary, language, key) {
    const catalog = dictionary && dictionary[language];
    if (!catalog || typeof catalog !== 'object') {
      return null;
    }

    const value = catalog[key];
    return typeof value === 'string' ? value : null;
  }

  function readMachineTranslationBundle() {
    const bundle = window[MACHINE_TRANSLATION_BUNDLE_KEY];
    if (!bundle || typeof bundle !== 'object') {
      return null;
    }

    const publicationBoundary = bundle.publication_boundary;
    if (
      bundle.schema_version !== 1
      || bundle.official_language !== DEFAULT_LANGUAGE
      || !publicationBoundary
      || publicationBoundary.browser_provider_calls_allowed !== false
      || publicationBoundary.form_value_translation_allowed !== false
      || !bundle.catalogs
      || typeof bundle.catalogs !== 'object'
    ) {
      return null;
    }

    return bundle;
  }

  function getMachineBundleTranslation(language, key) {
    const bundle = readMachineTranslationBundle();
    const catalog = bundle && bundle.catalogs && bundle.catalogs[language];
    if (!catalog || typeof catalog !== 'object') {
      return null;
    }

    const value = catalog[key];
    return typeof value === 'string' ? value : null;
  }

  function getTranslation(language, key) {
    return getDictionaryValue(PAGE_TRANSLATIONS, language, key)
      || getDictionaryValue(CHROME_TRANSLATIONS, language, key)
      || getMachineBundleTranslation(language, key)
      || getDictionaryValue(PAGE_TRANSLATIONS, DEFAULT_LANGUAGE, key)
      || getDictionaryValue(CHROME_TRANSLATIONS, DEFAULT_LANGUAGE, key);
  }

  function translate(language, key) {
    return getTranslation(language, key) || key;
  }

  function normalizeAutoText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function buildAutoTextKey(prefix, value) {
    const normalized = normalizeAutoText(value);
    return normalized ? `${prefix}${stableHash(normalized)}` : null;
  }

  function isAutoTranslationExcluded(element) {
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      if (
        AUTO_TRANSLATION_EXCLUDED_TAGS.has(current.tagName)
        || current.hasAttribute('data-no-auto-i18n')
        || current.getAttribute('translate') === 'no'
        || current.hasAttribute('data-i18n')
        || current.hasAttribute('data-i18n-placeholder')
        || current.hasAttribute('data-i18n-title')
        || current.hasAttribute('data-i18n-aria-label')
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function isAutoTranslatableText(value) {
    const normalized = normalizeAutoText(value);
    if (normalized.length < 2) {
      return false;
    }
    if (/^[\d\s.,:;+\-/%()[\]#]+$/.test(normalized)) {
      return false;
    }
    if (/^(https?:|mailto:|tel:|\/assets\/|data:)/i.test(normalized)) {
      return false;
    }
    return /[A-Za-z]/.test(normalized);
  }

  function replacePreservingOuterWhitespace(original, replacement) {
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    return `${leading}${replacement}${trailing}`;
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

  function applyAutomaticTextTranslations(language) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement || isAutoTranslationExcluded(node.parentElement)) {
          return NodeFilter.FILTER_REJECT;
        }
        return isAutoTranslatableText(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (!node.__cpgOriginalText) {
        node.__cpgOriginalText = node.nodeValue;
      }

      const original = node.__cpgOriginalText;
      const normalized = normalizeAutoText(original);
      const key = buildAutoTextKey(AUTO_TEXT_KEY_PREFIX, normalized);
      const translated = language === DEFAULT_LANGUAGE ? normalized : getTranslation(language, key);
      if (translated) {
        node.nodeValue = replacePreservingOuterWhitespace(original, translated);
      }
    });
  }

  function applyAutomaticAttributeTranslations(language) {
    const elements = document.querySelectorAll(AUTO_TRANSLATABLE_ATTRIBUTES.map((attribute) => `[${attribute}]`).join(','));
    elements.forEach((element) => {
      if (isAutoTranslationExcluded(element)) {
        return;
      }

      AUTO_TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        if (!element.hasAttribute(attribute)) {
          return;
        }

        const storeKey = `cpgOriginal${attribute.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase())}`;
        if (!Object.prototype.hasOwnProperty.call(element.dataset, storeKey)) {
          element.dataset[storeKey] = element.getAttribute(attribute);
        }

        const original = element.dataset[storeKey];
        const normalized = normalizeAutoText(original);
        if (!isAutoTranslatableText(normalized)) {
          return;
        }

        const key = buildAutoTextKey(AUTO_ATTRIBUTE_KEY_PREFIX, normalized);
        const translated = language === DEFAULT_LANGUAGE ? normalized : getTranslation(language, key);
        if (translated) {
          element.setAttribute(attribute, translated);
        }
      });
    });
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
    applyAutomaticTextTranslations(resolved);
    applyAutomaticAttributeTranslations(resolved);
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
