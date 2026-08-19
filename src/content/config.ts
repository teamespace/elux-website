import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// ─────────────────────────────────────────────────────────────────────────────
// Webelux v2 content layer.
//
// This file replaces the legacy `src/content/siteCopy.js` regex parser. Instead
// of reverse-engineering fields out of prose markdown, structured UI copy now
// lives as typed YAML (one data file per page) and is validated by Zod at build
// time — bad content is a build error, not a silently-broken section.
//
// Field shapes mirror the objects the old parser produced (see
// legacy-spa/src/content/siteCopy.js), but presentational transforms it baked in
// (forced .toUpperCase(), injected line breaks) are intentionally dropped — those
// belong in CSS / components (.display and .eyebrow already uppercase via
// text-transform), not in the content.
// ─────────────────────────────────────────────────────────────────────────────

// A labelled item: a short title/heading paired with its supporting copy.
// Used by theShift.items, aiNative.*Items, services[].services, fitCheck.builtFor.
const titleText = z.object({
  title: z.string(),
  text: z.string(),
})

// A timeline step (How We Work + How We Work V2 share this shape).
const step = z.object({
  time: z.string(),          // e.g. "48H" or the step number when no explicit time
  timeLabel: z.string(),     // e.g. "to scope"
  title: z.string(),
  description: z.string(),
  // One-line version for the card. `description` is kept in full because
  // llms.txt still emits it — shortening in place would drop the detail
  // from the machine-readable copy as well.
  short: z.string().optional(),
  deliverables: z.array(z.string()),
})

const hero = z.object({
  eyebrow: z.string(),
  // The confession headline renders as two explicit lines: line 1 is the past
  // (visually muted), line 2 + the rotating word is the present. No word-splitting
  // — the two lines are authored, so the full static H1 is stable for crawlers.
  headlineLine1: z.string(),
  headlineLine2: z.string(),
  // Capped: RotatingVerb uses `whitespace-nowrap`, so a word longer than this
  // would overflow the hero on narrow screens. Keep rotating words short.
  rotatingWords: z.array(z.string().max(16)),
  subheadline: z.string(),
  primaryCta: z.string(),
  secondaryCta: z.string(),
})

// The transformation strip — the narrative beat the old build was missing.
// A three-step visual timeline (Then → Shift → Now), NOT prose. Kept short so it
// reads at a glance and never competes with the long-form "The Shift" section.
const transformation = z.object({
  eyebrow: z.string(),
  beats: z.array(
    z.object({
      label: z.string(), // THEN | THE SHIFT | NOW
      text: z.string(),
    }),
  ),
})

const trustStrip = z.object({
  eyebrow: z.string(),
  ratings: z.array(z.string()),
  workingWithEyebrow: z.string(),
  supportingCopy: z.string().optional(),
  badges: z.array(titleText).default([]),
})

const numbers = z.object({
  eyebrow: z.string(),
  headline: z.string().optional(),
  supportingCopy: z.string().optional(),
  stats: z.array(
    z.object({
      value: z.number(), // numeric portion (drives the count-up animation)
      suffix: z.string().default(''), // e.g. "+", "%", "x"
      label: z.string(),
      description: z.string().optional(),
      source: z.string().optional(),
    }),
  ),
  methodologyNote: z.string().optional(),
  cta: z.string().optional(),
})

const theShift = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  body: z.string(),
  items: z.array(titleText),
})

const aiNative = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  withoutLabel: z.string(),
  withoutHeadline: z.string(),
  withoutItems: z.array(titleText),
  withoutResult: z.string(),
  withLabel: z.string(),
  withHeadline: z.string(),
  withItems: z.array(titleText),
  withResult: z.string(),
})

const howWeWork = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  supportingCopy: z.string(),
  steps: z.array(step),
  loopCopy: z.string(),
  loopShort: z.string().optional(),
})

// The falsifiability-proof section: name the tools that actually do a job in the
// workflow, not a logo wall. `verified` marks tools confirmed from real project
// history; everything else is an honest placeholder for Arya to confirm. No
// external logo CDN — the whole point is a self-contained, crawler-readable site.
const aiStack = z.object({
  eyebrow: z.string().default('THE AI STACK'),
  headline: z.string(),
  note: z.string().optional(),
  tools: z.array(
    z.object({
      name: z.string(),
      job: z.string(),
      verified: z.boolean().default(false),
    }),
  ),
})

const portfolio = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  body: z.string(),
  cta: z.string(),
  cards: z.array(
    z.object({
      title: z.string(),
      // `tag` is the flat string llms.txt and /about still read. `category`
      // and `tags` are the split version the grid renders.
      tag: z.string(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      description: z.string(),
      // Internal case-study route (Phase D). Cards beyond the four available
      // work images render a labelled placeholder block until Arya adds real art.
      href: z.string(),
    }),
  ),
})

const ownProducts = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  body: z.string(),
  cta: z.string(),
  closing: z.string().optional(),
  products: z.array(
    z.object({
      title: z.string(),
      tag: z.string(),
      link: z.string(),
      status: z.string(),
      description: z.string(),
      // One-liner for the homepage teaser. `description` stays in full for
      // /about#products and llms.txt.
      short: z.string().optional(),
    }),
  ),
})

const problemSolution = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  rows: z.array(
    z.object({
      id: z.string(),
      kicker: z.string(),
      headline: z.string(),
      copy: z.string(),
      cta: z.string(),
    }),
  ),
})

const services = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  supportingCopy: z.string(),
  stages: z.array(
    z.object({
      key: z.string(), // "Seed" | "Growth" | "Scale"
      headline: z.string(),
      sprint: z.string(),
      copy: z.string(),
      cta: z.string(),
      services: z.array(titleText),
    }),
  ),
})

const industries = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  supportingCopy: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      count: z.string(),
      tagline: z.string(),
      description: z.string(),
    }),
  ),
  caseTags: z.array(z.string()),
})

const testimonials = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  quotes: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      logo: z.string(),
      quote: z.string(),
    }),
  ),
  videoIds: z.array(z.string()),
})

const fitCheck = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  supportingCopy: z.string(),
  builtFor: z.array(titleText),
  cta: z.string().optional(),
})

const stillReading = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  primaryCta: z.string(),
  secondaryCta: z.string().optional(),
})

// Contact section: a 3-field form (primary) + a book-a-call link (secondary).
// formEndpoint / bookingUrl are placeholder URLs until Arya supplies a form
// service (Formspree / Web3Forms / Tally) and a Cal.com link.
const contact = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  supportingCopy: z.string(),
  formEndpoint: z.string(), // e.g. "#PLACEHOLDER-form-endpoint"
  submitLabel: z.string(),
  bookingLabel: z.string(),
  bookingUrl: z.string(), // e.g. "#PLACEHOLDER-cal-com-url"
})

// ── About page ───────────────────────────────────────────────────────────────
// Its own shape (not the homepage schema), so it lives in a separate `standalone`
// collection rather than in `pages`. Skeleton copy is locked; bodies are lorem
// with [PLACEHOLDER] prompts until Arya writes the real transformation story.
const about = z.object({
  hero: z.object({
    eyebrow: z.string(),
    headlineLine1: z.string(),
    headlineLine2: z.string(),
  }),
  story: z.object({
    eyebrow: z.string(),
    chapters: z.array(z.object({ label: z.string(), title: z.string(), body: z.string() })),
  }),
  timeline: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    milestones: z.array(z.object({ year: z.string(), title: z.string(), text: z.string() })),
  }),
  team: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    members: z.array(z.object({ name: z.string(), role: z.string(), bio: z.string() })),
  }),
  principles: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    items: z.array(titleText),
  }),
  closing: z.object({ headline: z.string(), cta: z.string() }),
})

// One YAML data file per page. Every homepage section is a typed top-level key.
const pages = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
  schema: z.object({
    hero,
    transformation,
    trustStrip,
    numbers,
    theShift,
    aiNative,
    aiStack,
    portfolio,
    ownProducts,
    problemSolution,
    services,
    industries,
    testimonials,
    fitCheck,
    // The single source of truth for the process timeline (48H / DAY 1–6 / DAY 7).
    // The old generic `howWeWork` variant was removed — one dataset, no drift.
    process: howWeWork, // `howWeWork` here is the shared step-list shape, not a second dataset
    contact,
    stillReading,
  }),
})

// Long-form proof: one MDX file per client case study. Everything is authored as
// a draft (draft: true) with lorem bodies + flagged placeholders until Arya fills
// it. Drafts render locally but are excluded from the sitemap and llms.txt.
const work = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      year: z.string(), // "[PLACEHOLDER]" where unknown
      tagline: z.string(), // the card tag, e.g. "VENTURE · AI-NATIVE WEBSITE · SHIPPED IN 1 WEEK"
      summary: z.string(), // one-line, feeds /work cards + llms.txt
      services: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
      timeline: z.string(), // e.g. "1 week" — "[PLACEHOLDER]" where unknown
      liveUrl: z.string().default('#PLACEHOLDER-live-url'),
      heroImage: image().optional(), // omit → layout renders a labelled placeholder block
      gallery: z.array(image()).default([]),
      results: z
        .array(z.object({ metric: z.string(), label: z.string() }))
        .default([]), // metrics ALL "[PLACEHOLDER]" until confirmed
      testimonial: z
        .object({ quote: z.string(), name: z.string(), role: z.string() })
        .optional(),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      draft: z.boolean().default(true), // excluded from sitemap + llms.txt while true
    }),
})

// Standalone single-page data files that don't share the homepage shape.
const standalone = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/standalone' }),
  schema: about,
})

export const collections = { pages, work, standalone }
