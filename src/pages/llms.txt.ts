import type { APIRoute } from 'astro'
import { getEntry, getCollection } from 'astro:content'

// Generated from the same content collection that renders the page — so the
// AI-readable digest never drifts from the live copy. Emitted as /llms.txt.
export const GET: APIRoute = async () => {
  const { data: c } = await getEntry('pages', 'home')
  // Published case studies only — drafts stay out of the AI-readable digest.
  const caseStudies = (await getCollection('work', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order,
  )

  const lines: string[] = []
  const push = (s = '') => lines.push(s)

  push('# Elux Space')
  push()
  push(`> ${c.hero.eyebrow}. ${c.hero.subheadline}`)
  push()
  push(
    'Elux Space is a pragmatic AI-native product design and build partner for SaaS, AI, and modern product teams. We turn messy ideas into clear UX, well-structured interfaces, and launch-ready products — designed and built in one sprint.',
  )
  push()

  push('## Headline')
  push(`${c.hero.headlineLine1} ${c.hero.headlineLine2} ${c.hero.rotatingWords.join(' / ')}`)
  push()

  push('## The transformation')
  push(c.transformation.eyebrow)
  for (const b of c.transformation.beats) push(`- ${b.label}: ${b.text}`)
  push()

  push('## Proof')
  push(`Ratings: ${c.trustStrip.ratings.join(', ')}.`)
  for (const s of c.numbers.stats) push(`- ${s.value}${s.suffix} — ${s.label}`)
  push()

  push('## The shift')
  push(c.theShift.body.replace(/\n+/g, ' '))
  for (const i of c.theShift.items) push(`- ${i.title}: ${i.text}`)
  push()

  push('## Old way vs. the pragmatic way')
  push(`${c.aiNative.withoutLabel} — ${c.aiNative.withoutHeadline}`)
  for (const i of c.aiNative.withoutItems) push(`- ${i.title}: ${i.text}`)
  push(`${c.aiNative.withLabel} — ${c.aiNative.withHeadline}`)
  for (const i of c.aiNative.withItems) push(`- ${i.title}: ${i.text}`)
  push()

  push('## How we work')
  push(c.process.supportingCopy)
  for (const s of c.process.steps)
    push(`- ${s.time} ${s.title}: ${s.description} (Deliverables: ${s.deliverables.join(', ')})`)
  push()

  push('## Work')
  for (const card of c.portfolio.cards) push(`- ${card.title} [${card.tag}]: ${card.description}`)
  push()

  if (caseStudies.length) {
    push('## Case studies')
    for (const cs of caseStudies)
      push(`- ${cs.data.title} [${cs.data.tagline}] (${cs.data.timeline}): ${cs.data.summary} — /work/${cs.id}`)
    push()
  }

  push('## Our own products')
  for (const p of c.ownProducts.products) push(`- ${p.title} (${p.status}, ${p.link}): ${p.description}`)
  push()

  push('## Pick your situation')
  for (const r of c.problemSolution.rows) push(`- ${r.kicker} ${r.headline} — ${r.copy}`)
  push()

  push('## Services by stage')
  for (const s of c.services.stages) {
    push(`### ${s.key} — ${s.headline} (${s.sprint})`)
    push(s.copy)
    for (const item of s.services) push(`- ${item.title}: ${item.text}`)
    push()
  }

  push('## Who we are built for')
  for (const b of c.fitCheck.builtFor) push(`- ${b.title}: ${b.text}`)
  push()

  push('## What clients say')
  for (const q of c.testimonials.quotes) push(`- "${q.quote}" — ${q.name}, ${q.role}`)
  push()

  push('## Contact')
  push('Email: hello@elux.space · project@elux.space')
  push('Phone: +62 851-5698-9279')
  push('Locations: Jakarta · Bali · Remote')
  push('Website: https://elux.space')
  push()

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
