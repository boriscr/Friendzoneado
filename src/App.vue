<template>
  <div class="app-container">
    <!-- View Switcher -->
    <template v-if="store.currentView === 'menu'">
      <MainMenu />
    </template>
    <template v-else-if="store.currentView === 'nameEntry'">
      <NameEntry />
    </template>
    <template v-else-if="store.currentView === 'chatList'">
      <ChatList />
    </template>
    <template v-else-if="store.currentView === 'chat'">
      <ChatWindow />
    </template>
    <template v-else>
      <!-- Fail-safe fallback -->
      <MainMenu />
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/gameStore'
import { stopBackgroundMusic } from './utils/sounds'
import { App } from '@capacitor/app'
import MainMenu from './components/MainMenu.vue'
import NameEntry from './components/NameEntry.vue'
import ChatList from './components/ChatList.vue'
import ChatWindow from './components/ChatWindow.vue'

const store = useGameStore()

let backListener

onMounted(async () => {
  // Just check for save on mount, don't auto-start
  await store.checkSave()

  // Hardware Back Button handling
  backListener = await App.addListener('backButton', () => {
    if (store.currentView === 'chat') {
      store.currentView = 'chatList'
      store.saveProgress()
    } else if (store.currentView === 'chatList') {
      store.currentView = 'menu'
      store.saveProgress()
    } else if (store.currentView === 'nameEntry') {
      store.currentView = 'menu'
      store.saveProgress()
    } else if (store.currentView === 'menu') {
      App.exitApp()
    }
  })
})

onUnmounted(() => {
  stopBackgroundMusic()
  if (backListener) {
    backListener.remove()
  }
})
</script>

<style>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
