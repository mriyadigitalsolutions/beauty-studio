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
  "updatedAt": "2026-09-16T15:50:56+00:00",
  "finishedAt": null,
  "stages": [
    { "id": "preflight", "status": "done", "finishedAt": "2026-09-16T13:10:48+00:00", "startedAt": "2026-09-16T13:10:26+00:00" },
    { "id": "manifest",  "status": "done", "finishedAt": "2026-09-16T13:12:19+00:00", "startedAt": "2026-09-16T13:10:48+00:00" },
    { "id": "briefing",  "status": "done", "finishedAt": "2026-09-16T15:38:31+00:00", "startedAt": "2026-09-16T13:12:19+00:00" },
    { "id": "spec",      "status": "done", "finishedAt": "2026-09-16T15:46:45+00:00", "startedAt": "2026-09-16T15:38:31+00:00" },
    { "id": "plan",      "status": "done", "note": "7 тасков, ярус T2, 5 волн", "finishedAt": "2026-09-16T15:50:37+00:00", "startedAt": "2026-09-16T15:46:45+00:00" },
    { "id": "build",     "status": "active", "startedAt": "2026-09-16T15:50:37+00:00" },
    { "id": "review",    "status": "pending" },
    { "id": "final",     "status": "pending" }
  ],
  "requirements": {
    "total": 59, "done": 0, "inTicket": 58, "inSpec": 0,
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
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "02",
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "03",
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "04",
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "05",
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
      "status": "pending",
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
  "tests": null,
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": [],
  "coverage": { "findings": 12, "missing": 8, "halfCovered": 4, "fixed": 12,
    "note": "G2 нашёл 8 пропусков (кнопки шапки, нижняя кнопка hero, дуги, стиль pill-кнопок, гротеск, ключ референса только на hero, порядок спринтов, Didot) и 4 полупокрытия (палитра не выписана, pin только у двух сцен, роль Cormorant, палитра Skin Layers). Все 12 закрыты правкой спецификации; 5 стали новыми строками манифеста R54-R58." },
  "concerns": [],
  "reviewers": { "manifestSpec": null, "craft": null },
  "blind": null
}
