# Webelux v2 → Astro Migration Plan

**Project:** Migrate the Elux Space marketing site from a client-side-rendered
Vite + React SPA to a static-rendered Astro site, optimized for SEO and AI search.

**Status:** Planning complete. Ready to start Phase 1 (local build first).
**Target host:** Cloudflare Pages (static output, no adapter) — DEPLOY LATER.

> ⚠️ LOCAL-FIRST: No git commits, no branch joins, no deploys until the site is
> built and verified locally with `npm run dev` / `npm run build && npm run preview`.
> Git and Cloudflare are deferred to the very end (Phase 5+). Just build and look at it.
**Source of truth:** the `devel` branch of `arya-wtf/webelx2026v2` (cloned here at `./legacy-spa`).

> New session starting here: read this whole file first. It contains the diagnosis,
> the locked-in decisions, and the phased plan. The old SPA to convert from lives in
> `./legacy-spa`. Build the new Astro project at the repo root.

---

## 1. Diagnosis (why we're doing this)

The current site is a **100% client-side-rendered SPA** (Vite + React 18, no router).
`index.html` ships an empty `<div id="root"></div>` and a script tag — **all copy lives in
JSX and only appears after JS executes in the browser.**

- **AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot)
  mostly do NOT run JS.** They read raw HTML and see a blank page. The site is
  effectively invisible to ChatGPT / Perplexity / Claude search.
- **Google** can render JS but on a slower, flakier second wave; it deprioritizes
  JS-only pages.
- The hero `<h1>` is a **character-by-character typing animation** — there is no stable
  semantic headline in the DOM even after render.

> NOTE: the original framing was "bad because of SSR." That was inverted. There is **no
> SSR**. The disease is CSR. The cure is **rendering text to HTML at build time (SSG)**.

**Cure:** Astro with `output: 'static'`. Text renders to real HTML at build; React
animation components become hydrated "islands" (`client:visible`). Crawlers get every
word with near-zero JS.

### Astro vs. prerender — why Astro
Both emit full static HTML, so for "do crawlers/AI see the text" they are a **tie**.
Astro wins only on second-order signals (near-zero baseline JS → better Core Web Vitals,
cleaner island hydration). For a content site that's already markdown-based, Astro is the
better long-term foundation. (Prerendering the existing SPA via `vite-react-ssg` was the
fast-band-aid alternative; we chose the proper migration.)

---

## 2. CMS hardcall (LOCKED)

**The real defect is NOT "per-section vs per-page."** It's that `src/content/md/site-copy.md`
stores **structured data as prose**, and `src/content/siteCopy.js` is a ~200-line **regex
parser** reverse-engineering fields out of markdown headings. That parser is brittle — any
formatting change silently breaks it. **It must die.**

### Decision: Astro Content Collections, two types, no external CMS

```
src/content/
  config.ts              ← Zod schemas (type-safe; bad content = build error)
  pages/                 ← STRUCTURED UI copy — one DATA file PER PAGE (YAML)
    home.yaml            ← every homepage section as typed nested fields
    about.yaml
  posts/                 ← LONG-FORM prose — one .mdx file PER PAGE
    my-post.mdx          ← frontmatter (SEO meta) + markdown body
```

**Rule of thumb:**
- **Structured UI copy** (eyebrows, headlines, CTAs, rotating words, ratings, cards,
  service stages) → **typed YAML data collection, one file per page.** Astro parses YAML
  natively into a typed object. **No regex. `siteCopy.js` is deleted.**
- **Long-form content** (blog posts, case studies, individual service pages) → **one
  `.mdx` per page**, frontmatter for SEO/meta, body for prose. (This is where the
  "one md per page" instinct is correct.)

**No headless CMS** (Sanity/Contentful/etc.) — adds an API dependency and a bill for
content we edit in text files. Stay **git-based**: version history, PR review, zero cost.

**Editing UI: Keystatic (Phase 4, optional).** Git-based CMS UI built for Astro; reads/writes
the same content collections and commits YAML/MDX to the repo. No DB, no API, no bill.
Not required to ship.

### Target schema for `home.yaml` (derived from current `copy` object)
Top-level keys to model in `config.ts` and fill in `home.yaml`:
`hero, trustStrip, numbers, theShift, aiNative, howWeWork, theAIStack, portfolio,
ownProducts, problemSolution, services, testimonials (+ testimonialsV2), industries,
whoWereNotFor/fitCheck, stillReading`.
Source content to convert: `./legacy-spa/src/content/md/site-copy.md` (635 lines).
Field shapes are documented by `./legacy-spa/src/content/siteCopy.js` — read it to see
exactly what each section needs (e.g. `hero.rotatingWords[]`, `trustStrip.ratings[]`,
`portfolio.cards[]`, `services.stages{}`, `numbers.stats[]`), then reproduce those shapes
as plain YAML instead of regex-parsed markdown.

---

## 3. Hosting decision (LOCKED): Cloudflare Pages

- Astro `output: 'static'` → plain HTML/CSS/JS → served on Cloudflare's edge CDN.
- **No adapter needed** for static output (`@astrojs/cloudflare` is only for SSR).
- Cloudflare Pages build config: build command `npm run build`, output dir `dist`,
  env `NODE_VERSION=20` (or current LTS ≥18).
- Free SSL + custom domain → point `elux.space` at it.
- Git-based deploys pair perfectly with the git-based CMS (Keystatic commit → auto rebuild).
- Only switch to Pages Functions / the Cloudflare adapter later **if** dynamic/server
  routes are added (forms, personalization, API). Not needed for the static marketing site.

---

## 4. Phased execution plan

### Phase 0 — Source already in place (NO git work yet)
The `devel` branch (a strict superset of `main`; only main-only commit is a README
cleanup `eb23fad`) is already cloned at `./legacy-spa` as read-only reference.
**Do NOT run any git commits, branch joins, tags, or `git init` at this stage.**
Just build the new Astro site at the project root and check it locally. The branch-join
and git setup are deferred to Phase 5+ (see below), after you've verified the site runs.

### Phase 1 — Scaffold Astro
```bash
npm create astro@latest -- --template minimal
npx astro add react tailwind sitemap mdx
```
- Port `tailwind.config.js` + `index.css` verbatim (tokens `bg-cream`, `text-ink`;
  fonts Bricolage Grotesque + Inter).
- `astro.config.mjs`: `output: 'static'`, `site: 'https://elux.space'`
  (required for sitemap + canonical URLs).

### Phase 2 — Content layer (build the CMS first)
1. Write `src/content/config.ts` — a Zod schema per section (see §2 schema list).
2. Convert `legacy-spa/src/content/md/site-copy.md` → `src/content/pages/home.yaml`
   (mechanical: each `## Section` → YAML key, each `- item` → array entry; match the
   field shapes in `legacy-spa/src/content/siteCopy.js`).
3. **Delete `siteCopy.js`.** Sections load typed data via `getEntry('pages', 'home')`.

### Phase 3 — Port the ~15 sections (text static, animation as islands)
For each section under `legacy-spa/src/sections/`:
- **Text → static `.astro`**: headings, paragraphs, lists render to real HTML at build.
- **Animation → React island**: `ParticleSphere`, `RocketAnimation`, `FolderAnimation`,
  `SliderAnimation`, GSAP/framer bits stay as React, mounted with `client:visible`.
- **FIX THE HERO H1 (critical):** render the real headline as a static `<h1>`; the typing
  animation becomes a visual layer on top of that text, not the source of it.
- Keep section order from `legacy-spa/src/App.jsx`.

### Phase 4 — SEO / AI-search layer (do alongside Phase 3, not after)
- Reusable `<SEO>` component: per-page title, description, canonical, Open Graph, Twitter.
- **JSON-LD**: `Organization` + `ProfessionalService`; `AggregateRating` + `Review`
  (5.0 Clutch, 5.0 Contra, DesignRush verified); `FAQPage` (from "Who we're not for").
- `public/robots.txt` explicitly allowing `GPTBot`, `ClaudeBot`, `PerplexityBot`,
  `Google-Extended`, `OAI-SearchBot`, `CCBot`.
- `@astrojs/sitemap` → auto `sitemap.xml`.
- **`llms.txt`** generated from the content collections (you already have the markdown —
  nearly free; boosts AI citability).
- Alt text on every `.webp` (service/work images, logos).
- *(optional)* wire **Keystatic** over the collections for a browser editing UI.

### Phase 5 — Verify locally (still no deploy)
- `npm run dev` to review visually; `npm run build && npm run preview` for the prod build.
- **View-source with JS disabled** and confirm ALL copy is in the raw HTML.
- Lighthouse + Google Rich Results Test + validate JSON-LD.
- **Stop here and review with the user before any git or deploy.**

### Phase 6 — Git + deploy (ONLY after local sign-off)
- Initialize git at the project root; commit the Astro site.
- Cherry-pick the README cleanup `eb23fad` from the legacy repo if wanted.
- Deploy static `dist/` to Cloudflare Pages; point `elux.space` at it.

---

## 5. Effort estimate
- Phase 0–2: ~1 day (mechanical; the YAML conversion can be scripted).
- Phase 3: the bulk — ~half a day per cluster of sections (faster since copy is centralized).
- Phase 4–5: ~1 day.

---

## 6. Key file references (in `./legacy-spa`)
- `src/App.jsx` — section order + layout (fixed-footer reveal trick).
- `src/sections/01_Hero.jsx` — the typing-animation H1 to fix.
- `src/content/md/site-copy.md` — all copy (convert this).
- `src/content/siteCopy.js` — documents the target field shapes (then delete).
- `src/components/` — animation components to port as islands
  (ParticleSphere, RocketAnimation, FolderAnimation, SliderAnimation, Marquee, Nav, Footer).
- `tailwind.config.js`, `src/index.css` — design tokens + fonts to port.

## 7. First action for the new session
**Local-first. No git, no deploy.** Start with **Phase 1 + 2** — scaffold Astro, write
`config.ts`, and auto-convert `site-copy.md` → `home.yaml`. That proves the CMS hardcall
works before touching components. Then Phase 3 (port sections) and Phase 4 (SEO layer),
reviewing locally via `npm run dev`. Git and Cloudflare only happen in Phase 6, after the
user has seen and signed off on the local build.
