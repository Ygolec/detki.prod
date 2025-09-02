<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="onUpdate"
      fullscreen
  >
    <v-card variant="text" class="menu-card d-flex align-center justify-center">
      <!-- Player container -->
      <div class="player-wrap" ref="wrapEl" style="height: 80vh;width: 80vw;">
        <video
            ref="videoEl"
            class="video-js vjs-default-skin"
            playsinline
            preload="auto"
        ></video>

        <!-- Overlay root that will be moved inside player.el() -->
        <div ref="overlayRoot">
          <!-- Close button (top-right) -->
          <v-btn class="close-btn" icon="mdi-close" variant="text" @click="close"></v-btn>

          <!-- Overlay: PAUSED state -->
          <div v-show="isPaused" class="overlay paused">
            <div class="title-large">
              <div class="title-frame" ref="titleFrameEl">
                <span class="title-text" ref="titleTextEl">{{ meta.title || 'Untitled' }}</span>
              </div>
              <div class="meta-side">
                <div class="meta-row">
                  <span class="meta-label">SOFT</span>
                  <span class="meta-value">{{ meta.tools || '-' }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">YEAR</span>
                  <span class="meta-value">{{ meta.year ?? '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Overlay: PLAYING state -->
          <div v-show="!isPaused" class="overlay playing">
            <div class="playing-left">{{ meta.title || 'Untitled' }}</div>
            <div class="playing-right">
              <div class="meta-row">
                <span class="meta-label">SOFT</span>
                <span class="meta-value">{{ meta.tools || '-' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">YEAR</span>
                <span class="meta-value">{{ meta.year ?? '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, watch, reactive, nextTick} from 'vue'
import {useHead, useRuntimeConfig} from '#imports'

const props = defineProps<{
  modelValue: boolean
  projectId?: string | number
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const videoEl = ref<HTMLVideoElement | null>(null)
const overlayRoot = ref<HTMLElement | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const titleFrameEl = ref<HTMLElement | null>(null)
const titleTextEl = ref<HTMLElement | null>(null)
let player: any = null
const isPaused = ref(true)

const meta = reactive<{ title: string; src: string; year?: number | string; tools?: string }>(
    {title: '', src: '', year: undefined, tools: undefined}
)

// --- Autosize paused title to fill the frame ---
function fitTitleToFrame() {
  if (!isPaused.value) return
  const frame = titleFrameEl.value as HTMLElement | null
  const text = titleTextEl.value as HTMLElement | null
  if (!frame || !text) return

  // If not visible (e.g., dialog closed), skip
  const frameRect = frame.getBoundingClientRect()
  if (frameRect.width === 0 || frameRect.height === 0) return

  const paddingX = 12
  const paddingY = 8
  const maxW = Math.max(0, frame.clientWidth - paddingX)
  const maxH = Math.max(0, frame.clientHeight - paddingY)
  if (maxW === 0 || maxH === 0) return

  // Binary search font-size
  let lo = 4, hi = 512, best = 4
  for (let i = 0; i < 18; i++) {
    const mid = Math.floor((lo + hi) / 2)
    text.style.fontSize = mid + 'px'
    // force reflow and measure
    const rect = text.getBoundingClientRect()
    const w = Math.ceil(rect.width)
    const h = Math.ceil(rect.height)
    if (w <= maxW && h <= maxH) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  text.style.fontSize = Math.max(4, best) + 'px'

  // After sizing by height/width constraints, stretch horizontally if there is leftover width
  // without affecting height, to fill the frame fully.
  // Measure resulting width
  const finalRect = text.getBoundingClientRect()
  const wFinal = Math.ceil(finalRect.width)
  if (wFinal > 0) {
    const neededScaleX = maxW / wFinal
    // Only stretch if there is a noticeable gap; clamp to avoid over-distortion
    if (neededScaleX > 1.005) {
      const clamped = Math.min(1.25, neededScaleX)
      text.style.transform = `scaleX(${clamped}) scaleY(1.1)`
    } else {
      text.style.transform = `scaleY(1.1)`
    }
  }
}

function debounce(fn: (...args: any[]) => void, wait = 100) {
  let t: any
  return (...args: any[]) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

const refitDebounced = debounce(() => {
  // Fit after DOM updates
  nextTick(() => fitTitleToFrame())
}, 80)

const onResize = () => refitDebounced()

watch(() => isPaused.value, (paused) => {
  if (paused) nextTick(() => refitDebounced())
})

watch(() => meta.title, () => {
  nextTick(() => refitDebounced())
})

useHead({
  link: [
    {rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/video.js@8.13.0/dist/video-js.min.css'}
  ],
  script: [
    {src: 'https://cdn.jsdelivr.net/npm/video.js@8.13.0/dist/video.min.js', defer: true}
  ]
})

function close() {
  emit('update:modelValue', false)
}

function onUpdate(val: boolean) {
  // When dialog visibility changes
  if (!val) {
    // pause on close
    try {
      player?.pause?.()
    } catch {
    }
  }
  emit('update:modelValue', val)
}

async function ensurePlayer() {
  if (!videoEl.value || player) return
  // @ts-ignore
  const vjs = (globalThis as any).videojs
  if (!vjs) {
    // wait a tick for CDN script to attach
    await new Promise(r => setTimeout(r, 50))
  }
  // @ts-ignore
  const videojsLib = (globalThis as any).videojs
  if (!videojsLib || !videoEl.value) return

  player = videojsLib(videoEl.value, {
    controls: true,
    autoplay: false,
    preload: 'auto',
    fluid: true,
    controlBar: {
      remainingTimeDisplay: false
    }
  })

  player.on('play', () => {
    isPaused.value = false
  })
  player.on('pause', () => {
    isPaused.value = true
  })
  player.on('ended', () => {
    isPaused.value = true
  })

  // Move overlays inside the player container so they are visible in fullscreen
  try {
    const playerEl: HTMLElement = player.el?.() || player.el_ || player.player_?.el?.() || null
    if (playerEl && overlayRoot.value && overlayRoot.value.parentElement !== playerEl) {
      playerEl.appendChild(overlayRoot.value)
    }
  } catch {
  }

  // Load current source if available
  if (meta.src) {
    loadSource(meta.src)
  }

  // After player initialized and overlays are in place, fit the title
  refitDebounced()
}

function disposePlayer() {
  try {
    // Move overlays back to stable wrapper before disposing the player element
    const playerEl: HTMLElement | null = player?.el?.() || player?.el_ || null
    if (overlayRoot.value && wrapEl.value && overlayRoot.value.parentElement === playerEl) {
      wrapEl.value.appendChild(overlayRoot.value)
    }

    if (player) {
      player.dispose()
      player = null
    }
  } catch {
  }
}

function loadSource(src: string) {
  if (player && src) {
    player.src({src, type: guessType(src)})
  } else if (videoEl.value) {
    // fallback native until player ready
    videoEl.value.src = src
  }
}

function guessType(src: string): string {
  if (src.endsWith('.m3u8')) return 'application/x-mpegURL'
  if (src.endsWith('.mpd')) return 'application/dash+xml'
  if (src.endsWith('.webm')) return 'video/webm'
  return 'video/mp4'
}

async function fetchProjectById(id?: string | number) {
  // Default fallback content
  const fallback = {
    title: 'gilmurt',
    src: '/gilmurt_cut_for_web.mp4',
    year: '2025',
    tools: 'Blender, Nuke, Houdini'
  }

  if (!id) {
    Object.assign(meta, fallback)
    loadSource(meta.src)
    return
  }

  const config = useRuntimeConfig();

  try {
    const origin = process.client ? window.location.origin : useRequestURL().origin
    const url = `${origin}/api/projects/${id}`
    const data: any = await $fetch(url)
    const item = data?.data || data

    const title = item?.name || item?.title || fallback.title
    const yearFromDate = item?.date ? String(item.date).slice(0, 4) : undefined
    const year = yearFromDate || (item?.year ?? fallback.year)
    const tools = Array.isArray(item?.tools) ? item.tools.join(', ') : (item?.tools || fallback.tools)
    const srcFromVideo = item?.video ? `${config.public.directusUrl}/assets/${item.video}` : undefined
    const src = srcFromVideo || item?.video_url || fallback.src

    Object.assign(meta, { title, src, year, tools })
  } catch (e) {
    Object.assign(meta, fallback)
  }
  loadSource(meta.src)
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    await fetchProjectById(props.projectId)
    await ensurePlayer()
  } else {
    disposePlayer()
  }
})

watch(() => props.projectId, async (id) => {
  if (props.modelValue) {
    await fetchProjectById(id)
    if (player && meta.src) loadSource(meta.src)
  }
})

onMounted(async () => {
  // Listen for viewport changes to refit title
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize)
  }
  if (props.modelValue) {
    await fetchProjectById(props.projectId)
    await ensurePlayer()
  }
  // Initial fit attempt when mounted
  refitDebounced()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onResize)
  }
  disposePlayer()
})
</script>

<style scoped>
.video-card {
  position: fixed;
  inset: 0;
  background: black;
}

.player-wrap {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.player-wrap :deep(.video-js) {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Hide default big play */
.player-wrap :deep(.vjs-big-play-button) {
  display: none !important;
}

.overlay {
  position: absolute;
  inset: 0;
  color: white;
  pointer-events: none;
  font-family: Georgia, serif;
}

/* PAUSED: big centered title occupying ~80% width, with SOFT/YEAR bottom-right of the title */
.overlay.paused {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: left;
  padding: 4vw;
}

.title-large {
  position: relative;
  max-width: 80vw;
  width: 80%;
  font-family: Georgia, serif;
}

.title-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16/3;
  border: 2px solid rgba(255, 255, 255, .7);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.title-text {
  font-family: Georgia, serif;
  display: inline-block;
  white-space: nowrap;
  line-height: 1.1;
  letter-spacing: 0.2em;
  transform: scaleY(1.4);
  transform-origin: center center;
  will-change: font-size, transform;
}

.title-large .meta-side {
  font-family: Georgia, serif;
  position: static;
  display: grid;
  grid-template-columns: auto auto; /* col1: label, col2: value */
  justify-content: end; /* stick the grid to the right edge */
  column-gap: 0.6em;
  row-gap: 0.35em; /* equal spacing between SOFT and YEAR */
  margin-top: 0.6em; /* push meta to a new line under the title */
  font-size: clamp(12px, 2.2vw, 24px); /* smaller than the main title */
  line-height: 1.2;
}

.meta-row {
  display: contents; /* let children participate directly in CSS grid */
  white-space: nowrap;
}

.meta-label {
  opacity: 0.85;
  font-size: 0.9em;
  justify-self: end; /* right column alignment for label column */
  text-align: right;
}

.meta-value {
  opacity: 0.95;
  justify-self: start; /* left alignment for value column */
  text-align: left;
}

/* Right-align YEAR value on the right edge */
.title-large .meta-side .meta-row:nth-of-type(2) .meta-value,
.playing-right .meta-row:nth-of-type(2) .meta-value {
  justify-self: end;
  text-align: right;
}

/* PLAYING: bottom-left title small, bottom-right SOFT/YEAR */
.overlay.playing {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 2vh 3vw;
}

.playing-left {
  font-family: Georgia, serif;
  border: 1.5px solid white;
  font-size: clamp(14px, 2.2vw, 28px);
  letter-spacing: 0.2em;
  line-height: 1.1;
  transform: scaleY(1.4);
  max-width: 50vw;
}

.playing-right {
  display: grid;
  grid-template-columns: auto auto; /* col1: label, col2: value */
  justify-content: end; /* pack grid to the right */
  column-gap: 0.6em;
  row-gap: 0.3em; /* equal spacing */
  font-family: Georgia, serif;
  font-size: clamp(14px, 2.2vw, 20px);
}


.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  pointer-events: auto;
}
</style>
