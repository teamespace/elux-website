import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Ported verbatim from the legacy SPA. Mounted as a `client:visible` island in
// the hero — purely decorative, so it loads only when scrolled into view and the
// hero headline stays real static HTML regardless.
export default function ParticleSphere() {
  const containerRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Safely capture container dimensions with pixel fallback to prevent invisible 0-height renders
    let width = container.clientWidth
    let height = container.clientHeight
    if (width === 0) width = 480
    if (height === 0) height = 480

    // Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.z = 4.8

    // WebGL Renderer with alpha transparency and antialiasing
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Particle Generation
    const particleCount = 2800
    const positions = new Float32Array(particleCount * 3)
    const originalPositions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    // Monochrome ink — two shades of the same near-black so the sphere reads as
    // one dark mass on cream rather than a second accent colour competing.
    const colorBlue = new THREE.Color('#3E2002')
    const colorWhite = new THREE.Color('#1F1000')

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution on sphere for perfect, professional spacing
      const phi = Math.acos(-1 + (2 * i) / particleCount)
      const theta = Math.sqrt(particleCount * Math.PI) * phi

      const r = 2.0 // Sphere Radius
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      originalPositions[i * 3] = x
      originalPositions[i * 3 + 1] = y
      originalPositions[i * 3 + 2] = z

      // Stochastically blend electric blue and white
      const mixRatio = Math.random()
      const mixedColor = new THREE.Color().lerpColors(colorBlue, colorWhite, mixRatio * 0.45)
      colors[i * 3] = mixedColor.r
      colors[i * 3 + 1] = mixedColor.g
      colors[i * 3 + 2] = mixedColor.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Point Material: Slightly larger points (size: 0.08) for premium glowing circles
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // Raycaster for interactive cursor point repulsion
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // Stable plane facing the camera at origin

    const clock = new THREE.Clock()
    let animationFrameId

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime() * 0.35
      const posAttribute = geometry.attributes.position
      const mouse = mouseRef.current

      // Smooth mouse coordinate interpolation (spring damping look)
      mouse.x += (mouse.targetX - mouse.x) * 0.06
      mouse.y += (mouse.targetY - mouse.y) * 0.06

      // 1. Raycast mouse onto 3D projection plane
      const mouseVector = new THREE.Vector2(mouse.x, mouse.y)
      raycaster.setFromCamera(mouseVector, camera)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersectPoint)

      // 2. Animate and distort coordinates
      for (let i = 0; i < particleCount; i++) {
        const x = originalPositions[i * 3]
        const y = originalPositions[i * 3 + 1]
        const z = originalPositions[i * 3 + 2]

        const particlePos = new THREE.Vector3(x, y, z)

        // Apply smooth organic multi-layer wave breathing
        const angle = Math.atan2(y, x)
        const wave =
          Math.sin(particlePos.length() * 2.2 - time * 2) * 0.18 +
          Math.cos(angle * 5 + time * 1.6) * 0.12 +
          Math.sin(z * 3 + time * 0.8) * 0.06

        const len = particlePos.length()
        const nx = x / len
        const ny = y / len
        const nz = z / len

        // Base wave position
        let tx = x + nx * wave
        let ty = y + ny * wave
        let tz = z + nz * wave

        // 3. Mouse repulsion: Push particles away when cursor is close in screen space
        const currentPos = new THREE.Vector3(tx, ty, tz)

        // Rotate local coordinate to screen space coordinates for accurate distance checking
        currentPos.applyEuler(points.rotation)

        const distToCursor = currentPos.distanceTo(intersectPoint)

        if (distToCursor < 1.3) {
          // Push force increases the closer the mouse gets
          const force = (1.3 - distToCursor) * 0.5
          const dir = new THREE.Vector3().subVectors(currentPos, intersectPoint).normalize()

          // Apply repulsion force offset
          const repelOffset = dir.multiplyScalar(force)

          // Revert screen-space push offset back to local points coordinates
          repelOffset.applyEuler(new THREE.Euler(-points.rotation.x, -points.rotation.y, -points.rotation.z))

          tx += repelOffset.x
          ty += repelOffset.y
          tz += repelOffset.z
        }

        posAttribute.setXYZ(i, tx, ty, tz)
      }

      posAttribute.needsUpdate = true

      // 4. Smooth 3D sphere rotation to face mouse coordinates
      const targetRotX = -mouse.y * 0.4
      const targetRotY = mouse.x * 0.4

      points.rotation.y += 0.0012 // Natural idle rotation
      points.rotation.x += (targetRotX - points.rotation.x) * 0.05
      points.rotation.y += (targetRotY - points.rotation.y) * 0.05

      renderer.render(scene, camera)
    }

    animate()

    // Handlers
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0
      mouseRef.current.targetY = 0
    }

    const handleResize = () => {
      const w = container.clientWidth || 480
      const h = container.clientHeight || 480
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
        minHeight: '400px',
      }}
    />
  )
}
