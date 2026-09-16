# Интерфейсы

Читается **до** первой строки кода. Здесь границы, решённые в спецификации,
и правила проекта, которые из репозитория не выводятся.

## Правила проекта

- **Стек:** Next.js 15 (App Router) · React 19 · TypeScript strict · GSAP 3 +
  ScrollTrigger · Lenis · Framer Motion · Vitest · Playwright (Chromium уже
  в окружении, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, **не** запускать
  `playwright install`).
- **Сборка — статический экспорт** (`output: 'export'`). Значит: нет `middleware`,
  нет route handlers, нет server actions, `next/image` с `unoptimized: true`.
- **Команды:** `npm run dev` · `npm run build` · `npm test` (Vitest) ·
  `npm run test:e2e` (Playwright) · `npm run lint` · `npm run check:config`.
- **Язык кода и комментариев** — английский. Язык текстов сайта — в словарях.
- **Чего не трогать:** `docs/`, `public/references/` (исходники заказчика),
  `.autopilot/`, `CLAUDE.md`.
- **Недостающая зависимость — это `BLOCKED`, а не `npm i` по своему усмотрению.**
  Всё, что нужно, ставит таск 01; если тебе нужно что-то сверх — верни `BLOCKED`
  с названием пакета и зачем.
- **Ни одного факта о студии в коде.** Название, телефон, адрес, соцсети, цены,
  цифры счётчиков — только из `config/studio.config.ts`, и только заглушками,
  пока владелец не впишет своё. Выдуманный телефон хуже пустого.
- **Никаких секретов.** Если что-то похоже на ключ — имя переменной в
  `.env.example`, значение никуда.

## Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| `config/studio.config.ts` | фактами студии-заглушками | `studio: StudioConfig`, `isPlaceholder(v: string): boolean`, `hasValue(v): boolean` | формат заглушки |
| `content/` | текстами трёх языков | `getDictionary(locale): Dictionary`, `locales`, `defaultLocale`, тип `Dictionary` | загрузку и слияние json |
| `lib/i18n` | выбором языка | `negotiateLocale(accepted: readonly string[]): Locale`, `localePath(locale, path)` | порядок предпочтений |
| `lib/motion` | всем скроллом и таймлайнами | `<MotionProvider/>`, `useScene(id, build)`, `useReducedMotionSafe()`, `SCENE_IDS` | GSAP, ScrollTrigger, Lenis, rAF, refresh, cleanup |
| `lib/format` | форматированием | `formatPrice(v, locale)`, `formatPhoneHref(v)` | локальные правила |
| `components/ui/PillButton` | видом всех кнопок | `<PillButton variant href onClick/>` | стекло, тень, состояния |
| `components/decor` | лепестками и дугами | `<Petals count/>`, `<Arcs/>` | спрайты размытия, геометрию дуг |
| `components/FlashTransition` | склейкой между сценами | `<FlashTransition id/>`, `flashDuration` | фильтры bloom и лимиты яркости |
| `components/GlowCursor` | курсором | `<GlowCursor/>` | rAF-цикл и определение указателя |
| `components/LaserReveal` | сценой лазера | `<LaserReveal/>` | маску, штрихи волос, слои фото |
| `components/SkinLayers` | разрезом кожи | `<SkinLayers/>` | SVG-геометрию |
| `components/Stats` | счётчиками | `<Stats/>` | анимацию чисел |
| `components/HeroSection`, `HowItWorks`, `Benefits`, `CTA`, `SiteHeader`, `SiteFooter` | своим экраном | компонент без пропсов | вёрстку |

## Кто чем владеет между тасками — чтобы не столкнуться

- **`app/[locale]/page.tsx` пишет только таск 01** и сразу собирает страницу из
  всех секций-заглушек. Таски 03–05 наполняют **только свои папки** внутри
  `components/` и ничего не добавляют на страницу.
- **`app/globals.css` и токены палитры — только таск 01.** Остальные пишут
  CSS-модули рядом со своим компонентом и пользуются токенами.
- **`lib/motion/scene-ids.ts` — только таск 02**, и все 13 id заводятся там
  сразу. Секции берут свой id оттуда, не придумывают строку.
- **`config/` и `content/` — только таск 01.** Нужен новый ключ словаря —
  добавляй в **свою** секцию словаря (`dictionary.sections.<твоя>`), тип
  расширяется там же, в трёх файлах сразу.

## Швы для тестов — два, и оба уже существуют как границы

1. **Чистые функции**: `lib/i18n`, `lib/format`, `config`, полнота `content` — Vitest.
2. **Отрендеренная страница целиком** — Playwright.

Внутрь `lib/motion` тесты не лезут: она проверяется через второй шов
(«после прокрутки сцены N на экране то-то»), иначе каждый тюнинг таймлайна
ломает тесты.

## Что появилось по ходу сборки

### Из таска 01 — каркас

**Команды (проверены):** `npm run dev` · `npm run build` (статический экспорт в `out/`,
7 страниц) · `npm test` (Vitest, один файл — `npm test -- <path>`) ·
`npm run test:e2e` (Playwright) · `npm run lint` · `npx tsc --noEmit` ·
`npm run check:config`.

**Языки**
- `content/locales`: `locales` = readonly `['de','en','ru']`, тип `Locale`,
  `defaultLocale`, `isLocale(v: string): v is Locale`
- `content`: `getDictionary(locale: Locale): Dictionary`; типы `Dictionary`,
  `SectionText {eyebrow,title,lead}`, `HeroText {eyebrow,titleLine1,titleLine2,subtitle,lead,scrollCta}`
- секции словаря: `sections.{hero,laserReveal,skinLayers,howItWorks,benefits,prices,stats,cta}`
  плюс `nav`, `footer`, `legal`, `meta`. **Новые ключи дописывай только внутрь своей секции,
  сразу в три файла** — иначе `tsc` красный
- `lib/i18n`: `negotiateLocale(accepted: readonly string[]): Locale`,
  `localePath(locale: Locale, path?: string): string` (со слешем на конце)

**Факты студии и форматирование**
- `config/studio.config`: `studio: StudioConfig`, `isPlaceholder(v)`, `hasValue(v)`,
  типы `PriceZone`, `StatItem`
- `lib/format`: `formatPrice(value: number, locale: Locale): string`,
  `formatPhoneHref(phone: string): string` (пустая строка, если заглушка)
- `lib/contact`: `callHref(): string|null`, `bookingHref(): string|null`,
  `activeSocials(): {id,href}[]`, `activeMessengers(): {id,href}[]` —
  **не пиши свою логику «заполнено или нет», бери отсюда**

**Вёрстка**
- `components/ui/PillButton`: `<PillButton variant='solid'|'ghost' size='sm'|'md'|'lg' href? onClick? disabled? />`
  — **единственный способ нарисовать кнопку**
- `components/ui/ConfigValue`: `<ConfigValue value note />` — заглушка с `data-placeholder`
- `components/layout/SiteHeader`: `<SiteHeader locale dictionary />`, `NAV_SECTIONS`, `SECTION_ANCHORS`
- `components/layout/SiteFooter`: `<SiteFooter locale dictionary />`
- Секции: `<HeroSection|LaserReveal|SkinLayers|HowItWorks|Benefits|Stats|CTA dictionary={Dictionary} />`
  — якоря `hero`, `laser-reveal`, `skin-layers`, `how-it-works`, `benefits`, `stats`, `cta`
- Токены в `app/globals.css`: `--peach --rose --lilac --sand --ink` (+ `*-rgb`),
  `--radius-card/pill`, `--blur-glass`, `--shadow-card/pill`,
  `--font-display/accent/sans`, `--step-*`, `--gutter`, `--section-space`,
  `--page-inset`, `--ease-soft`
- Глобальные классы: `.glassCard .meshGradient .contentWidth .eyebrow .lead .visuallyHidden .skipLink`
  — **ими и пользуйся**, не делай второй стеклянной карточки

**Решения, которые надо знать**
- `@playwright/test` закреплён на **1.56.0** — только эта версия совпадает
  с chromium-1194 в `/opt/pw-browsers`. Не обновляй, `playwright install` запрещён.
- `npm run check:config` читает `.ts`-конфиг напрямую через `--experimental-strip-types`,
  второго источника правды нет.
- Шапка сделана `sticky` **над** карточками, а не внутри карточки hero —
  чтобы переживать pin сцен. Если таску 03 нужно внутрь карточки,
  правится только `components/layout/SiteHeader/SiteHeader.module.css`.
- Компонента цен нет: в §4 её нет среди семи секций. Секция словаря
  `sections.prices` заведена, блок цен ставит **таск 05**.

### Из таска 02 — мотор анимации

**Сцены**
- `lib/motion`: `SCENE_IDS` — 13 ключей сценария §4: `heroFade, pinHero,
  flashHeroToLaser, handReveal, hairDissolve, flashLaserToSkin, skinLayers,
  flashSkinToCards, cards, flashCardsToCounter, counter, flashCounterToCta, cta`;
  плюс `SCENE_SEQUENCE`, `FLASH_SCENE_IDS`, типы `SceneId`, `FlashSceneId`
- `isSceneId(v)`, `isFlashScene(id)`, `nextSceneId(id)`, `flashAfter(id)`
- **`useScene<T>(id, build, options?) => RefObject<T|null>`** — единственный способ
  завести прокруточную анимацию. Свой `useEffect` с GSAP или ScrollTrigger писать нельзя.
  - `build = ({ root, timeline, reducedMotion, pinned }) => void`
  - `options = { pin?: boolean /* по умолчанию true */, lengthVh?: number /* 100 */,
    start?: string /* 'top top' */, scrub?: number|boolean /* true */ }`
  - **pin включён по умолчанию** — секции, которой закрепление не нужно,
    надо явно передать `{ pin: false }`
  - **Один `SceneId` может регистрировать несколько секций** — именно так задуман
    шаг 9 `cards` (How It Works + Benefits). Каждая регистрация независима: свой
    ScrollTrigger, свой таймлайн, свой pin, своя уборка. Порядок в сценарии задаёт
    **вёрстка**, а не порядок регистрации. Части различаются в DOM как
    `data-scene="cards"` + `data-scene-part="0|1"` (индекс проставляет провайдер).
    Вспышку шва запрашивает каждая часть, лимитер 600 мс схлопывает дубль.
- `useScrollProgress(cb)` — единственный способ для дрейфа вне таймлайна сцены
- `useReducedMotionSafe(): boolean`, `useMotionRuntime(): MotionRuntime|null`

**Вспышка и декор — уже смонтированы, второй раз не ставь**
- `<MotionProvider>` смонтирован в `app/[locale]/layout.tsx` и сам рендерит
  `<Arcs/>`, `<Petals/>` и все пять `<FlashTransition/>`
- `<FlashTransition id={SceneId} />`, `flashDuration = 160`,
  `FLASH_MIN_GAP_MS = 600`, `DIM_DURATION_MS = 180`, `createFlashLimiter(minGapMs?)`
- `components/FlashTransition/flash-phases.ts` — `FLASH_PHASES`: вспышка 0–160 мс
  (пик 56 мс), **bloom стартует на 160 мс**, строго после спада вспышки, живёт до
  560 мс. Пики: flash 0.26, bloom 0.22, dim 0.05 — подобраны так, чтобы перепад
  яркости композита над каждым фоном палитры был < 0.1. **Менять их нельзя
  на глаз**: `tests/flash.test.ts` сэмплирует таймлайн по 1 мс и считает WCAG-яркость
  композиции всех активных слоёв.
- `relativeLuminance(hex)`, `composite(under, over, alpha)`,
  `luminanceDelta(backdrop, layer, alpha)`, `FLASH_PEAK_OPACITY = 0.26`, `DIM_PEAK_OPACITY = 0.05`
- `<Petals count? />` (9 по умолчанию, 3 глубины, часть за краем), `<Arcs />` (5 дуг, 1 px),
  `petalSprite(depth)`

**Крючки для e2e:** `html[data-motion="full"|"reduced"]`, `section[data-scene]`,
`[data-scene-pinned]`, `[data-flash]`, `[data-decor]`.

**Решения, которые надо знать**
- Lenis подключён к тикеру GSAP — **один rAF на весь сайт**. Своего `requestAnimationFrame`
  цикла не заводи.
- CSS для Lenis отдан через React 19 `<style precedence>` внутри провайдера,
  чтобы не трогать `app/globals.css`.
- В этом Playwright `test.use({ reducedMotion: 'reduce' })` до браузера не доезжает —
  в e2e нужен `page.emulateMedia({ reducedMotion: 'reduce' })`.
- Путь «регистрация → pin → скраб в обе стороны» проверен живой сценой:
  `lib/motion/SceneFixture.tsx` регистрирует две части под одним id `cards`,
  e2e прокручивает вперёд и назад. Фикстура включается только `?motion-fixture=1`
  и только в dev — в `out/` её нет.

### Из таска 05 — кожа, шаги, преимущества, цены, счётчики, CTA

- `components/SkinLayers/skin-geometry`: `SKIN_LAYERS`, `BEAM`, `FOLLICLE_BULB`,
  `FOLLICLE_SHAFT`, `VIEW_BOX`, `LABEL_X`, типы `SkinLayer`, `SkinLayerId`
- `components/CTA/cta-action`: `ctaAction(booking, call) => {kind:'booking'|'call'|'none', href, disabled}`
  — **три состояния кнопки записи, свою логику не пиши**
- `components/Prices/price-rows`: `priceRows(zones, locale)`; `<Prices dictionary />`;
  `usePageLocale(): Locale`
- `components/Stats/stat-slots`: `statSlots(stats, locale, pendingLabel)`,
  `formatCount(value, locale)`, `PLACEHOLDER_SLOTS = 3`
- `components/Benefits/card-hover`: `HOVER_LIFT`, `HOVER_SPRING` — **единственное место
  Framer Motion в секциях** (hover карточек). Курсор и меню — таск 06.
- Типы словаря из `@/content`: `SkinLayersText, HowItWorksText, BenefitsText,
  PricesText, StatsText, CtaText, StepText, BenefitText, SkinLayerName`
- Крючки для e2e: `[data-layer]`, `[data-beam]`, `[data-step]`, `[data-benefit]`,
  `[data-price-row]`, `[data-stat]`, `[data-stat-value]`, `[data-stat-number]`,
  `[data-cta-row]`, `[data-cta-unavailable]`

**Что надо знать про шаг 9.** Под id `cards` теперь зарегистрированы три части:
How It Works (0), Benefits (1) и `<Prices>` внутри Benefits (2, `pin: false`).
`<Prices>` стоит внутри Benefits — `app/[locale]/page.tsx` не тронут.
Когда владелец впишет зоны цен, вспышку шва `flash-cards-to-counter` начнёт
запрашивать именно она как последняя часть шага.

**Известная поломка, чинит таск 06:** `lib/motion/SceneFixture` делит id `cards`
с живыми секциями, поэтому её части сместились с 0/1 на 2/3 и
`e2e/motion.spec.ts:86` красный. Либо фикстура берёт собственный id, либо тест
сравнивает индексы относительно.

### Из таска 03 — hero

- `components/HeroSection/hero-melt`: `HERO_MELT: readonly MeltStep[]`,
  `MeltStep {target,start,end,shiftRem}`, `MeltTarget = 'title'|'subtitle'|'cta'`,
  `HERO_MELT_BLUR_PX`, `meltStep(target)`, `meltSelector(target)`
- Крючки для e2e: `[data-hero-card]`, `[data-hero-melt="title|subtitle|cta"]`
- Hero регистрирует **две** сцены §4: `pin-hero` (pin, 120vh, владеет швом вспышки)
  и `hero-fade` (без pin, 120vh). Обе через `useScene`, своего GSAP нет.
- Hero подтянут под sticky-шапку отрицательным `margin-top` из тех же токенов,
  что и сама шапка (`2*--page-inset + 3.875rem`). **Меняешь высоту шапки —
  меняется и это**; расхождение ловит e2e «card fills the first screen».
- `sections.hero.eyebrow` и `sections.hero.lead` больше не рендерятся: на референсе
  над заголовком и под подзаголовком ничего нет. Ключи в словарях остались.

### Из таска 04 — Laser Reveal

- `scripts/prepare-assets.mjs` — **запускается руками** (`node scripts/prepare-assets.mjs`),
  детерминирован, из `npm run build` не вызывается. Результат в `public/scenes/` закоммичен.
- `components/LaserReveal/scene-assets.ts` (**генерируется скриптом, руками не править**):
  `SceneImage {id,width,height,placeholder,blurDataUri,sources[],src}`, `LEG_BEFORE`,
  `LEG_AFTER`, `SCENE_WIDTHS = [250,374,498]`, `SCENE_ASPECT_RATIO`
- `components/LaserReveal/laser-geometry.ts`: `STAGE {width:498,height:720}`, `REVEAL_END`,
  `shinEdgeX(y)`, `maskEdgeY(p)`, `progressAtY(y)`, `shinPointAt(p) => {x,y,angle}`,
  `createHairStrokes(count?, seed?)`
- Крючки для e2e: `[data-scene="hand-reveal"][data-laser-progress]`,
  `[data-laser-photo="idle|loading|ready|failed"]`, `[data-laser-layer]`,
  `[data-laser-hairs]`, `[data-laser-applicator]`, `[data-laser-unavailable]`
- Словарь: `sections.laserReveal` + `photoAlt`, `beforeLabel`, `afterLabel`, `photoUnavailable`

**Решения, которые надо знать**
- **Ладонь — фолбэк из спецификации**: нарисованный SVG-аппликатор, а не вырез из фото.
  Кисть на снимке лежит на коже того же тона без контраста по границе, запястье уходит
  за край кадра — любой clip-path тащит по голени висящий обрубок. Фотографическая
  ладонь осталась в финальном кадре `leg-after`.
- Две половины исходника не сведены: нога справа стоит на ~250 px левее и под другим
  углом. Скрипт измеряет силуэт в обеих половинах, сдвигает «после» на 249 px и режет
  общее окно 498×720.
- Секция держит **два** шага §4: `hand-reveal` (весь показ, 140vh) и `hair-dissolve`
  (осевший кадр, 80vh) — второй нужен, чтобы у вспышки `flash-laser-to-skin` был владелец.

**Для таска 06:** лепестки декора дрейфуют поверх фотокарточки и ложатся на снимок
крупным светлым пятном. Это видно только на собранной странице — посмотреть на интеграции.

### Поправки после ревью волны 3

- **Фикстура сцен больше не делит id с плёнкой.** `OFFSTAGE_SCENE_IDS =
  { fixtureStep: 'offstage-fixture', fixtureFlash: 'flash-offstage-fixture' }`,
  тип `RegisterableSceneId = SceneId | OffstageSceneId`. Провайдер по-прежнему
  вешает ровно пять оверлеев вспышки плёнки; фикстура монтирует свой.
  Юнит-тест стережёт, что offstage-id не попадают ни в 13 шагов, ни в 5 вспышек.
- **Дребезг на шве.** На границе pin сдвигает раскладку, и `onLeave` владельца
  срабатывал несколько раз подряд — вспышка била дважды за проход. Теперь
  пересечение взводится заново только после прохода назад на десятую часть
  длины сцены. Если будешь трогать логику шва — мутант «запрос вспышки от
  каждой части» обязан ронять `e2e/motion.spec.ts`.
- `<Prices>` пока отрендерен внутри Benefits в обход `app/[locale]/page.tsx`.
  Таск 07 владеет страницей и ставит его на место.
- `ctaAction` читает `hasValue(studio.bookingUrl)` напрямую из конфига, хотя
  правильный дом для этой проверки — `hasBookingService()` в `lib/contact`
  рядом с `bookingHref()`. Правда о `bookingUrl` разошлась на два места.

### Из таска 06 — курсор, меню, сборка плёнки

- `lib/motion/timeline.ts`: `DESKTOP_SCENARIO`, `FILM_STOPS: readonly FilmStop[]`
  (`{id: SceneId; anchor: string; key: FilmStopKey}`), `stopAnchors()`,
  `MOBILE_SCENE_SCALE = 0.5`, `scenarioLengthVh(id, lengthVh, desktop)`.
  **Сценарий живёт здесь одним экземпляром** — `MotionProvider` берёт длины
  отсюда, шапка выводит из `FILM_STOPS` свои пункты.
- `<GlowCursor/>`, `<NavMenu items openLabel closeLabel/>` (`NavMenuItem {href,label}`),
  `<SceneProgress dictionary/>` — смонтированы в `app/[locale]/layout.tsx`.
- Крючки e2e: `[data-glow-cursor][data-cursor-over="idle|interactive"]`,
  `[data-cursor-ripple][data-ripple-seq]`, `[data-nav-menu]`, `[data-nav-toggle]`,
  `[data-scene-progress] [data-stop][data-current]`, `[data-scene][data-scene-length]`
- **`--header-bar` в `styles/tokens.css`** — высота панели шапки, одно число.
  Повторённого `3.875rem` в hero больше нет.
- **Лепесток на фото решён слоями:** акт Laser Reveal встаёт поверх слоя декора
  (`z-index 4`), потому что поднять лепесток нельзя — корень сцены и стеклянная
  карточка каждый открывают свой стекинг-контекст. Над остальными секциями
  лепестки по-прежнему сверху.
- Рельс индикатора `aria-hidden`, метки вне таб-порядка: те же адреса есть
  в меню с клавиатурным контрактом, дубль ломал бы «порядок табов = визуальный».
- Ripple — один элемент, перезапускаемый на каждый клик: стопка волн невозможна
  by construction.
