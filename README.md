<div align="center">
  
<img width="128" height="128" alt="icon-128" src="https://github.com/user-attachments/assets/c34aa6a6-1e47-43ad-af56-4f9e55ff3bfb" />

# SiftGet

**Open a random video you haven't watched yet from the YouTube channel you're currently on.**

The one the algorithm will never surface. The pick is framed as a **lottery reel** — press, the videos spin, one drops out.

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)]()
[![Feature-Sliced Design](https://img.shields.io/badge/architecture-FSD-7c3aed)]()

</div>

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
  - [1. Get a YouTube Data API v3 key](#1-get-a-youtube-data-api-v3-key)
  - [2. Build](#2-build)
  - [3. Load in Chrome](#3-load-in-chrome)
  - [4. Add your key & spin](#4-add-your-key--spin)
- [Settings](#settings)
- [How "watched" is determined](#how-watched-is-determined)
- [Backup: export / import](#backup-export--import)
- [How it works](#how-it-works)
- [Project structure (FSD)](#project-structure-feature-sliced-design)
- [Development](#development)
- [Limitations](#limitations)
- [Privacy](#privacy)
- [Author](#author)

---

## What it does

You open a YouTube channel (or one of its videos), click the SiftGet icon, and press **SPIN THE REEL**.
SiftGet fetches the channel's full upload list once, remembers what you've already seen, and opens a
**random unwatched** video — with a slot‑machine reveal so you can **reroll** before committing.

- 🎰 Random **unwatched** pick per channel, with a reveal + **reroll** before opening
- 🔑 Uses **your own** YouTube Data API v3 key — no backend, no shared quota
- 🎞️ Caches each channel's uploads (auto‑refresh once/day + manual refresh)
- ✅ Tracks watched **per channel** from three sources (see [below](#how-watched-is-determined))
- ⬇️ One‑click **Sync watched** — auto‑scrolls the channel's Videos page and imports what YouTube marks as watched
- 🌍 English / Русский / Українська
- 💾 **Export / import** all your settings and history as a file
- 🎬 Optional: include Shorts, pull *any* random video (ignore watched), count browser history

## Tech stack

| Area | Choice |
| --- | --- |
| Language | **TypeScript** (strict) |
| UI | **React 18** |
| Build | **Vite** + [`@crxjs/vite-plugin`](https://crxjs.dev/) (MV3) |
| Styling | **Tailwind CSS v4** (design tokens via `@theme`) |
| Architecture | **Feature‑Sliced Design** (`app / pages / widgets / features / entities / shared`) |
| Async state | **TanStack Query** |
| HTTP | **axios** (with the `fetch` adapter — required in the MV3 service worker) |
| Animation | **Motion** (Framer Motion) |
| Fonts | self‑hosted **Archivo** + **Space Mono** via `@fontsource` |

`npm run build` runs a strict `tsc --noEmit` before the Vite build.

---

## Quick start

### 1. Get a YouTube Data API v3 key

SiftGet never ships a key — you use your own. The free tier (10,000 quota units/day) is plenty for personal use.

1. Open the **[Google Cloud Console](https://console.cloud.google.com/)** and create (or pick) a project.
2. **APIs & Services → Library** → search **"YouTube Data API v3"** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → API key** → copy it.
4. *(Optional, recommended)* **Restrict key → API restrictions → YouTube Data API v3.**
   Leave **Application restrictions** as **None** — HTTP‑referrer/website restrictions block requests from a
   `chrome-extension://` origin, so the key wouldn't work.

### 2. Build

Requirements: **Node.js 18+**.

```bash
npm install
npm run build        # → produces ./dist  (this is what Chrome loads)
```

`prebuild` rasterizes the app icons from `src/shared/assets/icon.svg`. Regenerate them alone with `npm run icons`.

### 3. Load in Chrome

1. Go to `chrome://extensions`.
2. Turn on **Developer mode** (top‑right).
3. Click **Load unpacked** and select the **`dist/`** folder.
4. Pin **SiftGet** to the toolbar.

> After each `npm run build`, click the **↻ reload** button on the SiftGet card in `chrome://extensions`.

### 4. Add your key & spin

1. Right‑click the icon → **Options** (or the menu button inside the popup).
2. Paste your API key under **API key** → **Save**.
3. Open any channel (`youtube.com/@handle`) or one of its videos → click the icon → **SPIN THE REEL**.
   A video is revealed; press **OPEN VIDEO** to watch it (and mark it watched), or the **reroll** button for another.

---

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| **Interface language** | English | Popup + options language (EN / RU / UK) |
| **Open in a new tab** | on | Open the picked video in a new tab vs. the current one |
| **Include Shorts** | off | Add Shorts to the reel |
| **Use browser history** | off | Count videos you opened in Chrome as watched — asks for the optional `history` permission only when turned on |
| **Use YouTube's watched state** | on | Read the red watched‑progress bar YouTube renders on the channel page (your account) and mark those videos watched. A **threshold** slider (50–100%) decides how full the bar must be — default 90% (watched to the end) |
| **Any video (ignore watched)** | off | Pull from the whole archive, not only unwatched videos |

Per channel, the options page shows a **watched / total** counter with **↻ refresh**, **Reset progress**, and **🗑 remove channel**.

---

## How "watched" is determined

The YouTube Data API **does not expose account watch history** (Google removed that in 2016), so SiftGet
combines three signals:

1. **Videos it opened itself** — the reliable baseline (marked on **OPEN VIDEO**).
2. **Chrome browser history** *(optional toggle)* — anything you opened in this Chrome profile.
3. **YouTube's own watched bar** *(on by default)* — the red progress bar YouTube renders under thumbnails on
   the channel page reflects your logged‑in account. SiftGet reads it and marks videos at/above your threshold.

For (3), tiles only count once they've actually rendered. Two ways to feed it:

- **Passively** — as you scroll the channel's **Videos** tab.
- **Actively** — press **⇊ Sync watched** in the popup. SiftGet auto‑scrolls the channel page to the bottom,
  loading tiles as it goes, harvests the watched bars, and stops when the list stops growing. A live counter shows progress.

---

## Backup: export / import

Everything SiftGet stores (settings, API key, per‑channel caches, watched history, id aliases) lives locally in
`chrome.storage.local`. On the options page, **Backup**:

- **Export** → downloads a `siftget-backup-YYYY-MM-DD.json` file.
- **Import** → restores from such a file (overwrites matching keys). Great for moving to another machine.

---

## How it works

- **Channel detection** (`src/content`): YouTube is a SPA, so a full reload isn't guaranteed between videos.
  A content script listens to `yt-navigate-finish` / `popstate` and reads the channel from the page — DOM
  microdata / canonical URL in the isolated world, plus `ytInitialData` / `ytInitialPlayerResponse` from a small
  main‑world reader. The `channelId` is taken from the page first (free) and only resolved via the API
  (`channels.list` → `search.list` as a last resort) when the page doesn't expose it. Resolved ids are cached so a
  `/@handle` never costs quota twice.
- **Video list** (`src/shared/api/youtube.ts`): `channels.list(contentDetails)` → the uploads playlist →
  `playlistItems.list` paginated to the end → `videos.list` durations for Shorts detection. Cached per channel with
  a timestamp; refreshed at most once a day or on demand.
- **The draw** (`src/entities/video/lib/select-video.ts`): filters by the Shorts setting, removes watched ids
  (unless *ignore watched* is on), and picks uniformly at random.
- **Data flow**: the popup/options use **TanStack Query** hooks (`features/*/model`) that call typed message
  helpers → the **background** service worker resolves the channel, keeps the cache fresh, picks/opens videos, and
  returns typed responses. All YouTube HTTP goes through an **axios** instance with the `fetch` adapter.

## Project structure (Feature‑Sliced Design)

```
src/
  app/            entry points (popup/options html + main.tsx), providers (Query + i18n), Tailwind theme
  pages/          PopupPage, OptionsPage
  widgets/        reel, channel-header, tracked-channels, backup, about
  features/       pick-video, channel-state, channels, sync-watched, api-key, settings, backup  (model/ + ui/)
  entities/       channel, settings, video  (domain storage + selection logic)
  shared/         api (axios youtube + typed messaging), config, i18n, lib, types, ui, assets
  background/     service worker: message router (index.ts) + channel-service (cache/resolve)
  content/        detect-channel.ts (ISOLATED) · read-ytdata.ts (MAIN) · scan-watched.ts (ISOLATED)
manifest.config.ts   Manifest V3 (crxjs defineManifest)
```

## Development

```bash
npm run dev         # Vite dev server with HMR (crxjs)
npm run typecheck   # tsc --noEmit (strict)
npm run build       # typecheck + production build → dist/
npm run icons       # regenerate PNG icons from the source SVG
```

Path alias `@/*` → `src/*`. Design tokens live in `src/app/styles/theme.css` (`@theme`).

## Limitations

- **Shorts detection** uses video duration (≤ 60s ⇒ Short) — cheap but not exact for newer 61–180s Shorts.
- **Sync watched** only imports tiles that have rendered; auto‑scroll needs the tab to be **visible** (browsers
  don't lazy‑load hidden tabs).
- **Quota**: building a large channel's list costs ~1 unit per 50 videos (list) + ~1 unit per 50 (durations).
  `search.list` (100 units) is only a last resort for legacy `/c/` and `/user/` vanity URLs.

## Privacy

The API key and all data are stored **locally** (`chrome.storage.local`) and only ever sent to
`https://www.googleapis.com`. No analytics, no backend.

## Author

Built by **Sergey Emelyanov** — [GitHub](https://github.com/VeDono) ·
[LinkedIn](https://www.linkedin.com/in/sergey-emelyanov-18082b27a/) · [X](https://x.com/SergeyEDev).
Made in Ukraine 🇺🇦
