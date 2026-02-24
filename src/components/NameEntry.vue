<template>
  <div class="name-entry-overlay">
    <div class="name-entry-card">
      <div class="card-glow"></div>
      <div class="card-content">
        <div class="app-icon">💬</div>
        <h1 class="app-title">Friendzoneado</h1>
        <p class="app-subtitle">Una historia interactiva que cambiará con cada decisión que tomes.</p>

        <form @submit.prevent="handleSubmit" class="name-form">
          <div class="input-wrapper">
            <input ref="nameInput" v-model="name" type="text" placeholder="Escribe tu nombre..." maxlength="20"
              autocomplete="off" class="name-input" />
          </div>
          <button type="submit" class="start-btn" :disabled="!name.trim()">
            Comenzar
            <span class="btn-arrow">→</span>
          </button>
        </form>

        <p class="hint-text">Tu nombre será usado dentro de la historia</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const name = ref('')
const nameInput = ref(null)

onMounted(() => {
  if (store.playerName) {
    name.value = store.playerName
  }
  nameInput.value?.focus()
})

async function handleSubmit() {
  if (!name.value.trim()) return
  try {
    await store.setPlayerName(name.value.trim())
    store.currentView = 'chat'
  } catch (e) {
    console.warn('Could not save player name:', e)
  }
}
</script>

<style scoped>
.name-entry-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1628 100%);
  padding: 20px;
  overflow: hidden;
}

.name-entry-overlay::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.name-entry-overlay::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 206, 209, 0.1) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(30px, -30px) scale(1.1);
  }
}

.name-entry-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 25px;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.4), transparent 50%, rgba(0, 206, 209, 0.3));
  z-index: -1;
  filter: blur(1px);
}

.card-content {
  padding: 48px 32px 40px;
  text-align: center;
}

.app-icon {
  font-size: 56px;
  margin-bottom: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 36px;
  line-height: 1.5;
}

.name-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  position: relative;
}

.name-input {
  width: 100%;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.name-input:focus {
  border-color: rgba(108, 92, 231, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.15);
}

.start-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #6c5ce7, #a855f7);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(108, 92, 231, 0.4);
}

.start-btn:active:not(:disabled) {
  transform: translateY(0);
}

.start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-arrow {
  transition: transform 0.3s ease;
}

.start-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(4px);
}

.hint-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  margin: 20px 0 0;
}
</style>
