/** @type {import('tailwindcss').Config} */
// v2 — BORING-inspired token system. Pulled live from weareboring.nl.
// Ported verbatim from the legacy SPA (legacy-spa/tailwind.config.js).
// Independent from v1's tokens; do not import or share colors.
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        // page surfaces — warm paper + lime feature band
        // Two light surfaces only. Every hue in the system sits in a 23-40°
        // warm arc; the old pastel green sat at 90° and read as a sticker.
        cream:      '#FCF8F0',   // body bg
        'cream-3':  '#F1E9DA',   // panel-on-cream
        clay:       '#F6DCC8',   // warm peach band

        // ink (a deep espresso brown, not pure #000)
        ink:        '#3E2002',   // primary text on cream — 13.9:1
        'ink-2':    '#6D543C',   // secondary text on cream — 6.6:1
        'ink-3':    '#736049',   // muted text on cream — passes AA on cream, clay and panel

        // inverted (dark sections) — deep brown, same hue family as ink
        'ink-bg':   '#3E2002',   // dark section bg
        olive:      '#333A1B',   // second dark band — green, but as a dark
        'olive-2':  '#414A24',   // card lift on olive
        'on-ink':   '#FCF8F0',   // cream on dark
        'on-ink-2': '#FCF8F0CC', // 80% cream on dark
        'on-ink-3': '#FCF8F099', // 60% cream on dark

        // accent — surface-aware (see --accent in global.css): burnt orange on
        // light surfaces, soft orange on dark. One token, AA on both.
        primary:     'rgb(var(--accent) / <alpha-value>)',
        'primary-2': 'rgb(var(--accent-2) / <alpha-value>)', // hover/pressed
        butter:      '#DFE3BE',  // pale sage chip — 69°, inside the warm arc

        // structural
        line:       '#E4DACA',   // hairlines on cream
        'line-ink': '#FCF8F01F', // hairlines on ink

        // states
        danger:     '#B3261E',   // a true red — #C2410C was luminance-identical to the accent
        success:    '#2C6E3F',   // darkened so it clears 4.5:1 on clay too
      },
      fontFamily: {
        // Iowan Old Style where it exists (Apple systems), Vollkorn everywhere.
        display: ['"Iowan Old Style"', 'Vollkorn', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'Menlo', 'monospace'],
      },
      fontWeight: {
        display: '700',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        boring: '-0.01em',
      },
      borderRadius: {
        chip: '4px',   // buttons, badges, small chips
        card: '24px',  // testimonial, metric and comparison cards
        media: '16px', // image tiles in the work grid
      },
      maxWidth: {
        page: '1320px', // wider than v1 for editorial feel
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      animation: {
        // Slow, steady scroll. -50% because we duplicate the content row
        // so the loop point is the midpoint of the doubled content.
        // 90s is roughly half the speed of 48s — calm, readable, never frantic.
        marquee: 'marquee 90s linear infinite',
        blink:   'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
