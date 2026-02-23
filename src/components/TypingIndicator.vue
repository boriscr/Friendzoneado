<template>
  <div class="typing-indicator">
    <div class="typing-bubble">
      <span class="typing-name">{{ senderName }} está escribiendo</span>
      <div class="typing-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sender: { type: String, default: '' }
})

const senderName = computed(() => {
  const names = {
    valeria: 'Valeria'
  }
  return names[props.sender] || props.sender || 'Alguien'
})
</script>

<style scoped>
.typing-indicator {
  display: flex;
  justify-content: flex-start;
  padding: 4px 16px;
}

.typing-bubble {
  background: var(--bubble-incoming);
  border-radius: 18px 18px 18px 4px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.typing-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
