# FILL-LIST — what's left for Arya

Everything the Phase A + D build scaffolded but left for you to fill. Each item is
a checkbox. When they're all checked, run the launch gate at the bottom and the
site is ready for Phase B/C (verify + deploy).

**How placeholders are marked in the code:**
- `[PLACEHOLDER: ...]` — a fact/URL to replace (greppable).
- Lorem text wrapped in `.placeholder-copy` — shows a red dashed outline + "FILL ME"
  tag in the browser. Impossible to miss.
- `.img-placeholder` blocks — labelled grey boxes where a real image goes.
- `#PLACEHOLDER-*` hrefs — obviously-fake links.

Find them all any time with: `grep -rniE "placeholder|lorem|\[verify" src/`

---

## Homepage — `src/content/pages/home.yaml`

- [ ] **Contact form endpoint** — `contact.formEndpoint`: replace `#PLACEHOLDER-form-endpoint`
      with a real form action (Formspree / Web3Forms / Tally). Until then the form
      renders but doesn't submit.
- [ ] **Booking link** — `contact.bookingUrl`: replace `#PLACEHOLDER-cal-com-url`
      with your Cal.com (or similar) 20-minute call link.

### AI Stack section — `src/content/pages/home.yaml` → `aiStack.tools` ✅ DONE
Filled with six confirmed tools (Claude Code, Figma, Cursor, Midjourney, Webflow,
Framer), all `verified: true`. No placeholders left in this section.
- Six fills the 3-column grid exactly twice — a seventh entry leaves a ragged row.
- `verified` defaults to `false` in the schema, so a tool added without the flag
  still renders with the red "FILL ME" badge rather than joining the asserted set.

### Trust strip — `src/components/sections/TrustStrip.astro` (verify)
- [ ] Client logo names are hardcoded guesses (`clientNames` array). Confirm each of
      the 8 logos maps to the right client, or swap the art in `src/assets/logo-images/`.

### Testimonials — `src/components/sections/TestimonialsV2.astro` (optional curation)
- [ ] Left as-is (14 quotes in a scrolling wall — casual quotes read fine as a wall of
      love). The direction doc suggested curating to 6 substantive quotes + a separate
      "receipts" marquee. Do this if you want a tighter section; not required to ship.

---

## Portfolio images — `src/components/sections/PortfolioHighlight.astro`

Four real work images exist and are mapped by a **best guess** from generic filenames.
Cards without one show a labelled placeholder block.

- [ ] **Global Minang Ventura** (featured) — no image, add a real one.
- [ ] **MVPWorld** — no image, add a real one.
- [ ] **Aliapopups** — no image, add a real one.
- [ ] **Verify** `saas.webp` → Upnova, `ai-agent.webp` → Allen Institute,
      `fintech.webp` → Saifa AI, `mobility.webp` → UI Core (all flagged `[VERIFY]`).

---

## Case studies — `src/content/work/*.mdx` (all 7 are `draft: true`)

Drafts render at `/work/<slug>` locally but are **excluded from sitemap + llms.txt**.
Flip `draft: false` per file once it's real. Each file has:
- [ ] **global-minang-ventura** — year, live URL, results metrics, hero + gallery
      images, and the Challenge/Approach/Insight prose (MDX comments prompt you).
- [ ] **allen-institute-for-ai** — same fields.
- [ ] **upnova** — same fields.
- [ ] **ui-core** — same fields (real Gabriel Sirbu testimonial already wired in).
- [ ] **saifa-ai** — same fields.
- [ ] **aliapopups** — same fields.
- [ ] **mvpworld** — same fields.

> Metrics rule: no numbers ship until they're real. Every `results` entry is
> `[PLACEHOLDER]` on purpose.

---

## About page — `src/content/standalone/about.yaml` + `src/pages/about.astro`

Page is **excluded from the sitemap** until the lorem is replaced.
- [ ] **Story chapters** (THEN / THE SHIFT / NOW) — ~150 words each, prompts in the yaml.
- [ ] **Timeline** — 4 milestones, all years + text are `[PLACEHOLDER]`.
- [ ] **Team** — names, roles, bios (Arya decides who's public); add photo paths in
      `about.astro` (currently placeholder blocks).
- [ ] **Principles** — 4 titles are locked; expand the 4 bodies.
- [ ] **JSON-LD `foundingDate`** in `about.astro`.
- [ ] Re-add `/about` to the sitemap (remove it from the `filter` in `astro.config.mjs`)
      once real.

---

## Footer — `src/components/Footer.astro`

- [ ] Legal links (Privacy / Terms / Cookies) point to `#PLACEHOLDER-*` — build the
      pages in Phase E or link out.
- [ ] "Connect" social links use generic domains (dribbble.com, etc.) — swap for your
      real Elux profile URLs (the real ones are already in `TrustStrip.astro`).

---

## noindex — remember to lift it

Draft case studies and `/about` now emit `<meta name="robots" content="noindex,follow">`
so crawlers don't index lorem (they're reachable via links, not just the sitemap).
- [ ] When a case study is real, flip its MDX `draft: false` — that removes the noindex
      automatically (the layout keys off `isDraft`).
- [ ] When `/about` is real, remove `noindex={true}` in `src/pages/about.astro` and drop
      `/about` from the sitemap `filter` in `astro.config.mjs`.

## Launch gate (before Phase B/C deploy)

1. [ ] `grep -rniE "placeholder|lorem|\[verify" src/` returns **only** the convention
       code (global.css, config.ts, and the placeholder-rendering blocks) — no unfilled
       content. Flip each `draft: true` → `false` as case studies go live.
2. [ ] `bun run build && bun run preview` — clean build.
3. [ ] View-source with JS disabled on `/`, `/work`, a case study, `/about` — all copy
       present as real HTML.
4. [ ] Click every nav link, CTA, and card — no dead links (real URLs now filled).
5. [ ] Mobile 375px pass; reduced-motion pass; Lighthouse ≥90 mobile.
6. [ ] Re-include `/about` and the un-drafted `/work/*` pages in the sitemap filter.
