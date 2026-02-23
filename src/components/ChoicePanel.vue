<template>
  <div class="choice-panel" v-if="choices.length">
    <div class="choices-container">
      <button
        v-for="(choice, index) in choices"
        :key="index"
        class="choice-btn"
        @click="$emit('select', index)"
      >
        <span class="choice-text">{{ choice.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  choices: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])
</script>

<style scoped>
.choice-panel {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, var(--bg-primary) 60%, transparent);
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-btn {
  width: 100%;
  padding: 14px 20px;
  border: 1px solid rgba(108, 92, 231, 0.3);
  border-radius: 16px;
  background: rgba(108, 92, 231, 0.1);
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  line-height: 1.4;
  position: relative;
  overflow: hidden;
}

.choice-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(168, 85, 247, 0.1));
  opacity: 0;
  transition: opacity 0.25s ease;
}

.choice-btn:hover {
  border-color: rgba(108, 92, 231, 0.6);
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(108, 92, 231, 0.2);
}

.choice-btn:hover::before {
  opacity: 1;
}

.choice-btn:active {
  transform: translateX(2px) scale(0.98);
}

.choice-text {
  position: relative;
  z-index: 1;
}
</style>
