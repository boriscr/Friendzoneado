<template>
  <div class="chat-screen">
    <!-- Header -->
    <header class="chat-header">
      <div class="header-left">
        <div class="avatar">
          <span class="avatar-letter">
            <img class="avatar-img"
              src="https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/img/chapter_1/2-profile-valeria.webp" alt="">
          </span>
          <span class="status-dot" :class="{ online: !isChapterEnded }"></span>
        </div>
        <div class="header-info">
          <h2 class="contact-name">Valeria</h2>
          <p class="contact-status">
            <template v-if="store.isRecording">grabando audio…</template>
            <template v-else-if="store.isTyping">escribiendo…</template>
            <template v-else-if="isChapterEnded">desconectada</template>
            <template v-else>en línea</template>
          </p>
        </div>
      </div>
      <div class="header-right">
        <button class="header-btn" @click="showDebug = !showDebug" title="Debug">
          ⚙️
        </button>
      </div>
    </header>

    <!-- Debug panel (dev only) -->
    <div v-if="showDebug" class="debug-panel">
      <p>❤️ Afecto: <strong>{{ store.gameState.valeria_affection }}</strong></p>
      <p>🔍 Misterio: <strong>{{ store.gameState.mistery_level }}</strong></p>
      <button class="debug-reset-btn" @click="handleReset">Reiniciar todo</button>
    </div>

    <!-- Messages area -->
    <div class="messages-area" ref="messagesContainer">
      <div class="messages-list">
        <MessageBubble v-for="msg in store.chatHistory" :key="msg.id + '-' + msg.timestamp" :message="msg" />

        <!-- Typing / Recording indicator -->
        <TypingIndicator v-if="store.isTyping || store.isRecording" :sender="store.typingSender" />

        <!-- Scroll anchor -->
        <div ref="scrollAnchor"></div>
      </div>
    </div>

    <!-- Choice panel -->
    <ChoicePanel v-if="engine.isWaitingForChoice.value" :choices="engine.choices.value" @select="handleChoice" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useDialogEngine } from '../composables/useDialogEngine'
import chapter1Data from '../data/chapter1.json'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'
import ChoicePanel from './ChoicePanel.vue'

const store = useGameStore()
const engine = useDialogEngine()

const messagesContainer = ref(null)
const scrollAnchor = ref(null)
const showDebug = ref(false)
const isChapterEnded = ref(false)

// ── Auto-scroll to bottom on new messages ──────────
function scrollToBottom() {
  nextTick(() => {
    scrollAnchor.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

watch(() => store.chatHistory.length, () => {
  scrollToBottom()
})

watch(() => store.isTyping, () => {
  scrollToBottom()
})

watch(() => store.isRecording, () => {
  scrollToBottom()
})

// ── Watch for chapter end ──────────────────────────
watch(() => store.currentNodeId, (val) => {
  if (val === null && store.chatHistory.length > 0) {
    isChapterEnded.value = true
  }
})

// ── Choice handling ────────────────────────────────
async function handleChoice(index) {
  await engine.selectChoice(index)
  scrollToBottom()
}

// ── Reset ──────────────────────────────────────────
function handleReset() {
  store.resetGame()
}

// ── Start / Resume ─────────────────────────────────
onMounted(async () => {
  // Try to load saved progress
  await store.loadProgress()

  if (store.chatHistory.length > 0 && store.currentNodeId) {
    // Resume from where we left off
    await engine.resumeFromNode(chapter1Data, store.currentNodeId)
  } else if (store.chatHistory.length === 0) {
    // Fresh start
    await engine.startChapter(chapter1Data)
  }
  // else: chatHistory exists but currentNodeId is null → chapter finished, just display history

  scrollToBottom()
})
</script>

<style scoped>
.chat-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-primary);
  position: relative;
}

/* ── Header ─────────────────────────────────────── */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  background: var(--bg-header);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #a855f7);
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-letter {
  color: white;
  font-weight: 700;
  font-size: 18px;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #666;
  border: 2px solid var(--bg-header);
  transition: background 0.3s;
}

.status-dot.online {
  background: #25d366;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.contact-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e9edef;
}

.contact-status {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.header-right {
  display: flex;
  gap: 8px;
}

.header-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* ── Debug panel ────────────────────────────────── */
.debug-panel {
  padding: 10px 16px;
  background: rgba(108, 92, 231, 0.1);
  border-bottom: 1px solid rgba(108, 92, 231, 0.2);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.debug-panel p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.debug-reset-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255, 80, 80, 0.4);
  border-radius: 8px;
  background: rgba(255, 80, 80, 0.1);
  color: #ff6b6b;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.debug-reset-btn:hover {
  background: rgba(255, 80, 80, 0.2);
}

/* ── Messages area ──────────────────────────────── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 0;
  min-height: 100%;
  justify-content: flex-end;
}
</style>
