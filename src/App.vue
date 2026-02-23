<template>
  <NameEntry v-if="!store.gameStarted" />
  <ChatWindow v-else />
</template>

<script setup>
import { onMounted } from 'vue'
import { useGameStore } from './stores/gameStore'
import NameEntry from './components/NameEntry.vue'
import ChatWindow from './components/ChatWindow.vue'

const store = useGameStore()

onMounted(async () => {
  await store.loadPlayerName()
})
</script>

<style scoped>
/* App shell has no extra styles — everything is handled by components */
</style>
