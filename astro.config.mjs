// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'

// https://astro.build/config
export default defineConfig({
  // Static SSG output — text renders to real HTML at build time (the whole point
  // of the migration: crawlers/AI get every word with near-zero JS).
  output: 'static',
  // Required for sitemap generation + absolute canonical URLs.
  site: 'https://elux.space',
  integrations: [
    react(),
    // We port the legacy index.css verbatim (it owns the @tailwind directives and
    // custom @layer components), so don't let the integration inject its own base.
    tailwind({ applyBaseStyles: false }),
    // Keep placeholder/draft pages out of the sitemap until Arya fills them:
    // every /work/<slug> case-study detail (all draft) and /about (lorem body).
    // The /work index and the homepage stay indexed. Lift these when content is real.
    sitemap({
      filter: (page) =>
        !/\/work\/[^/]+\/?$/.test(page) && !/\/about\/?$/.test(page),
    }),
    mdx(),
  ],
})
