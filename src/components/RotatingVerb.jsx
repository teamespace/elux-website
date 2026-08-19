import { useEffect, useState } from 'react'

// The hero's animated verb. Extracted from the legacy Hero. Mounted as an
// island, but it server-renders the FIRST word, so the static H1 reads as a
// complete, stable headline ("…ACTUALLY SHIP.") for crawlers — fixing the
// legacy character-by-character H1 that left no semantic headline in the DOM.
const TYPE_SPEED = 90
const ERASE_SPEED = 50
const PAUSE_AFTER_TYPE = 1600
const PAUSE_BEFORE_TYPE = 300

export default function RotatingVerb({ words = ['SHIP.'] }) {
  const [displayed, setDisplayed] = useState(words[0] ?? '')
  const [phase, setPhase] = useState('pausing')

  useEffect(() => {
    let cancelled = false
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

    // Respect reduced-motion: keep the SSR'd first word static, don't type/erase.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const run = async () => {
      let idx = 0
      // Hold the SSR'd first word briefly before the cycle takes over.
      await sleep(1200)

      while (!cancelled) {
        const word = words[idx]

        // ERASE current word
        setPhase('erasing')
        for (let i = (idx === 0 ? word.length : displayed.length) - 1; i >= 0; i--) {
          if (cancelled) return
          setDisplayed(word.slice(0, i))
          await sleep(ERASE_SPEED)
        }
        await sleep(PAUSE_BEFORE_TYPE)

        // Advance, then TYPE the next word
        idx = (idx + 1) % words.length
        const next = words[idx]
        setPhase('typing')
        for (let i = 1; i <= next.length; i++) {
          if (cancelled) return
          setDisplayed(next.slice(0, i))
          await sleep(TYPE_SPEED + (Math.random() * 40 - 20))
        }

        setPhase('pausing')
        await sleep(PAUSE_AFTER_TYPE)
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words])

  return (
    <span className="inline-block bg-primary text-cream px-3 -mx-1 align-baseline whitespace-nowrap">
      {displayed}
      <span
        className={`inline-block w-[2px] h-[0.85em] bg-cream align-middle ml-[2px] translate-y-[-0.05em] ${
          phase === 'pausing' ? 'animate-blink' : 'opacity-100'
        }`}
      />
    </span>
  )
}
