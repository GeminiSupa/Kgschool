<template>
  <div class="shooting-stars-container fixed inset-0 overflow-hidden pointer-events-none z-0">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let stars: Array<{
  x: number
  y: number
  z: number
  prevX: number
  prevY: number
  speed: number
  size: number
  opacity: number
}> = []

const createStar = () => {
  return {
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    z: Math.random() * 1000,
    prevX: 0,
    prevY: 0,
    speed: Math.random() * 0.5 + 0.5,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.5
  }
}

const initStars = () => {
  stars = []
  for (let i = 0; i < 100; i++) {
    stars.push(createStar())
  }
}

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Update and draw stars
  stars.forEach((star, index) => {
    // Move star closer
    star.z -= star.speed

    // Reset star if it's too close
    if (star.z <= 0) {
      star.x = Math.random() * 2000 - 1000
      star.y = Math.random() * 2000 - 1000
      star.z = 1000
      star.speed = Math.random() * 0.5 + 0.5
    }

    // Calculate 3D position
    const k = 128.0 / star.z
    const px = star.x * k + canvas.width / 2
    const py = star.y * k + canvas.height / 2

    // Draw trail
    if (star.prevX !== 0 && star.prevY !== 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.3})`
      ctx.lineWidth = star.size * k * 0.5
      ctx.beginPath()
      ctx.moveTo(star.prevX, star.prevY)
      ctx.lineTo(px, py)
      ctx.stroke()
    }

    // Draw star
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
    ctx.beginPath()
    ctx.arc(px, py, star.size * k, 0, Math.PI * 2)
    ctx.fill()

    // Add glow effect
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    ctx.fill()
    ctx.shadowBlur = 0

    star.prevX = px
    star.prevY = py
  })

  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  initStars()
  animate()
  
  // Handle resize
  const handleResize = () => {
    if (canvasRef.value) {
      canvasRef.value.width = window.innerWidth
      canvasRef.value.height = window.innerHeight
    }
  }
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.shooting-stars-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
