<!doctype html>
<html lang="ru">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Смысл игры «Ржака»</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
	<style>
		:root {
			--raspberry: #B0164D;
			--raspberry-bright: #E34A8A;
			--black: #0E0610;
			--gold: #F2B94B;
			--turquoise: #2FA4A9;
			--mask: #D6D6D2;
			--text-dark: #1c0f18;
			--text-soft: #2e1b24;
		}
		* { box-sizing: border-box; }
		html, body { height: 100%; }
		body {
			margin: 0;
			font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;
			color: var(--text-dark);
			background:
				radial-gradient(120% 80% at 50% 0%, rgba(242,185,75,0.45), transparent 65%),
				radial-gradient(80% 60% at 20% 20%, rgba(227,74,138,0.16), transparent 52%),
				radial-gradient(90% 70% at 80% 10%, rgba(47,164,169,0.14), transparent 55%),
				linear-gradient(180deg, #f9f7f4 0%, #f2f0ee 35%, #e7e4e3 100%);
			min-height: 100vh;
			overflow-y: auto;
			-webkit-font-smoothing: antialiased;
		}
		.texture::before {
			content: "";
			position: fixed;
			inset: 0;
			pointer-events: none;
			background:
				repeating-linear-gradient(135deg, rgba(0,0,0,0.022) 0, rgba(0,0,0,0.022) 6px, transparent 6px, transparent 12px),
				radial-gradient(120% 100% at 50% 10%, rgba(0,0,0,0.12), transparent 70%);
			mix-blend-mode: soft-light;
			opacity: 0.9;
			z-index: 0;
		}
		header {
			position: relative;
			padding: 64px 20px 28px;
			text-align: center;
		}
		header h1 {
			font-family: "Playfair Display", serif;
			font-weight: 700;
			font-size: clamp(28px, 4vw, 42px);
			margin: 0;
			color: var(--raspberry);
			text-shadow: 0 8px 28px rgba(176,22,77,0.18);
		}
		header p {
			margin: 14px auto 0;
			max-width: 780px;
			color: var(--text-soft);
			line-height: 1.6;
			font-size: 17px;
		}
		.pill {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 10px 14px;
			border-radius: 999px;
			background: linear-gradient(135deg, rgba(47,164,169,0.16), rgba(214,214,210,0.25));
			color: var(--black);
			font-size: 13px;
			letter-spacing: 0.4px;
			margin-top: 18px;
			box-shadow: 0 12px 28px rgba(0,0,0,0.08);
		}
		.wrap {
			position: relative;
			z-index: 1;
			max-width: 980px;
			margin: 0 auto 96px;
			padding: 0 18px 32px;
		}
		.accordion {
			border-radius: 20px;
			background: linear-gradient(135deg, rgba(176,22,77,0.08), rgba(227,74,138,0.05));
			box-shadow:
				0 24px 50px rgba(0,0,0,0.14),
				inset 0 1px 0 rgba(255,255,255,0.65);
			backdrop-filter: blur(12px);
			border: 1px solid rgba(176,22,77,0.15);
			overflow: hidden;
		}
		.item + .item { border-top: 1px solid rgba(176,22,77,0.12); }
		.toggle {
			width: 100%;
			padding: 20px 64px 20px 22px;
			text-align: left;
			background: transparent;
			color: var(--text-dark);
			border: none;
			cursor: pointer;
			position: relative;
			font-size: 18px;
			font-weight: 600;
			letter-spacing: 0.2px;
			display: flex;
			align-items: center;
			gap: 12px;
			transition: color 180ms ease, transform 180ms ease;
		}
		.toggle:hover { color: var(--raspberry); transform: translateY(-1px); }
		.toggle span.index {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 34px;
			height: 34px;
			border-radius: 10px;
			background: radial-gradient(circle at 30% 30%, rgba(242,185,75,0.9), rgba(176,22,77,0.7));
			color: var(--black);
			font-weight: 700;
			box-shadow: 0 10px 20px rgba(0,0,0,0.12);
		}
		.toggle .chevron {
			position: absolute;
			right: 18px;
			top: 50%;
			transform: translateY(-50%) rotate(0deg);
			width: 14px;
			height: 14px;
			border-right: 2px solid var(--text-dark);
			border-bottom: 2px solid var(--text-dark);
			transition: transform 200ms ease, border-color 200ms ease;
			opacity: 0.8;
		}
		.item.active .chevron { transform: translateY(-50%) rotate(45deg); border-color: var(--raspberry); }
		.panel {
			max-height: 0;
			overflow: hidden;
			transition: max-height 260ms ease;
			background: linear-gradient(180deg, rgba(214,214,210,0.22), rgba(255,255,255,0.9));
		}
		.item.active .panel { max-height: 1200px; }
		.panel-inner {
			padding: 0 22px 22px 22px;
			line-height: 1.6;
			color: var(--text-soft);
			font-size: 16px;
		}
		.panel-inner ul {
			margin: 12px 0;
			padding-left: 18px;
			color: var(--text-soft);
		}
		.panel-inner li { margin: 6px 0; }
		a { color: var(--raspberry); }
		@media (max-width: 820px) {
			header { padding: 52px 18px 24px; }
			.wrap { padding: 0 16px 28px; }
			.toggle { padding-right: 52px; font-size: 16px; }
		}
		@media (max-width: 540px) {
			body { padding-bottom: 18px; }
			.panel-inner { padding: 0 18px 18px 18px; }
			.toggle span.index { width: 30px; height: 30px; font-size: 13px; }
		}
	</style>
</head>
<body class="texture">
	<header>
		<h1>Смысл игры «Ржака»</h1>
		<p>Управляемый смех как инструмент понимания людей, ситуаций и самих себя. Это игра про роли, реакции и свободу выйти за пределы сценариев.</p>
		<div class="pill">Тон: юмор • осознание • свобода</div>
	</header>

	<main class="wrap">
		<section class="accordion" id="accordion">
			<article class="item active">
				<button class="toggle" aria-expanded="true">
					<span class="index">1</span> Поверхностный уровень — смех и разрядка
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p>Простые смешные образы, узнаваемые типажи и лёгкая провокация. Человек узнаёт себя и близких, смеётся, снимает защиту и перестаёт сопротивляться.</p>
						<ul>
							<li>Смешные образы и гротеск</li>
							<li>Узнаваемые типажи из семьи, работы, соцсетей</li>
							<li>Смех как разрядка напряжения</li>
						</ul>
					</div>
				</div>
			</article>

			<article class="item">
				<button class="toggle" aria-expanded="false">
					<span class="index">2</span> Социальный уровень — роли вместо людей
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p>В игре есть роли, а не конкретные люди: Хипи Бабушка, Фанат, Блогер, Директор, Инста-самка, Психолог, Робот, Старец и др. Мы чаще включаем повторяющиеся роли, чем действуем как уникальные личности.</p>
						<ul>
							<li>Видим тип поведения, а не «Петю»</li>
							<li>Роли повторяются у миллионов — ясность возрастает</li>
							<li>Фокус на паттернах, а не на персоналиях</li>
						</ul>
					</div>
				</div>
			</article>

			<article class="item">
				<button class="toggle" aria-expanded="false">
					<span class="index">3</span> Психологический уровень — зеркало без морализаторства
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p>Игра не обвиняет. Она показывает: «Смотри, вот роль. Ты сейчас в ней». Через юмор человек замечает автоматизмы, видит абсурд и смеётся над собой — без чувства вины.</p>
						<ul>
							<li>Осознание без обвинений</li>
							<li>Смех отключает защиту и стыд</li>
							<li>Зеркало поведения через мягкую иронию</li>
						</ul>
					</div>
				</div>
			</article>

			<article class="item">
				<button class="toggle" aria-expanded="false">
					<span class="index">4</span> Игровой уровень — столкновение ролей
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p>Смысл раскрывается в столкновениях ролей: Блогер vs Бабушка, Директор vs Ребёнок, Робот vs Психолог, Фанат vs Старец. Возникают конфликты, парадоксы, неожиданные решения.</p>
						<ul>
							<li>Тренажёр социального интеллекта</li>
							<li>Предугадывание реакций и силы ролей</li>
							<li>Понимание тупиков и способов их обойти</li>
						</ul>
					</div>
				</div>
			</article>

			<article class="item">
				<button class="toggle" aria-expanded="false">
					<span class="index">5</span> Философский уровень — свобода от роли
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p>Глубина не в выборе «лучшей» роли, а в осознании: ты не равен ни одной из них. Увидев, что «я играю роль, и могу выйти», человек получает свободу менять стратегию и не застревать в чужих сценариях.</p>
						<ul>
							<li>Наблюдение вместо автоматической реакции</li>
							<li>Свобода выйти из роли и сменить ход</li>
							<li>Меньше провокаций и чужих сценариев</li>
						</ul>
					</div>
				</div>
			</article>

			<article class="item">
				<button class="toggle" aria-expanded="false">
					<span class="index">6</span> Почему именно смех
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p>Смех — технология: он отключает страх, снижает агрессию, разрушает ложную важность. Смеющийся человек быстрее учится, легче принимает правду и лучше запоминает.</p>
						<ul>
							<li>Работает там, где лекции и нравоучения не заходят</li>
							<li>Мягкая подача сложных идей</li>
							<li>Быстрое обучение и принятие</li>
						</ul>
					</div>
				</div>
			</article>

			<article class="item">
				<button class="toggle" aria-expanded="false">
					<span class="index">Итог</span> Итог — зачем «Ржака»
					<span class="chevron"></span>
				</button>
				<div class="panel">
					<div class="panel-inner">
						<p><strong>«Ржака» — это:</strong></p>
						<ul>
							<li>Игра про роли, а не про людей</li>
							<li>Юмор как инструмент осознания</li>
							<li>Безопасный способ увидеть себя со стороны</li>
							<li>Социальный и психологический тренажёр</li>
						</ul>
						<p>Человек смеётся — потом думает — и вдруг понимает чуть больше, чем раньше. В этом и есть её смысл.</p>
					</div>
				</div>
			</article>
		</section>
	</main>

	<script>
		const items = [...document.querySelectorAll(".item")];
		items.forEach(item => {
			const btn = item.querySelector(".toggle");
			btn.addEventListener("click", () => {
				const isActive = item.classList.contains("active");
				items.forEach(i => {
					i.classList.remove("active");
					i.querySelector(".toggle").setAttribute("aria-expanded", "false");
				});
				if (!isActive) {
					item.classList.add("active");
					btn.setAttribute("aria-expanded", "true");
				}
			});
		});
	</script>
</body>
</html>

