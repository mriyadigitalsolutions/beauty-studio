window.STATE =
{
  "slug": "laser-epilation-landing",
  "dir": "2026-09-16-laser-epilation-landing--wip",
  "title": "Лендинг студии лазерной эпиляции",
  "mode": "semi",
  "depth": "deep",
  "polish": { "rounds": 0, "maxRounds": 3, "findings": [] },
  "tier": "T2",
  "briefFile": "2026-09-16-brief.md",
  "memoryFile": "CLAUDE.md",
  "skillDir": "/home/user/beauty-studio/.claude/skills/autopilot",
  "startedAt": "2026-09-16T13:10:26+00:00",
  "updatedAt": "2026-09-16T16:50:07+00:00",
  "finishedAt": null,
  "stages": [
    { "id": "preflight", "status": "done", "finishedAt": "2026-09-16T13:10:48+00:00", "startedAt": "2026-09-16T13:10:26+00:00" },
    { "id": "manifest",  "status": "done", "finishedAt": "2026-09-16T13:12:19+00:00", "startedAt": "2026-09-16T13:10:48+00:00" },
    { "id": "briefing",  "status": "done", "finishedAt": "2026-09-16T15:38:31+00:00", "startedAt": "2026-09-16T13:12:19+00:00" },
    { "id": "spec",      "status": "done", "finishedAt": "2026-09-16T15:46:45+00:00", "startedAt": "2026-09-16T15:38:31+00:00" },
    { "id": "plan",      "status": "done", "note": "7 тасков, ярус T2, 5 волн", "finishedAt": "2026-09-16T15:50:37+00:00", "startedAt": "2026-09-16T15:46:45+00:00" },
    { "id": "build",     "status": "active", "note": "2 из 7 тасков готовы", "startedAt": "2026-09-16T15:50:37+00:00" },
    { "id": "review",    "status": "active", "startedAt": "2026-09-16T16:20:59+00:00", "note": "проверено 2 из 7" },
    { "id": "final",     "status": "pending" }
  ],
  "requirements": {
    "total": 59, "done": 31, "inTicket": 27, "inSpec": 0,
    "placeholder": 0, "deferred": 1, "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "startedAt": "2026-09-16T15:50:56+00:00",
      "title": "Каркас: проект, палитра, шрифты, три языка, конфиг студии",
      "requirements": [
        "R01",
        "R02",
        "R05",
        "R06",
        "R07",
        "R08",
        "R30",
        "R31",
        "R32",
        "R38",
        "R48i",
        "R53i",
        "R57",
        "A02"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "app/",
        "config/",
        "content/",
        "lib/i18n/",
        "lib/format/",
        "components/ui/",
        "components/layout/"
      ],
      "status": "done", "finishedAt": "2026-09-16T16:20:59+00:00", "commit": "c95826d", "tests": { "passed": 52, "failed": 0 },
      "retries": 0,
      "repairs": 1, "repairFindings": ["выдуманные факты о студии в словарях (аппарат, протокол, длительность, число сеансов) — R06", "currency EUR готовым значением вместо заглушки — R06", "нет папки styles/ из структуры брифа — R38"],
      "handoffs": 0
    },
    {
      "id": "02",
      "startedAt": "2026-09-16T16:07:00+00:00",
      "title": "Мотор: скролл, реестр сцен, вспышка, декор",
      "requirements": [
        "R09",
        "R10",
        "R11",
        "R12",
        "R24",
        "R25",
        "R33",
        "R39",
        "R40",
        "R41",
        "R42",
        "R56"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "lib/motion/",
        "components/FlashTransition/",
        "components/decor/"
      ],
      "status": "done", "finishedAt": "2026-09-16T16:50:07+00:00", "commit": "7f903ea", "tests": { "passed": 55, "failed": 0 },
      "retries": 0,
      "repairs": 2, "repairFindings": ["коллизия SceneId cards в реестре сцен — две секции волны 3 на один id — R24/R33", "will-change снимается не с тех узлов — R40", "bloom не отдельная фаза после вспышки — R25", "порог яркости меряется по одному слою, а видно композит — R25.1", "главный критерий (pin+скраб) не покрыт тестом, способным покраснеть", "регрессия от первой починки: вспышка шва срабатывает дважды за шаг 9 — по разу на каждую подсцену"],
      "handoffs": 0
    },
    {
      "id": "03",
      "startedAt": "2026-09-16T16:50:07+00:00",
      "title": "Hero: первый экран по референсу",
      "requirements": [
        "R03",
        "R14",
        "R16",
        "R17",
        "R18",
        "R20",
        "R54",
        "R55"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 3,
      "zone": [
        "components/HeroSection/"
      ],
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "04",
      "startedAt": "2026-09-16T16:50:07+00:00",
      "title": "Laser Reveal: подготовка фото и сцена",
      "requirements": [
        "R04",
        "R13",
        "R21",
        "R22",
        "R23"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 3,
      "zone": [
        "scripts/",
        "public/scenes/",
        "components/LaserReveal/"
      ],
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "05",
      "startedAt": "2026-09-16T16:50:07+00:00",
      "title": "Остальные сцены: кожа, шаги, преимущества, счётчики, CTA",
      "requirements": [
        "R26",
        "R27",
        "R28",
        "R29",
        "R34",
        "R35",
        "R49i",
        "A02"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 3,
      "zone": [
        "components/SkinLayers/",
        "components/HowItWorks/",
        "components/Benefits/",
        "components/Stats/",
        "components/CTA/",
        "components/Prices/"
      ],
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "06",
      "title": "Курсор, меню и сборка 13 шагов в один сценарий",
      "requirements": [
        "R15",
        "R19",
        "R33",
        "R36",
        "R37",
        "R47i",
        "R50i",
        "A01"
      ],
      "blockedBy": [
        "03",
        "04",
        "05"
      ],
      "wave": 4,
      "zone": [
        "components/GlowCursor/",
        "components/layout/NavMenu/",
        "components/SceneProgress/",
        "lib/motion/timeline.ts"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "07",
      "title": "Доступность, скорость, SEO и юридические страницы",
      "requirements": [
        "R42",
        "R43",
        "R44",
        "R45",
        "R46",
        "R51i",
        "R52i",
        "G01"
      ],
      "blockedBy": [
        "06"
      ],
      "wave": 5,
      "zone": [
        "app/[locale]/impressum/",
        "app/[locale]/datenschutz/",
        "public/og/",
        "public/icons/",
        "tests/e2e/"
      ],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    }
  ],
  "singlePass": null,
  "tests": { "passed": 55, "failed": 0 },
  "debt": { "placeholders": ["R06 — название, телефон, адрес, соцсети, цены, валюта, цифры счётчиков, реквизиты Impressum: 21 поле в config/studio.config.ts", "G01 — юридический текст Impressum и Datenschutz"], "assumptions": ["Didot заменён на Bodoni Moda — веб-лицензии на Didot нет", "Гротеск Inter добавлен для мелкого текста — на референсе подзаголовок гротеском, а три серифа на подписях нечитаемы", "Статический экспорт вместо сервера — лендинг кладётся на любой хостинг", "Шапка sticky над карточками, а не внутри карточки hero — чтобы переживать pin сцен"], "emptyEnv": [] },
  "additions": [],
  "coverage": { "findings": 12, "missing": 8, "halfCovered": 4, "fixed": 12,
    "note": "G2 нашёл 8 пропусков (кнопки шапки, нижняя кнопка hero, дуги, стиль pill-кнопок, гротеск, ключ референса только на hero, порядок спринтов, Didot) и 4 полупокрытия (палитра не выписана, pin только у двух сцен, роль Cormorant, палитра Skin Layers). Все 12 закрыты правкой спецификации; 5 стали новыми строками манифеста R54-R58." },
  "concerns": [
  "tests/flash.test.ts — палитра записана литералами третий раз (после globals.css и tests/palette.test.ts)",
  "components/FlashTransition/luminance.ts — формула относительной яркости WCAG реализована второй раз, такая же в tests/palette.test.ts",
  "e2e/motion.spec.ts — фокус ставится из JS вместо нажатия Tab, якорная ссылка не проверяется вовсе",
  "e2e/motion.spec.ts — toBeAttached вместо toBeVisible: секция, спрятанная display:none, тест пройдёт",
  "MotionProvider.tsx — ключ motion:scroll один на весь сайт: Impressum и Datenschutz восстановят офсет лендинга",
  "MotionProvider.tsx — «уменьшить анимацию» спрашивается тремя способами (useState, геттер рантайма, useReducedMotionSafe)",
  "Petals.tsx — лепестки ниже брейкпоинта скрыты display:none, но всё равно твинятся",
  "коммит c95826d (таск 01) унёс в себя tests/flash.test.ts, tests/scene-ids.test.ts и правку app/[locale]/layout.tsx — файлы таска 02; точка отката таска 01 шире, чем должна быть",
    "app/(distributor)/page.tsx — инлайн-скрипт повторяет логику negotiateLocale вместо того, чтобы порождаться из неё",
    "app/globals.css — *-rgb каналы синхронизируются с hex вручную, ни один тест не ловит расхождение",
    "tests/palette.test.ts — контраст считается по константам теста, а не по токенам из globals.css",
    "SiteHeader.tsx — якоря секций живут в трёх местах (id секции, SECTION_ANCHORS, SECTION_IDS в e2e), связь ничем не проверена",
    "playwright.config.ts — e2e идёт против next dev, а поставляется статический экспорт out/",
    "app/(distributor)/page.tsx — LOCALE_NAMES типизирован Record<string,string>, новый язык не уронит tsc",
    ".env.example — NEXT_PUBLIC_ANALYTICS_ID не читает ни один файл (лишняя переменная)",
    "lib/contact — нового модуля нет в «Границах и швах» спецификации (поверхность не дублирует, но карта не совпадает)"
  ],
  "reviewers": { "manifestSpec": "a0dadd662daa76a63", "craft": "a039a3e3c1a526671" },
  "blind": null
}
