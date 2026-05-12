(function () {
  const STORAGE_KEY = 'crewportglobal.language';
  const DEFAULT_LANGUAGE = 'en';
  const RTL_LANGUAGES = new Set(['ar']);
  const GOOGLE_LANGUAGE_MAP = { fil: 'tl' };

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

  const CHROME_TRANSLATIONS = {
    en: {
      'site.tagline': 'Maritime documentation and matching platform',
      'site.languageLabel': 'Language',
      'nav.projectScope': 'Project Scope',
      'nav.howItWorks': 'How It Works',
      'nav.forShipowners': 'For Shipowners',
      'nav.forSeafarers': 'For Seafarers',
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
      'site.tagline': 'Платформа морской документации и matching workflows',
      'site.languageLabel': 'Язык',
      'nav.projectScope': 'О проекте',
      'nav.howItWorks': 'Как это работает',
      'nav.forShipowners': 'Для судовладельцев',
      'nav.forSeafarers': 'Для моряков',
      'nav.noRecruitmentFees': 'Без рекрутинговых сборов',
      'nav.privacy': 'Конфиденциальность',
      'nav.seafarerAgreement': 'Соглашение моряка',
      'nav.terms': 'Условия',
      'nav.shipownerAgreement': 'Соглашение судовладельца',
      'nav.matchingPolicy': 'Политика matching',
      'nav.verificationPolicy': 'Политика verification',
      'nav.complaints': 'Жалобы',
      'doc.primaryFocus': 'Основной фокус',
      'doc.backToHome': 'Назад на главную',
      'doc.canonicalMarkdown': 'Canonical Markdown',
      'doc.publicationSet': 'Пакет публикации',
      'doc.clientFacingLibrary': 'Публичная библиотека',
      'doc.libraryBody': 'Все публичные документы CrewPortGlobal используют одну и ту же навигацию, routing model и visual treatment.',
      'doc.relatedEyebrow': 'Связанные Trust Center материалы',
      'doc.relatedTitle': 'Следующие документы для просмотра',
      'doc.acknowledgementEyebrow': 'Onboarding acknowledgement',
      'doc.acknowledgementTitle': 'Подтверждения кандидата для регистрации'
    }
  };

  let googleScriptPromise;

  function getLanguageOption(code) {
    return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
  }

  function translate(language, key) {
    return (CHROME_TRANSLATIONS[language] && CHROME_TRANSLATIONS[language][key]) || CHROME_TRANSLATIONS.en[key] || key;
  }

  function getStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return getLanguageOption(stored || DEFAULT_LANGUAGE).code;
    } catch (error) {
      return DEFAULT_LANGUAGE;
    }
  }

  function setStoredLanguage(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      return;
    }
  }

  function setGoogleCookie(value) {
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; path=/; domain=.${window.location.hostname}`;
  }

  function clearGoogleCookie() {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
  }

  function loadGoogleTranslate() {
    if (googleScriptPromise) {
      return googleScriptPromise;
    }

    googleScriptPromise = new Promise((resolve, reject) => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        resolve();
        return;
      }

      window.crewportglobalGoogleTranslateInit = function () {
        const anchor = document.getElementById('google_translate_element');
        if (anchor && window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,ru,pt,uk,ar,tl,hi,id,es,fr,tr,el',
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            'google_translate_element'
          );
        }
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=crewportglobalGoogleTranslateInit';
      script.async = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return googleScriptPromise;
  }

  function waitForGoogleCombo() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = window.setInterval(() => {
        const combo = document.querySelector('.goog-te-combo');
        attempts += 1;

        if (combo) {
          window.clearInterval(interval);
          resolve(combo);
          return;
        }

        if (attempts > 80) {
          window.clearInterval(interval);
          reject(new Error('Google Translate combo not found'));
        }
      }, 125);
    });
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

  function applyGoogleTranslation(language, allowReload) {
    if (document.body.dataset.enablePublicTranslate !== 'true') {
      return Promise.resolve();
    }

    if (language === 'en') {
      const hadTranslation = document.cookie.includes('googtrans=');
      clearGoogleCookie();
      if (allowReload && hadTranslation) {
        window.location.reload();
      }
      return Promise.resolve();
    }

    const googleCode = GOOGLE_LANGUAGE_MAP[language] || language;
    setGoogleCookie(`/en/${googleCode}`);

    return loadGoogleTranslate()
      .then(waitForGoogleCombo)
      .then((combo) => {
        if (combo.value !== googleCode) {
          combo.value = googleCode;
          combo.dispatchEvent(new Event('change'));
        }
      })
      .catch(() => undefined);
  }

  function applyLanguage(language, allowReload) {
    const resolved = getLanguageOption(language).code;
    document.documentElement.lang = resolved;
    document.documentElement.dir = RTL_LANGUAGES.has(resolved) ? 'rtl' : 'ltr';
    updateLanguageToggle(resolved);
    renderHeaderLanguageOptions(resolved);
    applyChromeTranslations(resolved);
    return applyGoogleTranslation(resolved, allowReload);
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

  wireLanguageMenu();
  applyLanguage(getStoredLanguage(), false);
  setLanguageMenuOpen(false);
})();