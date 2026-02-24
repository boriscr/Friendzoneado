<template>
  <div class="app-container">
    <MainMenu v-if="store.currentView === 'menu'" />
    <NameEntry v-else-if="store.currentView === 'nameEntry'" />
    <ChatWindow v-else-if="store.currentView === 'chat'" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/gameStore'
import { stopBackgroundMusic } from './utils/sounds'
import MainMenu from './components/MainMenu.vue'
import NameEntry from './components/NameEntry.vue'
import ChatWindow from './components/ChatWindow.vue'

const store = useGameStore()

onMounted(async () => {
  // Just check for save on mount, don't auto-start
  await store.checkSave()
})

onUnmounted(() => {
  stopBackgroundMusic()
})
</script>

<style>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
