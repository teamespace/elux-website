import { useEffect, useRef } from 'react'

const PALETTE = {
  bg: '#fcf8f0',
  surface: '#f1e9da',
  border: '#d6c9b7',
  ink: '#3e2002',
  muted: '#736049',
  accent: '#a9541f',
  accentSoft: '#d98a57',
  clay: '#f6dcc8',
}

const PIXEL_FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

const ROBOT_MESSAGES = [
  { lines: ['HELLO'], accent: -1 },
  { lines: ['WELCOME TO', 'ELUX SPACE'], accent: 1 },
  { lines: ['READY TO', 'LAUNCH YOUR', 'PRODUCT?'], accent: -1 },
]

const TYPE_SPEED = 8.5
const HOLD = 1.5
const MESSAGE_STEPS = ROBOT_MESSAGES.map((message) => {
  const chars = message.lines.reduce((sum, text) => sum + text.length, 0)
  return { chars, duration: chars / TYPE_SPEED + HOLD }
})
const MESSAGE_TOTAL = MESSAGE_STEPS.reduce((sum, step) => sum + step.duration, 0)

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const ease = (value) => 0.5 - Math.cos(clamp(value, 0, 1) * Math.PI) / 2

export default function BitmapRobot() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let pointerActive = false
    let robotHover = 0
    let robotTypeStart = null
    let frameId = 0
    const startTime = performance.now()

    ctx.imageSmoothingEnabled = false

    function drawPixelText(text, x, y, scale = 1, visibleChars = text.length) {
      ;[...text.toUpperCase()].forEach((character, index) => {
        if (index >= visibleChars) return
        const glyph = PIXEL_FONT[character] || PIXEL_FONT[' ']
        glyph.forEach((row, rowIndex) => {
          ;[...row].forEach((cell, columnIndex) => {
            if (cell === '1') {
              ctx.fillRect(x + index * 6 * scale + columnIndex * scale, y + rowIndex * scale, scale, scale)
            }
          })
        })
      })
    }

    function robotMessageState(elapsed) {
      let remaining = elapsed % MESSAGE_TOTAL
      for (let index = 0; index < MESSAGE_STEPS.length; index += 1) {
        if (remaining < MESSAGE_STEPS[index].duration) {
          return { index, typed: Math.floor(remaining * TYPE_SPEED) }
        }
        remaining -= MESSAGE_STEPS[index].duration
      }
      return { index: MESSAGE_STEPS.length - 1, typed: 999 }
    }

    function drawRobotBubble(progress, time) {
      if (progress < 0.04) return

      const state =
        reducedMotion || robotTypeStart === null
          ? { index: 1, typed: 999 }
          : robotMessageState(Math.max(0, time - robotTypeStart))
      const message = ROBOT_MESSAGES[state.index]
      const x = 98
      const y = 16
      const width = 80
      const height = 16 + message.lines.length * 10
      const tailY = y + height - 20

      ctx.globalAlpha = clamp(progress * 1.3, 0, 1)
      ctx.fillStyle = PALETTE.ink
      ctx.fillRect(x + 2, y, width - 4, height)
      ctx.fillRect(x, y + 2, width, height - 4)
      ctx.fillRect(x - 6, tailY, 8, 8)
      ctx.fillRect(x - 11, tailY + 5, 7, 6)
      ctx.fillStyle = PALETTE.bg
      ctx.fillRect(x + 4, y + 2, width - 8, height - 4)
      ctx.fillRect(x + 2, y + 4, width - 4, height - 8)
      ctx.fillRect(x - 4, tailY + 2, 7, 4)

      let remaining = state.typed
      let cursorX = 0
      let cursorY = 0
      message.lines.forEach((text, index) => {
        const visible = clamp(remaining, 0, text.length)
        ctx.fillStyle = index === message.accent ? PALETTE.accent : PALETTE.ink
        drawPixelText(text, x + 7, y + 9 + index * 10, 1, visible)
        if (visible > 0) {
          cursorX = x + 7 + visible * 6
          cursorY = y + 9 + index * 10
        }
        remaining -= text.length
      })

      if (cursorY && Math.floor(time * 3) % 2 === 0) {
        ctx.fillStyle = PALETTE.accent
        ctx.fillRect(cursorX, cursorY, 4, 7)
      }
      ctx.globalAlpha = 1
    }

    function drawRobot(time) {
      const target = pointerActive ? 1 : 0
      robotHover += (target - robotHover) * (target ? 0.14 : 0.1)
      const reveal = reducedMotion ? (pointerActive ? 1 : 0) : ease(robotHover)
      if (reveal > 0.75 && robotTypeStart === null) robotTypeStart = time
      if (!pointerActive && robotHover < 0.12) robotTypeStart = null

      const x = Math.round(48 - reveal * 46)
      const bob = reducedMotion ? 0 : Math.round(Math.sin(time * 1.9) * 1.2)
      const nod = reducedMotion ? 0 : Math.round(Math.sin(time * 1.9 - 0.7))
      const blink = !reducedMotion && time % 4.3 > 4.02
      const wave = reducedMotion ? 0 : Math.round(Math.sin(time * 6.4) * 3)
      const headY = 18 + bob + nod
      const torsoY = 58 + bob
      const fill = (px, py, width, height, color) => {
        ctx.fillStyle = color
        ctx.fillRect(Math.round(px), Math.round(py), width, height)
      }

      fill(x + 16, 145, 52, 3, PALETTE.border)
      fill(x + 24, 148, 36, 2, PALETTE.surface)

      fill(x + 25, 106, 14, 30, PALETTE.ink)
      fill(x + 45, 106, 14, 30, PALETTE.ink)
      fill(x + 27, 110, 4, 22, PALETTE.muted)
      fill(x + 47, 110, 4, 22, PALETTE.muted)
      fill(x + 24, 118, 16, 4, PALETTE.muted)
      fill(x + 44, 118, 16, 4, PALETTE.muted)
      fill(x + 20, 134, 23, 10, PALETTE.ink)
      fill(x + 41, 134, 23, 10, PALETTE.ink)
      fill(x + 22, 136, 18, 3, PALETTE.muted)
      fill(x + 43, 136, 18, 3, PALETTE.muted)

      fill(x + 26, torsoY + 44, 32, 9, PALETTE.ink)
      fill(x + 29, torsoY + 46, 26, 3, PALETTE.muted)
      fill(x + 18, torsoY + 2, 48, 44, PALETTE.ink)
      fill(x + 14, torsoY + 6, 56, 32, PALETTE.ink)
      fill(x + 22, torsoY + 6, 40, 34, PALETTE.surface)
      fill(x + 22, torsoY + 6, 40, 3, PALETTE.bg)
      fill(x + 57, torsoY + 6, 5, 34, PALETTE.muted)
      fill(x + 22, torsoY + 25, 40, 1, PALETTE.border)
      fill(x + 25, torsoY + 29, 11, 2, PALETTE.muted)
      fill(x + 25, torsoY + 33, 11, 2, PALETTE.muted)

      fill(x + 34, torsoY + 11, 13, 11, PALETTE.ink)
      fill(x + 36, torsoY + 13, 9, 7, PALETTE.accent)
      fill(x + 37, torsoY + 14, 3, 2, PALETTE.clay)

      fill(x + 10, torsoY + 5, 8, 14, PALETTE.ink)
      fill(x + 11, torsoY + 7, 6, 10, PALETTE.accent)
      fill(x + 66, torsoY + 5, 8, 14, PALETTE.ink)
      fill(x + 67, torsoY + 7, 6, 10, PALETTE.accent)

      fill(x + 9, torsoY + 16, 10, 22, PALETTE.ink)
      fill(x + 11, torsoY + 18, 3, 16, PALETTE.muted)
      fill(x + 8, torsoY + 36, 12, 9, PALETTE.ink)
      if (reveal > 0.4) {
        fill(x + 65, torsoY + 16, 10, 12, PALETTE.ink)
        fill(x + 68, torsoY - 4 + wave, 9, 24, PALETTE.ink)
        fill(x + 70, torsoY - 2 + wave, 3, 18, PALETTE.muted)
        fill(x + 66, torsoY - 13 + wave, 13, 10, PALETTE.ink)
        fill(x + 68, torsoY - 11 + wave, 4, 5, PALETTE.muted)
      } else {
        fill(x + 65, torsoY + 16, 10, 22, PALETTE.ink)
        fill(x + 70, torsoY + 18, 3, 16, PALETTE.muted)
        fill(x + 64, torsoY + 36, 12, 9, PALETTE.ink)
      }

      fill(x + 34, headY + 37, 16, 9, PALETTE.muted)
      fill(x + 34, headY + 37, 16, 2, PALETTE.ink)

      fill(x + 4, headY + 14, 9, 15, PALETTE.ink)
      fill(x + 5, headY + 16, 6, 11, PALETTE.accent)
      fill(x + 69, headY + 14, 9, 15, PALETTE.ink)
      fill(x + 70, headY + 16, 6, 11, PALETTE.accent)

      fill(x + 12, headY + 2, 58, 38, PALETTE.ink)
      fill(x + 14, headY, 54, 42, PALETTE.ink)
      fill(x + 16, headY + 4, 50, 30, PALETTE.surface)
      fill(x + 16, headY + 4, 50, 3, PALETTE.bg)
      fill(x + 60, headY + 4, 6, 30, PALETTE.muted)

      fill(x + 20, headY + 8, 42, 20, PALETTE.ink)
      fill(x + 20, headY + 8, 42, 2, PALETTE.muted)
      if (blink) {
        fill(x + 27, headY + 18, 9, 2, PALETTE.accentSoft)
        fill(x + 46, headY + 18, 9, 2, PALETTE.accentSoft)
      } else {
        fill(x + 27, headY + 13, 9, 10, PALETTE.accentSoft)
        fill(x + 46, headY + 13, 9, 10, PALETTE.accentSoft)
        fill(x + 28, headY + 14, 3, 3, PALETTE.clay)
        fill(x + 47, headY + 14, 3, 3, PALETTE.clay)
      }

      fill(x + 30, headY + 30, 22, 3, PALETTE.ink)
      for (let index = 0; index < 5; index += 1) {
        fill(x + 31 + index * 4, headY + 31, 2, 1, PALETTE.muted)
      }

      drawRobotBubble(reveal, time)
    }

    function render(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawRobot(reducedMotion ? 2.4 : (now - startTime) / 1000)
      frameId = requestAnimationFrame(render)
    }

    const handlePointerEnter = () => {
      pointerActive = true
    }
    const handlePointerLeave = () => {
      pointerActive = false
    }

    canvas.addEventListener('pointerenter', handlePointerEnter)
    canvas.addEventListener('pointermove', handlePointerEnter)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      canvas.removeEventListener('pointerenter', handlePointerEnter)
      canvas.removeEventListener('pointermove', handlePointerEnter)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <div className="grid h-full w-full place-items-center">
      <canvas
        ref={canvasRef}
        width="180"
        height="158"
        role="img"
        aria-label="Animated pixel-art Elux robot that waves and displays a welcome message on hover"
        className="h-auto w-full max-w-full cursor-pointer"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
