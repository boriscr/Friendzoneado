<template>
  <div :class="['message-bubble', `sender-${message.sender}`]">
    <!-- System messages -->
    <div v-if="message.sender === 'system'" class="system-message">
      <span>{{ message.content }}</span>
    </div>

    <!-- Chat messages (player & NPC) -->
    <div v-else class="bubble-wrapper">
      <div class="bubble">
        <!-- Text -->
        <p v-if="message.type === 'text'" class="message-text">{{ message.content }}</p>

        <!-- Image -->
        <div v-else-if="message.type === 'image'" class="message-image">
          <img
            :src="message.content"
            alt="Imagen"
            @error="onImageError"
            loading="lazy"
          />
          <div v-if="imageError" class="image-fallback">
            <span class="fallback-icon">🖼️</span>
            <span class="fallback-text">Imagen no disponible</span>
          </div>
        </div>

        <!-- Audio -->
        <div v-else-if="message.type === 'audio'" class="message-audio">
          <button class="audio-play-btn" @click="toggleAudio">
            <span v-if="!isPlaying">▶</span>
            <span v-else>⏸</span>
          </button>
          <div class="audio-waveform">
            <div
              class="audio-progress"
              :style="{ width: audioProgress + '%' }"
            ></div>
            <div class="waveform-bars">
              <span
                v-for="i in 20"
                :key="i"
                class="bar"
                :style="{ height: getBarHeight(i) + 'px' }"
              ></span>
            </div>
          </div>
          <span class="audio-duration">{{ formattedDuration }}</span>
          <audio
            ref="audioEl"
            :src="message.content"
            @timeupdate="onTimeUpdate"
            @ended="onAudioEnded"
            @loadedmetadata="onMetaLoaded"
            @error="onAudioLoadError"
            preload="metadata"
          ></audio>
        </div>

        <!-- Timestamp + Read receipts -->
        <span class="message-time">
          {{ formattedTime }}
          <span v-if="message.sender === 'player'" :class="['read-receipt', { read: message.read }]">
            <template v-if="message.read">✓✓</template>
            <template v-else>✓</template>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true }
})

// ── Time formatting ────────────────────────────────
const formattedTime = computed(() => {
  if (!props.message.timestamp) return ''
  const d = new Date(props.message.timestamp)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

// ── Image handling ─────────────────────────────────
const imageError = ref(false)
function onImageError() {
  imageError.value = true
}

// ── Audio handling ─────────────────────────────────
const audioEl = ref(null)
const isPlaying = ref(false)
const audioProgress = ref(0)
const duration = ref(0)
const audioLoadError = ref(false)

const formattedDuration = computed(() => {
  const secs = Math.round(duration.value)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

function getBarHeight(index) {
  // Pseudo-random waveform visualization
  const seed = (index * 7 + 3) % 13
  return 4 + seed * 1.5
}

function toggleAudio() {
  if (!audioEl.value || audioLoadError.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
  } else {
    audioEl.value.play().catch(() => {
      audioLoadError.value = true
    })
    isPlaying.value = true
  }
}

function onTimeUpdate() {
  if (!audioEl.value) return
  const pct = (audioEl.value.currentTime / audioEl.value.duration) * 100
  audioProgress.value = isNaN(pct) ? 0 : pct
}

function onAudioEnded() {
  isPlaying.value = false
  audioProgress.value = 0
}

function onMetaLoaded() {
  if (audioEl.value) {
    duration.value = audioEl.value.duration
  }
}

function onAudioLoadError() {
  audioLoadError.value = true
  duration.value = 0
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  padding: 2px 16px;
  animation: fadeSlideIn 0.3s ease forwards;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── System message ─────────────────────────────── */
.system-message {
  width: 100%;
  text-align: center;
  padding: 8px 0;
}

.system-message span {
  display: inline-block;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  padding: 6px 16px;
  border-radius: 10px;
  font-style: italic;
  line-height: 1.4;
}

/* ── Bubble wrapper ─────────────────────────────── */
.bubble-wrapper {
  max-width: 80%;
  display: flex;
}

.sender-player {
  justify-content: flex-end;
}

.sender-player .bubble {
  background: var(--bubble-outgoing);
  border-radius: 18px 18px 4px 18px;
}

.sender-valeria .bubble,
.message-bubble:not(.sender-player):not(.sender-system) .bubble {
  background: var(--bubble-incoming);
  border-radius: 18px 18px 18px 4px;
}

.bubble {
  padding: 8px 12px;
  position: relative;
  min-width: 80px;
}

/* ── Text ───────────────────────────────────────── */
.message-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.45;
  color: #e9edef;
  word-break: break-word;
}

/* ── Image ──────────────────────────────────────── */
.message-image {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  min-height: 120px;
  min-width: 180px;
}

.message-image img {
  width: 100%;
  max-width: 260px;
  display: block;
  border-radius: 10px;
}

.image-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.fallback-icon {
  font-size: 32px;
}

.fallback-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── Audio ──────────────────────────────────────── */
.message-audio {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  padding: 4px 0;
}

.audio-play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(108, 92, 231, 0.8);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.audio-play-btn:hover {
  background: rgba(108, 92, 231, 1);
  transform: scale(1.05);
}

.audio-waveform {
  flex: 1;
  height: 28px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.audio-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(108, 92, 231, 0.3);
  border-radius: 4px;
  transition: width 0.1s linear;
}

.waveform-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  position: relative;
  z-index: 1;
}

.bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  min-width: 2px;
  transition: background 0.2s;
}

.audio-duration {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  flex-shrink: 0;
  min-width: 32px;
  text-align: right;
}

/* ── Timestamp ──────────────────────────────────── */
.message-time {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
}

/* ── Read receipts ──────────────────────────────── */
.read-receipt {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  transition: color 0.4s ease;
  letter-spacing: -2px;
}

.read-receipt.read {
  color: #53bdeb;
}
</style>
