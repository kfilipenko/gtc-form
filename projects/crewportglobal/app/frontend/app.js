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

  const TRANSLATIONS = {
    en: {
      'site.tagline': 'Global seafarer onboarding shell for the first CrewPortGlobal prototype.',
      'site.footer': 'Static multilingual shell prototype for project-owner review only.',
      'home.pageTitle': 'CrewPortGlobal | Multilingual Shell Prototype',
      'home.eyebrow': 'Maritime crew onboarding',
      'home.title': 'Static multilingual shell for seafarer registration planning.',
      'home.intro': 'This limited prototype shows how the whole application shell can inherit one global language state before later pages are connected.',
      'home.noticeTitle': 'Prototype notice',
      'home.noticeBody': 'This page is a static website-level shell only. Sensitive legal, consent and no-fee content still requires human review before public release.',
      'home.entryKicker': 'Main shell',
      'home.entryTitle': 'Enter the seafarer registration prototype.',
      'home.entryBody': 'The first shell stays simple: a maritime introduction, a visible prototype boundary and a global language selector in the header.',
      'home.entryAction': 'Open language selection',
      'home.stateTitle': 'Terminal prototype state stays review-oriented.',
      'home.stateBody': 'The current shell preserves pending_human_review as the prototype end state and does not imply activation, approval or placement.',
      'home.translationKicker': 'Global language state',
      'home.translationTitle': 'One language choice controls the whole shell.',
      'home.translationBody': 'The selected language updates all translatable UI text on every connected static page and is restored after reload from local browser storage.',
      'home.translationNote': 'English remains the canonical source language for reviewed translation dictionaries.',
      'language.pageTitle': 'CrewPortGlobal | Language Selection',
      'language.eyebrow': 'Language settings',
      'language.title': 'Choose the display language for the whole website shell.',
      'language.intro': 'This selector is a global website-level control. The chosen language applies across the visible shell and future connected pages.',
      'language.currentTitle': 'Current language',
      'language.currentSummary': 'Selected language: {language}.',
      'language.currentDetail': 'The saved language is restored after reload and is intended to remain global for the application shell.',
      'language.listTitle': 'Available languages',
      'language.listIntro': 'Select a language with its native name and visual marker. The current selection is highlighted.',
      'language.flagsNoteTitle': 'About flags and labels',
      'language.flagsNoteBody': 'Flags are visual markers only. Language names remain the actual identifiers for the selector and for accessible UI labels.',
      'language.reviewNoteTitle': 'Human review reminder',
      'language.reviewNoteBody': 'Important legal, consent, no-fee and seafarer-facing text remains subject to human review before public release.',
      'language.backLink': 'Return to main page',
      'language.currentBadge': 'Current',
      'language.chooseBadge': 'Select'
    },
    ru: {
      'site.tagline': 'Глобальный shell для онбординга моряков в первом прототипе CrewPortGlobal.',
      'site.footer': 'Статический многоязычный shell-прототип только для project-owner review.',
      'home.pageTitle': 'CrewPortGlobal | Многоязычный shell-прототип',
      'home.eyebrow': 'Онбординг морских экипажей',
      'home.title': 'Статический многоязычный shell для планирования регистрации моряков.',
      'home.intro': 'Этот ограниченный прототип показывает, как всё application shell может наследовать одно глобальное языковое состояние до подключения следующих страниц.',
      'home.noticeTitle': 'Прототипное уведомление',
      'home.noticeBody': 'Эта страница является только статическим shell на уровне сайта. Чувствительные юридические, consent и no-fee тексты по-прежнему требуют human review перед публичным выпуском.',
      'home.entryKicker': 'Главный shell',
      'home.entryTitle': 'Вход в прототип регистрации моряка.',
      'home.entryBody': 'Первый shell остаётся простым: морское введение, видимая граница прототипа и глобальный переключатель языка в header.',
      'home.entryAction': 'Открыть выбор языка',
      'home.stateTitle': 'Финальное состояние прототипа остаётся ориентированным на review.',
      'home.stateBody': 'Текущий shell сохраняет pending_human_review как конечное состояние прототипа и не создаёт впечатления активации, approval или placement.',
      'home.translationKicker': 'Глобальное языковое состояние',
      'home.translationTitle': 'Один выбор языка управляет всем shell.',
      'home.translationBody': 'Выбранный язык обновляет все переводимые UI-тексты на каждой подключённой статической странице и восстанавливается после перезагрузки из local browser storage.',
      'home.translationNote': 'English остаётся каноническим исходным языком для reviewable translation dictionaries.',
      'language.pageTitle': 'CrewPortGlobal | Выбор языка',
      'language.eyebrow': 'Настройки языка',
      'language.title': 'Выберите язык отображения для всего website shell.',
      'language.intro': 'Этот selector является глобальным элементом сайта. Выбранный язык применяется ко всему видимому shell и будущим подключённым страницам.',
      'language.currentTitle': 'Текущий язык',
      'language.currentSummary': 'Выбранный язык: {language}.',
      'language.currentDetail': 'Сохранённый язык восстанавливается после перезагрузки и должен оставаться глобальным для application shell.',
      'language.listTitle': 'Доступные языки',
      'language.listIntro': 'Выберите язык по его native label и визуальному маркеру. Текущий выбор выделен.',
      'language.flagsNoteTitle': 'О флагах и подписях',
      'language.flagsNoteBody': 'Флаги являются только визуальными маркерами. Названия языков остаются фактическими идентификаторами selector и доступных UI-подписей.',
      'language.reviewNoteTitle': 'Напоминание о human review',
      'language.reviewNoteBody': 'Важные legal, consent, no-fee и seafarer-facing тексты по-прежнему подлежат human review перед публичным выпуском.',
      'language.backLink': 'Вернуться на главную страницу',
      'language.currentBadge': 'Текущий',
      'language.chooseBadge': 'Выбрать'
    },
    pt: {
      'site.tagline': 'Shell global de onboarding marítimo para o primeiro protótipo CrewPortGlobal.',
      'site.footer': 'Protótipo estático multilíngue do shell apenas para revisão do proprietário do projeto.',
      'home.pageTitle': 'CrewPortGlobal | Protótipo multilíngue do shell',
      'home.eyebrow': 'Onboarding de tripulação marítima',
      'home.title': 'Shell estático multilíngue para o planejamento do registro de marítimos.',
      'home.intro': 'Este protótipo limitado mostra como todo o shell da aplicação pode herdar um único estado global de idioma antes da conexão das próximas páginas.',
      'home.noticeTitle': 'Aviso de protótipo',
      'home.noticeBody': 'Esta página é apenas um shell estático em nível de site. Conteúdo jurídico, de consentimento e de no-fee continua sujeito à revisão humana antes da publicação pública.',
      'home.entryKicker': 'Shell principal',
      'home.entryTitle': 'Entrar no protótipo de registro do marítimo.',
      'home.entryBody': 'O primeiro shell permanece simples: introdução marítima, limite visível do protótipo e seletor global de idioma no cabeçalho.',
      'home.entryAction': 'Abrir seleção de idioma',
      'home.stateTitle': 'O estado final do protótipo continua orientado à revisão.',
      'home.stateBody': 'O shell atual preserva pending_human_review como estado final do protótipo e não sugere ativação, aprovação ou colocação.',
      'home.translationKicker': 'Estado global de idioma',
      'home.translationTitle': 'Uma escolha de idioma controla todo o shell.',
      'home.translationBody': 'O idioma selecionado atualiza todo o texto traduzível da interface em cada página estática conectada e é restaurado após recarregar usando armazenamento local do navegador.',
      'home.translationNote': 'O inglês permanece como a fonte canônica para dicionários de tradução revisados.',
      'language.pageTitle': 'CrewPortGlobal | Seleção de idioma',
      'language.eyebrow': 'Configurações de idioma',
      'language.title': 'Escolha o idioma de exibição para todo o shell do site.',
      'language.intro': 'Este seletor é um controle global do site. O idioma escolhido se aplica a todo o shell visível e às futuras páginas conectadas.',
      'language.currentTitle': 'Idioma atual',
      'language.currentSummary': 'Idioma selecionado: {language}.',
      'language.currentDetail': 'O idioma salvo é restaurado após recarregar e deve permanecer global para o shell da aplicação.',
      'language.listTitle': 'Idiomas disponíveis',
      'language.listIntro': 'Selecione um idioma com seu nome nativo e marcador visual. A seleção atual fica destacada.',
      'language.flagsNoteTitle': 'Sobre bandeiras e rótulos',
      'language.flagsNoteBody': 'Bandeiras são apenas marcadores visuais. Os nomes dos idiomas continuam sendo os identificadores reais do seletor e das etiquetas acessíveis.',
      'language.reviewNoteTitle': 'Lembrete de revisão humana',
      'language.reviewNoteBody': 'Textos jurídicos, de consentimento, de no-fee e voltados ao marítimo continuam sujeitos à revisão humana antes da publicação pública.',
      'language.backLink': 'Voltar à página principal',
      'language.currentBadge': 'Atual',
      'language.chooseBadge': 'Selecionar'
    },
    uk: {
      'site.tagline': 'Глобальний shell для онбордингу моряків у першому прототипі CrewPortGlobal.',
      'site.footer': 'Статичний багатомовний shell-прототип лише для перевірки project owner.',
      'home.pageTitle': 'CrewPortGlobal | Багатомовний shell-прототип',
      'home.eyebrow': 'Онбординг морських екіпажів',
      'home.title': 'Статичний багатомовний shell для планування реєстрації моряків.',
      'home.intro': 'Цей обмежений прототип показує, як увесь application shell може успадковувати один глобальний мовний стан до підключення наступних сторінок.',
      'home.noticeTitle': 'Повідомлення про прототип',
      'home.noticeBody': 'Ця сторінка є лише статичним shell на рівні сайту. Чутливі юридичні, consent і no-fee тексти й надалі потребують human review перед публічним випуском.',
      'home.entryKicker': 'Головний shell',
      'home.entryTitle': 'Увійти до прототипу реєстрації моряка.',
      'home.entryBody': 'Перший shell залишається простим: морський вступ, видима межа прототипу та глобальний перемикач мови в header.',
      'home.entryAction': 'Відкрити вибір мови',
      'home.stateTitle': 'Кінцевий стан прототипу залишається орієнтованим на review.',
      'home.stateBody': 'Поточний shell зберігає pending_human_review як фінальний стан прототипу і не створює враження активації, approval або placement.',
      'home.translationKicker': 'Глобальний мовний стан',
      'home.translationTitle': 'Один вибір мови керує всім shell.',
      'home.translationBody': 'Вибрана мова оновлює всі перекладні UI-тексти на кожній підключеній статичній сторінці та відновлюється після перезавантаження з local browser storage.',
      'home.translationNote': 'English залишається канонічною вихідною мовою для reviewable translation dictionaries.',
      'language.pageTitle': 'CrewPortGlobal | Вибір мови',
      'language.eyebrow': 'Налаштування мови',
      'language.title': 'Оберіть мову відображення для всього website shell.',
      'language.intro': 'Цей selector є глобальним елементом сайту. Обрана мова застосовується до всього видимого shell і майбутніх підключених сторінок.',
      'language.currentTitle': 'Поточна мова',
      'language.currentSummary': 'Обрана мова: {language}.',
      'language.currentDetail': 'Збережена мова відновлюється після перезавантаження і має залишатися глобальною для application shell.',
      'language.listTitle': 'Доступні мови',
      'language.listIntro': 'Виберіть мову за її native label і візуальним маркером. Поточний вибір підсвічено.',
      'language.flagsNoteTitle': 'Про прапори та підписи',
      'language.flagsNoteBody': 'Прапори є лише візуальними маркерами. Назви мов залишаються фактичними ідентифікаторами selector та доступних UI-підписів.',
      'language.reviewNoteTitle': 'Нагадування про human review',
      'language.reviewNoteBody': 'Важливі legal, consent, no-fee та seafarer-facing тексти й надалі підлягають human review перед публічним випуском.',
      'language.backLink': 'Повернутися на головну сторінку',
      'language.currentBadge': 'Поточна',
      'language.chooseBadge': 'Обрати'
    },
    ar: {
      'site.tagline': 'واجهة عالمية لبدء انضمام البحارة في أول نموذج أولي لـ CrewPortGlobal.',
      'site.footer': 'نموذج أولي ثابت ومتعدد اللغات لمراجعة مالك المشروع فقط.',
      'home.pageTitle': 'CrewPortGlobal | نموذج واجهة متعددة اللغات',
      'home.eyebrow': 'تهيئة طواقم الملاحة',
      'home.title': 'واجهة ثابتة متعددة اللغات لتخطيط تسجيل البحارة.',
      'home.intro': 'يوضح هذا النموذج المحدود كيف يمكن لكل واجهة التطبيق أن ترث حالة لغة عالمية واحدة قبل ربط الصفحات التالية.',
      'home.noticeTitle': 'إشعار النموذج الأولي',
      'home.noticeBody': 'هذه الصفحة هي واجهة ثابتة على مستوى الموقع فقط. النصوص القانونية ونصوص الموافقة وعدم الرسوم ما زالت تحتاج إلى مراجعة بشرية قبل النشر العام.',
      'home.entryKicker': 'الواجهة الرئيسية',
      'home.entryTitle': 'الدخول إلى نموذج تسجيل البحار.',
      'home.entryBody': 'تبقى الواجهة الأولى بسيطة: مقدمة بحرية وحدّ واضح للنموذج الأولي ومحدد لغة عالمي في رأس الصفحة.',
      'home.entryAction': 'افتح اختيار اللغة',
      'home.stateTitle': 'الحالة النهائية للنموذج تبقى موجهة للمراجعة.',
      'home.stateBody': 'تحافظ الواجهة الحالية على pending_human_review كحالة نهائية للنموذج ولا توحي بالتفعيل أو الموافقة أو التوظيف.',
      'home.translationKicker': 'حالة اللغة العالمية',
      'home.translationTitle': 'اختيار لغة واحد يتحكم في الواجهة كلها.',
      'home.translationBody': 'اللغة المختارة تحدّث كل نصوص الواجهة القابلة للترجمة في كل صفحة ثابتة متصلة ويتم استعادتها بعد إعادة التحميل من التخزين المحلي في المتصفح.',
      'home.translationNote': 'تبقى الإنجليزية المصدر المرجعي الأساسي لقواميس الترجمة الخاضعة للمراجعة.',
      'language.pageTitle': 'CrewPortGlobal | اختيار اللغة',
      'language.eyebrow': 'إعدادات اللغة',
      'language.title': 'اختر لغة العرض لكل واجهة الموقع.',
      'language.intro': 'هذا المحدد عنصر عالمي على مستوى الموقع. اللغة المختارة تنطبق على الواجهة الظاهرة كلها وعلى الصفحات المستقبلية المتصلة.',
      'language.currentTitle': 'اللغة الحالية',
      'language.currentSummary': 'اللغة المختارة: {language}.',
      'language.currentDetail': 'تتم استعادة اللغة المحفوظة بعد إعادة التحميل ويجب أن تبقى عامة لواجهة التطبيق.',
      'language.listTitle': 'اللغات المتاحة',
      'language.listIntro': 'اختر لغة باسمها الأصلي وعلامتها المرئية. الاختيار الحالي مميز بوضوح.',
      'language.flagsNoteTitle': 'حول الأعلام والتسميات',
      'language.flagsNoteBody': 'الأعلام مؤشرات بصرية فقط. تبقى أسماء اللغات هي المعرّفات الفعلية للمحدد ولعناصر الوصول.',
      'language.reviewNoteTitle': 'تذكير بالمراجعة البشرية',
      'language.reviewNoteBody': 'النصوص القانونية ونصوص الموافقة وعدم الرسوم والنصوص الموجهة للبحارة تبقى خاضعة لمراجعة بشرية قبل النشر العام.',
      'language.backLink': 'العودة إلى الصفحة الرئيسية',
      'language.currentBadge': 'الحالي',
      'language.chooseBadge': 'اختيار'
    },
    fil: {
      'site.tagline': 'Pandaigdigang shell para sa seafarer onboarding sa unang CrewPortGlobal prototype.',
      'site.footer': 'Static multilingual shell prototype para sa project-owner review lamang.',
      'home.pageTitle': 'CrewPortGlobal | Multilingual shell prototype',
      'home.eyebrow': 'Maritime crew onboarding',
      'home.title': 'Static multilingual shell para sa pagpaplano ng seafarer registration.',
      'home.intro': 'Ipinapakita ng limitadong prototype na ito kung paano makakakuha ang buong application shell ng iisang global language state bago maidugtong ang mga susunod na pahina.',
      'home.noticeTitle': 'Abiso sa prototype',
      'home.noticeBody': 'Static website-level shell lamang ang page na ito. Ang sensitibong legal, consent at no-fee na teksto ay kailangan pa rin ng human review bago ilabas sa publiko.',
      'home.entryKicker': 'Main shell',
      'home.entryTitle': 'Pumasok sa seafarer registration prototype.',
      'home.entryBody': 'Simple pa rin ang unang shell: maritime introduction, malinaw na prototype boundary at global language selector sa header.',
      'home.entryAction': 'Buksan ang pagpili ng wika',
      'home.stateTitle': 'Nananatiling review-oriented ang terminal prototype state.',
      'home.stateBody': 'Pinapanatili ng kasalukuyang shell ang pending_human_review bilang huling prototype state at hindi nagpapahiwatig ng activation, approval o placement.',
      'home.translationKicker': 'Global language state',
      'home.translationTitle': 'Isang pagpili ng wika ang kumokontrol sa buong shell.',
      'home.translationBody': 'Ina-update ng napiling wika ang lahat ng translatable UI text sa bawat konektadong static page at ibinabalik ito pagkatapos mag-reload mula sa local browser storage.',
      'home.translationNote': 'Mananatiling English ang canonical source language para sa reviewed translation dictionaries.',
      'language.pageTitle': 'CrewPortGlobal | Pagpili ng wika',
      'language.eyebrow': 'Mga setting ng wika',
      'language.title': 'Piliin ang display language para sa buong website shell.',
      'language.intro': 'Ang selector na ito ay global website-level control. Ang napiling wika ay ilalapat sa buong visible shell at sa mga susunod na pahinang ikokonekta.',
      'language.currentTitle': 'Kasalukuyang wika',
      'language.currentSummary': 'Napiling wika: {language}.',
      'language.currentDetail': 'Naibabalik ang naka-save na wika pagkatapos mag-reload at dapat manatiling global para sa application shell.',
      'language.listTitle': 'Mga available na wika',
      'language.listIntro': 'Pumili ng wika gamit ang native name at visual marker nito. Nakahighlight ang kasalukuyang pinili.',
      'language.flagsNoteTitle': 'Tungkol sa mga flag at label',
      'language.flagsNoteBody': 'Mga visual marker lamang ang mga flag. Ang mga pangalan ng wika pa rin ang tunay na identifier para sa selector at accessible UI labels.',
      'language.reviewNoteTitle': 'Paalala sa human review',
      'language.reviewNoteBody': 'Ang mahahalagang legal, consent, no-fee at seafarer-facing na teksto ay kailangan pa ring dumaan sa human review bago public release.',
      'language.backLink': 'Bumalik sa main page',
      'language.currentBadge': 'Kasalukuyan',
      'language.chooseBadge': 'Piliin'
    },
    hi: {
      'site.tagline': 'पहले CrewPortGlobal प्रोटोटाइप के लिए वैश्विक seafarer onboarding shell।',
      'site.footer': 'यह स्थिर बहुभाषी shell prototype केवल project-owner review के लिए है।',
      'home.pageTitle': 'CrewPortGlobal | बहुभाषी shell prototype',
      'home.eyebrow': 'समुद्री crew onboarding',
      'home.title': 'seafarer registration planning के लिए स्थिर बहुभाषी shell।',
      'home.intro': 'यह सीमित prototype दिखाता है कि अगली pages जुड़ने से पहले पूरा application shell एक global language state कैसे अपना सकता है।',
      'home.noticeTitle': 'Prototype notice',
      'home.noticeBody': 'यह page केवल static website-level shell है। संवेदनशील legal, consent और no-fee text को public release से पहले human review की आवश्यकता बनी रहती है।',
      'home.entryKicker': 'Main shell',
      'home.entryTitle': 'seafarer registration prototype में प्रवेश करें।',
      'home.entryBody': 'पहला shell सरल रहता है: maritime introduction, स्पष्ट prototype boundary और header में global language selector।',
      'home.entryAction': 'भाषा चयन खोलें',
      'home.stateTitle': 'अंतिम prototype state review-oriented रहती है।',
      'home.stateBody': 'वर्तमान shell pending_human_review को अंतिम prototype state के रूप में रखता है और activation, approval या placement का संकेत नहीं देता।',
      'home.translationKicker': 'Global language state',
      'home.translationTitle': 'एक भाषा चयन पूरे shell को नियंत्रित करता है।',
      'home.translationBody': 'चुनी गई भाषा हर connected static page पर सभी translatable UI text को अपडेट करती है और reload के बाद local browser storage से वापस आती है।',
      'home.translationNote': 'English reviewed translation dictionaries के लिए canonical source language बनी रहती है।',
      'language.pageTitle': 'CrewPortGlobal | भाषा चयन',
      'language.eyebrow': 'भाषा सेटिंग्स',
      'language.title': 'पूरे website shell के लिए display language चुनें।',
      'language.intro': 'यह selector एक global website-level control है। चुनी गई भाषा पूरे visible shell और future connected pages पर लागू होती है।',
      'language.currentTitle': 'वर्तमान भाषा',
      'language.currentSummary': 'चुनी गई भाषा: {language}.',
      'language.currentDetail': 'सहेजी गई भाषा reload के बाद वापस आती है और application shell के लिए global रहनी चाहिए।',
      'language.listTitle': 'उपलब्ध भाषाएँ',
      'language.listIntro': 'native name और visual marker के साथ भाषा चुनें। वर्तमान चयन स्पष्ट रूप से दिखाया गया है।',
      'language.flagsNoteTitle': 'Flags और labels के बारे में',
      'language.flagsNoteBody': 'Flags केवल visual markers हैं। selector और accessible UI labels के लिए भाषा के नाम ही वास्तविक identifiers हैं।',
      'language.reviewNoteTitle': 'Human review reminder',
      'language.reviewNoteBody': 'महत्वपूर्ण legal, consent, no-fee और seafarer-facing text public release से पहले human review के अधीन रहते हैं।',
      'language.backLink': 'मुख्य पृष्ठ पर लौटें',
      'language.currentBadge': 'वर्तमान',
      'language.chooseBadge': 'चुनें'
    },
    id: {
      'site.tagline': 'Shell onboarding pelaut global untuk prototipe pertama CrewPortGlobal.',
      'site.footer': 'Prototipe shell multibahasa statis hanya untuk tinjauan pemilik proyek.',
      'home.pageTitle': 'CrewPortGlobal | Prototipe shell multibahasa',
      'home.eyebrow': 'Onboarding kru maritim',
      'home.title': 'Shell multibahasa statis untuk perencanaan pendaftaran pelaut.',
      'home.intro': 'Prototipe terbatas ini menunjukkan bagaimana seluruh application shell dapat mewarisi satu state bahasa global sebelum halaman berikutnya dihubungkan.',
      'home.noticeTitle': 'Pemberitahuan prototipe',
      'home.noticeBody': 'Halaman ini hanyalah shell statis tingkat situs. Teks hukum, persetujuan, dan no-fee yang sensitif tetap memerlukan peninjauan manusia sebelum rilis publik.',
      'home.entryKicker': 'Shell utama',
      'home.entryTitle': 'Masuk ke prototipe pendaftaran pelaut.',
      'home.entryBody': 'Shell pertama tetap sederhana: pengantar maritim, batas prototipe yang terlihat, dan pemilih bahasa global di header.',
      'home.entryAction': 'Buka pemilihan bahasa',
      'home.stateTitle': 'Status akhir prototipe tetap berorientasi review.',
      'home.stateBody': 'Shell saat ini mempertahankan pending_human_review sebagai status akhir prototipe dan tidak menyiratkan aktivasi, persetujuan, atau penempatan.',
      'home.translationKicker': 'State bahasa global',
      'home.translationTitle': 'Satu pilihan bahasa mengendalikan seluruh shell.',
      'home.translationBody': 'Bahasa yang dipilih memperbarui semua teks UI yang dapat diterjemahkan di setiap halaman statis yang terhubung dan dipulihkan setelah muat ulang dari penyimpanan lokal browser.',
      'home.translationNote': 'Bahasa Inggris tetap menjadi sumber kanonis untuk kamus terjemahan yang ditinjau.',
      'language.pageTitle': 'CrewPortGlobal | Pemilihan bahasa',
      'language.eyebrow': 'Pengaturan bahasa',
      'language.title': 'Pilih bahasa tampilan untuk seluruh shell situs.',
      'language.intro': 'Selector ini adalah kontrol global tingkat situs. Bahasa yang dipilih berlaku untuk seluruh shell yang terlihat dan halaman-halaman masa depan yang terhubung.',
      'language.currentTitle': 'Bahasa saat ini',
      'language.currentSummary': 'Bahasa terpilih: {language}.',
      'language.currentDetail': 'Bahasa yang disimpan dipulihkan setelah muat ulang dan dimaksudkan tetap global untuk application shell.',
      'language.listTitle': 'Bahasa yang tersedia',
      'language.listIntro': 'Pilih bahasa dengan nama asli dan penanda visualnya. Pilihan saat ini ditandai dengan jelas.',
      'language.flagsNoteTitle': 'Tentang bendera dan label',
      'language.flagsNoteBody': 'Bendera hanyalah penanda visual. Nama bahasa tetap menjadi pengenal sebenarnya bagi selector dan label UI yang dapat diakses.',
      'language.reviewNoteTitle': 'Pengingat peninjauan manusia',
      'language.reviewNoteBody': 'Teks penting terkait hukum, consent, no-fee, dan teks untuk pelaut tetap memerlukan peninjauan manusia sebelum rilis publik.',
      'language.backLink': 'Kembali ke halaman utama',
      'language.currentBadge': 'Saat ini',
      'language.chooseBadge': 'Pilih'
    },
    es: {
      'site.tagline': 'Shell global de incorporación de marinos para el primer prototipo de CrewPortGlobal.',
      'site.footer': 'Prototipo estático multilingüe del shell solo para revisión del propietario del proyecto.',
      'home.pageTitle': 'CrewPortGlobal | Prototipo multilingüe del shell',
      'home.eyebrow': 'Incorporación de tripulación marítima',
      'home.title': 'Shell estático multilingüe para la planificación del registro de marinos.',
      'home.intro': 'Este prototipo limitado muestra cómo todo el shell de la aplicación puede heredar un único estado global de idioma antes de conectar las siguientes páginas.',
      'home.noticeTitle': 'Aviso de prototipo',
      'home.noticeBody': 'Esta página es solo un shell estático a nivel de sitio. Los textos legales, de consentimiento y de no-fee sensibles siguen requiriendo revisión humana antes de la publicación pública.',
      'home.entryKicker': 'Shell principal',
      'home.entryTitle': 'Entrar en el prototipo de registro de marino.',
      'home.entryBody': 'El primer shell sigue siendo simple: introducción marítima, límite visible del prototipo y selector global de idioma en el encabezado.',
      'home.entryAction': 'Abrir selección de idioma',
      'home.stateTitle': 'El estado terminal del prototipo sigue orientado a revisión.',
      'home.stateBody': 'El shell actual conserva pending_human_review como estado final del prototipo y no implica activación, aprobación ni colocación.',
      'home.translationKicker': 'Estado global de idioma',
      'home.translationTitle': 'Una sola elección de idioma controla todo el shell.',
      'home.translationBody': 'El idioma seleccionado actualiza todo el texto traducible de la interfaz en cada página estática conectada y se restaura tras recargar desde el almacenamiento local del navegador.',
      'home.translationNote': 'El inglés sigue siendo la fuente canónica para los diccionarios de traducción revisados.',
      'language.pageTitle': 'CrewPortGlobal | Selección de idioma',
      'language.eyebrow': 'Configuración de idioma',
      'language.title': 'Elige el idioma de visualización para todo el shell del sitio.',
      'language.intro': 'Este selector es un control global a nivel del sitio. El idioma elegido se aplica a todo el shell visible y a las futuras páginas conectadas.',
      'language.currentTitle': 'Idioma actual',
      'language.currentSummary': 'Idioma seleccionado: {language}.',
      'language.currentDetail': 'El idioma guardado se restaura tras recargar y debe permanecer global para el shell de la aplicación.',
      'language.listTitle': 'Idiomas disponibles',
      'language.listIntro': 'Selecciona un idioma con su nombre nativo y marcador visual. La selección actual aparece resaltada.',
      'language.flagsNoteTitle': 'Sobre banderas y etiquetas',
      'language.flagsNoteBody': 'Las banderas son solo marcadores visuales. Los nombres de los idiomas siguen siendo los identificadores reales del selector y de las etiquetas accesibles.',
      'language.reviewNoteTitle': 'Recordatorio de revisión humana',
      'language.reviewNoteBody': 'Los textos legales, de consentimiento, no-fee y orientados al marino siguen sujetos a revisión humana antes de la publicación pública.',
      'language.backLink': 'Volver a la página principal',
      'language.currentBadge': 'Actual',
      'language.chooseBadge': 'Seleccionar'
    },
    fr: {
      'site.tagline': 'Shell global d’intégration des gens de mer pour le premier prototype CrewPortGlobal.',
      'site.footer': 'Prototype statique multilingue du shell pour revue du project owner uniquement.',
      'home.pageTitle': 'CrewPortGlobal | Prototype multilingue du shell',
      'home.eyebrow': 'Intégration des équipages maritimes',
      'home.title': 'Shell statique multilingue pour la planification de l’inscription des gens de mer.',
      'home.intro': 'Ce prototype limité montre comment tout le shell de l’application peut hériter d’un état global de langue avant le raccordement des prochaines pages.',
      'home.noticeTitle': 'Avis de prototype',
      'home.noticeBody': 'Cette page n’est qu’un shell statique au niveau du site. Les textes juridiques, de consentement et de no-fee sensibles restent soumis à une revue humaine avant publication.',
      'home.entryKicker': 'Shell principal',
      'home.entryTitle': 'Entrer dans le prototype d’inscription du marin.',
      'home.entryBody': 'Le premier shell reste simple: introduction maritime, limite visible du prototype et sélecteur global de langue dans l’en-tête.',
      'home.entryAction': 'Ouvrir la sélection de langue',
      'home.stateTitle': 'L’état terminal du prototype reste orienté revue.',
      'home.stateBody': 'Le shell actuel conserve pending_human_review comme état final du prototype et ne suggère ni activation, ni approbation, ni placement.',
      'home.translationKicker': 'État global de langue',
      'home.translationTitle': 'Un seul choix de langue pilote tout le shell.',
      'home.translationBody': 'La langue sélectionnée met à jour tous les textes UI traduisibles sur chaque page statique connectée et est restaurée après rechargement depuis le stockage local du navigateur.',
      'home.translationNote': 'L’anglais reste la source canonique des dictionnaires de traduction révisés.',
      'language.pageTitle': 'CrewPortGlobal | Sélection de langue',
      'language.eyebrow': 'Paramètres de langue',
      'language.title': 'Choisissez la langue d’affichage pour tout le shell du site.',
      'language.intro': 'Ce sélecteur est un contrôle global au niveau du site. La langue choisie s’applique à tout le shell visible et aux futures pages connectées.',
      'language.currentTitle': 'Langue actuelle',
      'language.currentSummary': 'Langue sélectionnée: {language}.',
      'language.currentDetail': 'La langue enregistrée est restaurée après rechargement et doit rester globale pour le shell de l’application.',
      'language.listTitle': 'Langues disponibles',
      'language.listIntro': 'Choisissez une langue avec son nom natif et son repère visuel. La sélection actuelle est mise en évidence.',
      'language.flagsNoteTitle': 'À propos des drapeaux et des libellés',
      'language.flagsNoteBody': 'Les drapeaux sont seulement des repères visuels. Les noms de langue restent les véritables identifiants du sélecteur et des libellés accessibles.',
      'language.reviewNoteTitle': 'Rappel de revue humaine',
      'language.reviewNoteBody': 'Les textes juridiques, de consentement, no-fee et destinés aux marins restent soumis à une revue humaine avant publication publique.',
      'language.backLink': 'Retour à la page principale',
      'language.currentBadge': 'Actuelle',
      'language.chooseBadge': 'Choisir'
    },
    tr: {
      'site.tagline': 'İlk CrewPortGlobal prototipi için küresel gemiadamı onboarding shelli.',
      'site.footer': 'Statik çok dilli shell prototipi yalnızca project-owner review içindir.',
      'home.pageTitle': 'CrewPortGlobal | Çok dilli shell prototipi',
      'home.eyebrow': 'Denizcilik mürettebat onboarding',
      'home.title': 'Gemiadamı kayıt planlaması için statik çok dilli shell.',
      'home.intro': 'Bu sınırlı prototip, sonraki sayfalar bağlanmadan önce tüm application shellin tek bir global language state alabileceğini gösterir.',
      'home.noticeTitle': 'Prototip bildirimi',
      'home.noticeBody': 'Bu sayfa yalnızca statik bir website-level shelldir. Hassas legal, consent ve no-fee metinleri kamusal yayından önce human review gerektirmeye devam eder.',
      'home.entryKicker': 'Ana shell',
      'home.entryTitle': 'Gemiadamı kayıt prototipine girin.',
      'home.entryBody': 'İlk shell basit kalır: maritime introduction, görünür prototip sınırı ve header içinde global language selector.',
      'home.entryAction': 'Dil seçimini aç',
      'home.stateTitle': 'Terminal prototype state review odaklı kalır.',
      'home.stateBody': 'Mevcut shell, pending_human_review durumunu son prototype state olarak korur ve activation, approval veya placement ima etmez.',
      'home.translationKicker': 'Global language state',
      'home.translationTitle': 'Tek bir dil seçimi tüm shelli kontrol eder.',
      'home.translationBody': 'Seçilen dil, bağlı her statik sayfadaki tüm çevrilebilir UI metinlerini günceller ve reload sonrası tarayıcı local storage üzerinden geri yüklenir.',
      'home.translationNote': 'İngilizce, reviewed translation dictionaries için canonical source language olarak kalır.',
      'language.pageTitle': 'CrewPortGlobal | Dil seçimi',
      'language.eyebrow': 'Dil ayarları',
      'language.title': 'Tüm website shell için görüntüleme dilini seçin.',
      'language.intro': 'Bu selector global website-level controldür. Seçilen dil görünür shellin tamamına ve gelecekte bağlanacak sayfalara uygulanır.',
      'language.currentTitle': 'Geçerli dil',
      'language.currentSummary': 'Seçilen dil: {language}.',
      'language.currentDetail': 'Kaydedilen dil reload sonrası geri yüklenir ve application shell için global kalmalıdır.',
      'language.listTitle': 'Kullanılabilir diller',
      'language.listIntro': 'Bir dili native label ve visual marker ile seçin. Mevcut seçim açıkça işaretlenir.',
      'language.flagsNoteTitle': 'Bayraklar ve etiketler hakkında',
      'language.flagsNoteBody': 'Bayraklar yalnızca görsel işaretçilerdir. Dil adları selector ve accessible UI labels için gerçek tanımlayıcı olmaya devam eder.',
      'language.reviewNoteTitle': 'Human review hatırlatması',
      'language.reviewNoteBody': 'Önemli legal, consent, no-fee ve seafarer-facing metinler, kamusal yayından önce human review altında kalır.',
      'language.backLink': 'Ana sayfaya dön',
      'language.currentBadge': 'Geçerli',
      'language.chooseBadge': 'Seç'
    },
    el: {
      'site.tagline': 'Παγκόσμιο shell onboarding ναυτικών για το πρώτο πρωτότυπο CrewPortGlobal.',
      'site.footer': 'Στατικό πολύγλωσσο shell prototype μόνο για review του project owner.',
      'home.pageTitle': 'CrewPortGlobal | Πολύγλωσσο shell prototype',
      'home.eyebrow': 'Onboarding ναυτικών πληρωμάτων',
      'home.title': 'Στατικό πολύγλωσσο shell για τον σχεδιασμό εγγραφής ναυτικών.',
      'home.intro': 'Αυτό το περιορισμένο prototype δείχνει πώς όλο το application shell μπορεί να κληρονομεί μία παγκόσμια κατάσταση γλώσσας πριν συνδεθούν οι επόμενες σελίδες.',
      'home.noticeTitle': 'Ειδοποίηση prototype',
      'home.noticeBody': 'Αυτή η σελίδα είναι μόνο ένα static website-level shell. Ευαίσθητα legal, consent και no-fee κείμενα εξακολουθούν να απαιτούν human review πριν από δημόσια δημοσίευση.',
      'home.entryKicker': 'Κύριο shell',
      'home.entryTitle': 'Είσοδος στο prototype εγγραφής ναυτικού.',
      'home.entryBody': 'Το πρώτο shell παραμένει απλό: maritime introduction, ορατό όριο prototype και global language selector στο header.',
      'home.entryAction': 'Άνοιγμα επιλογής γλώσσας',
      'home.stateTitle': 'Η τελική κατάσταση του prototype παραμένει προσανατολισμένη σε review.',
      'home.stateBody': 'Το τρέχον shell διατηρεί το pending_human_review ως τελική κατάσταση prototype και δεν υπονοεί activation, approval ή placement.',
      'home.translationKicker': 'Παγκόσμια κατάσταση γλώσσας',
      'home.translationTitle': 'Μία επιλογή γλώσσας ελέγχει όλο το shell.',
      'home.translationBody': 'Η επιλεγμένη γλώσσα ενημερώνει όλα τα μεταφράσιμα UI κείμενα σε κάθε συνδεδεμένη στατική σελίδα και επαναφέρεται μετά από reload από το local browser storage.',
      'home.translationNote': 'Τα Αγγλικά παραμένουν η canonical source language για reviewed translation dictionaries.',
      'language.pageTitle': 'CrewPortGlobal | Επιλογή γλώσσας',
      'language.eyebrow': 'Ρυθμίσεις γλώσσας',
      'language.title': 'Επιλέξτε γλώσσα εμφάνισης για όλο το website shell.',
      'language.intro': 'Αυτός ο selector είναι global website-level control. Η επιλεγμένη γλώσσα εφαρμόζεται σε όλο το ορατό shell και στις μελλοντικές συνδεδεμένες σελίδες.',
      'language.currentTitle': 'Τρέχουσα γλώσσα',
      'language.currentSummary': 'Επιλεγμένη γλώσσα: {language}.',
      'language.currentDetail': 'Η αποθηκευμένη γλώσσα αποκαθίσταται μετά από reload και πρέπει να παραμένει global για το application shell.',
      'language.listTitle': 'Διαθέσιμες γλώσσες',
      'language.listIntro': 'Επιλέξτε γλώσσα με το native label και τον οπτικό δείκτη της. Η τρέχουσα επιλογή επισημαίνεται καθαρά.',
      'language.flagsNoteTitle': 'Σχετικά με σημαίες και ετικέτες',
      'language.flagsNoteBody': 'Οι σημαίες είναι μόνο οπτικοί δείκτες. Τα ονόματα γλωσσών παραμένουν τα πραγματικά αναγνωριστικά για τον selector και τα προσβάσιμα UI labels.',
      'language.reviewNoteTitle': 'Υπενθύμιση human review',
      'language.reviewNoteBody': 'Σημαντικά legal, consent, no-fee και seafarer-facing κείμενα παραμένουν υπό human review πριν από δημόσια δημοσίευση.',
      'language.backLink': 'Επιστροφή στην κύρια σελίδα',
      'language.currentBadge': 'Τρέχουσα',
      'language.chooseBadge': 'Επιλογή'
    }
  };

  function getLanguageOption(code) {
    return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
  }

  function format(template, value) {
    return template.replace('{language}', value);
  }

  function translate(language, key) {
    return (TRANSLATIONS[language] && TRANSLATIONS[language][key]) || TRANSLATIONS.en[key] || key;
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
      button.dataset.languageCode = option.code;
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
        applyLanguage(option.code);
        setLanguageMenuOpen(false);
      });

      container.appendChild(button);
    });
  }

  function wireHeaderLanguageMenu() {
    const selector = document.getElementById('language-selector');
    const toggle = document.getElementById('current-language-toggle');

    if (!selector || !toggle) {
      return;
    }

    toggle.addEventListener('click', () => {
      const shouldOpen = toggle.getAttribute('aria-expanded') !== 'true';
      setLanguageMenuOpen(shouldOpen);

      if (shouldOpen) {
        const currentOption = document.querySelector('#header-language-menu .language-option.is-current');
        if (currentOption) {
          currentOption.focus();
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (!selector.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setLanguageMenuOpen(false);
        toggle.focus();
      }
    });
  }

  function wireHeroLanguageAction() {
    const action = document.getElementById('hero-language-action');
    const toggle = document.getElementById('current-language-toggle');

    if (!action || !toggle) {
      return;
    }

    action.addEventListener('click', () => {
      setLanguageMenuOpen(true);
      const currentOption = document.querySelector('#header-language-menu .language-option.is-current');
      if (currentOption) {
        currentOption.focus();
      } else {
        toggle.focus();
      }
    });
  }

  function updateSelectedLanguageSummary(language) {
    const summary = document.getElementById('selected-language-summary');
    if (!summary) {
      return;
    }

    const option = getLanguageOption(language);
    summary.textContent = format(translate(language, 'language.currentSummary'), `${option.flag} ${option.native}`);
  }

  function renderLanguageOptions(language) {
    const container = document.getElementById('language-options');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    LANGUAGES.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = option.code === language ? 'language-card is-current' : 'language-card';
      button.dataset.languageCode = option.code;

      const flag = document.createElement('span');
      flag.className = 'language-card__flag';
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = option.flag;

      const label = document.createElement('span');
      label.className = 'language-card__label';
      label.textContent = option.native;

      button.append(flag, label);
      button.addEventListener('click', () => {
        setStoredLanguage(option.code);
        applyLanguage(option.code);
      });

      container.appendChild(button);
    });
  }

  function applyLanguage(language) {
    const resolved = getLanguageOption(language).code;
    document.documentElement.lang = resolved;
    document.documentElement.dir = RTL_LANGUAGES.has(resolved) ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = translate(resolved, element.dataset.i18n);
    });

    if (document.body.dataset.titleKey) {
      document.title = translate(resolved, document.body.dataset.titleKey);
    }

    updateLanguageToggle(resolved);
    renderHeaderLanguageOptions(resolved);
    updateSelectedLanguageSummary(resolved);
    renderLanguageOptions(resolved);
  }

  wireHeaderLanguageMenu();
  wireHeroLanguageAction();
  applyLanguage(getStoredLanguage());
  setLanguageMenuOpen(false);
})();