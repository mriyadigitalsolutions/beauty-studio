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
