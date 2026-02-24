<template>
    <div class="chat-list-screen">
        <header class="list-header">
            <button class="back-btn" @click="handleBack">
                <span class="back-icon">←</span>
            </button>
            <h1 class="header-title">Chats</h1>
        </header>

        <div class="search-bar">
            <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Buscar..." disabled />
            </div>
        </div>

        <div class="chats-container">
            <div class="chat-item" @click="handleOpenChat" :class="{ 'unread': hasUnread }">
                <div class="item-avatar">
                    <img v-if="!store.isBlocked"
                        src="https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/img/chapter_1/2-profile-valeria.webp"
                        alt="Valeria" />
                    <div v-else class="avatar-placeholder">V</div>
                    <span class="online-status" v-if="store.isNPCConnected"></span>
                </div>

                <div class="item-details">
                    <div class="item-row">
                        <h3 class="item-name">Valeria</h3>
                        <span class="item-time">{{ lastMessageTime }}</span>
                    </div>
                    <div class="item-row">
                        <p class="item-preview">
                            <span v-if="store.isTyping" class="typing-text">escribiendo...</span>
                            <span v-else-if="store.isRecording" class="typing-text">grabando audio...</span>
                            <span v-else>{{ lastMessagePreview }}</span>
                        </p>
                        <span class="unread-badge" v-if="hasUnread">1</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

const handleBack = () => {
    store.currentView = 'menu'
    store.saveProgress()
}

const handleOpenChat = () => {
    store.currentView = 'chat'
    store.saveProgress()
}

const lastMessagePreview = computed(() => {
    if (store.chatHistory.length === 0) return '¡Nuevo mensaje!'
    const last = store.chatHistory[store.chatHistory.length - 1]
    if (last.type === 'image') return '📷 Foto'
    if (last.type === 'audio') return '🎤 Mensaje de voz'
    return last.content
})

const lastMessageTime = computed(() => {
    if (store.chatHistory.length === 0) return 'Ahora'
    const last = store.chatHistory[store.chatHistory.length - 1]
    const date = new Date(last.timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const hasUnread = computed(() => {
    return store.chatHistory.length === 0 ||
        (store.chatHistory.length > 0 && store.chatHistory[store.chatHistory.length - 1].sender !== 'player' && !store.chatHistory[store.chatHistory.length - 1].read)
})
</script>

<style scoped>
.chat-list-screen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    background: #0b141a;
    color: #e9edef;
}

.list-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    padding-top: calc(1rem + env(safe-area-inset-top, 0px));
    background: #202c33;
    gap: 1.5rem;
}

.back-btn {
    background: transparent;
    border: none;
    color: #8696a0;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.search-bar {
    padding: 0.5rem 1rem;
    background: #111b21;
}

.search-input-wrapper {
    background: #202c33;
    border-radius: 8px;
    padding: 0.4rem 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.search-icon {
    color: #8696a0;
    font-size: 0.9rem;
}

.search-input-wrapper input {
    background: transparent;
    border: none;
    color: #fff;
    width: 100%;
    font-size: 0.9rem;
    outline: none;
}

.chats-container {
    flex: 1;
    overflow-y: auto;
}

.chat-item {
    display: flex;
    padding: 0.8rem 1rem;
    gap: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.chat-item:hover {
    background: #202c33;
}

.item-avatar {
    position: relative;
    width: 50px;
    height: 50px;
    flex-shrink: 0;
}

.item-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #6c5ce7, #a855f7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.5rem;
}

.online-status {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #25d366;
    border: 2px solid #0b141a;
    border-radius: 50%;
}

.item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.2rem;
    min-width: 0;
}

.item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.item-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-time {
    font-size: 0.75rem;
    color: #8696a0;
}

.unread .item-time {
    color: #00a884;
}

.item-preview {
    margin: 0;
    font-size: 0.85rem;
    color: #8696a0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.typing-text {
    color: #00a884;
}

.unread-badge {
    background: #00a884;
    color: #0b141a;
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
}
</style>
