<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { playSound } from '../utils/sounds'

const store = useGameStore()
const visible = ref(false)

const props = defineProps({
  partNumber: Number,
  chapterNumber: Number,
  title: String
})

const emit = defineEmits(['start'])

onMounted(() => {
  visible.value = true
  playSound('receive') // Use a generic subtle sound for intro
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    dismiss()
  }, 4500)
})

function dismiss() {
  visible.value = false
  setTimeout(() => {
    store.showPartIntro = false
    emit('start')
  }, 600)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="part-intro-overlay" @click="dismiss">
      <div class="content">
        <div class="chapter-label">Capítulo {{ chapterNumber }}</div>
        <div class="divider"></div>
        <div class="part-number">Parte {{ partNumber }}</div>
        <h1 class="part-title">{{ title }}</h1>
        <div class="tap-hint">Toca para continuar</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.part-intro-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 2rem;
}

.content {
  animation: content-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.chapter-label {
  font-size: 0.9rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #ff4757;
  font-weight: 700;
  margin-bottom: 0.5rem;
  opacity: 0.8;
}

.divider {
  width: 40px;
  height: 2px;
  background: #ff4757;
  margin: 1rem auto;
}

.part-number {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 0.5rem;
  font-family: 'Inter', sans-serif;
}

.part-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  /* background: linear-gradient(135deg, #fff 0%, #aaa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; */
}

.tap-hint {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 4rem;
  animation: pulse 2s infinite;
}

@keyframes content-pop {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
