import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { Preferences } from '@capacitor/preferences'

export const useGameStore = defineStore('game', () => {
    // ── Player ──────────────────────────────────────────
    const playerName = ref('')
    const gameStarted = ref(false)
    const currentChapter = ref(1)
    const currentPart = ref(1)
    const currentPartTitle = ref('')
    const showPartIntro = ref(false)

    // ── Narrative state variables ───────────────────────
    const gameState = reactive({
        valeria_affection: 50,
        mistery_level: 0
    })

    // ── Chat ────────────────────────────────────────────
    const chatHistory = ref([])
    const currentNodeId = ref(null)
    const isTyping = ref(false)
    const isReading = ref(false)
    const isRecording = ref(false)
    const typingSender = ref('')
    const isNPCConnected = ref(true)
    const isBlocked = ref(false)

    // ── Actions: player name ────────────────────────────
    async function setPlayerName(name) {
        playerName.value = name.trim()
        await Preferences.set({ key: 'playerName', value: playerName.value })
    }

    async function loadPlayerName() {
        const { value } = await Preferences.get({ key: 'playerName' })
        if (value) {
            playerName.value = value
            gameStarted.value = true
        }
    }

    // ── Actions: messages ───────────────────────────────
    function addMessage(msg) {
        chatHistory.value.push({
            ...msg,
            timestamp: Date.now(),
            read: false
        })
    }

    function markLastPlayerMessageRead() {
        for (let i = chatHistory.value.length - 1; i >= 0; i--) {
            if (chatHistory.value[i].sender === 'player') {
                chatHistory.value[i].read = true
                break
            }
        }
    }

    // ── Actions: game state ─────────────────────────────
    function updateState(key, value) {
        if (key in gameState) {
            gameState[key] = value
        }
    }

    function applyImpact(impact) {
        if (!impact) return
        for (const [key, delta] of Object.entries(impact)) {
            if (key in gameState) {
                gameState[key] = Math.max(0, Math.min(100, gameState[key] + delta))
            }
        }
    }

    // ── Actions: persistence ────────────────────────────
    async function saveProgress() {
        const data = {
            gameState: { ...gameState },
            chatHistory: chatHistory.value,
            currentNodeId: currentNodeId.value,
            gameStarted: gameStarted.value
        }
        await Preferences.set({ key: 'gameProgress', value: JSON.stringify(data) })
    }

    async function loadProgress() {
        const { value } = await Preferences.get({ key: 'gameProgress' })
        if (value) {
            try {
                const data = JSON.parse(value)
                Object.assign(gameState, data.gameState)
                chatHistory.value = data.chatHistory || []
                currentNodeId.value = data.currentNodeId || null
                // safety: don't overwrite true with false from old progress
                if (data.gameStarted) {
                    gameStarted.value = true
                }
            } catch (e) {
                console.warn('Failed to load saved progress:', e)
            }
        }
    }

    function resetGame() {
        playerName.value = ''
        gameStarted.value = false
        currentChapter.value = 1
        currentPart.value = 1
        showPartIntro.value = false
        gameState.valeria_affection = 50
        gameState.mistery_level = 0
        chatHistory.value = []
        currentNodeId.value = null
        isTyping.value = false
        isReading.value = false
        isRecording.value = false
        typingSender.value = ''
        isNPCConnected.value = true
        isBlocked.value = false
        Preferences.remove({ key: 'gameProgress' })
        Preferences.remove({ key: 'playerName' })
    }

    return {
        // state
        playerName,
        gameStarted,
        gameState,
        currentChapter,
        currentPart,
        currentPartTitle,
        showPartIntro,
        chatHistory,
        currentNodeId,
        isTyping,
        isReading,
        isRecording,
        typingSender,
        isNPCConnected,
        isBlocked,
        // actions
        setPlayerName,
        loadPlayerName,
        addMessage,
        markLastPlayerMessageRead,
        updateState,
        applyImpact,
        saveProgress,
        loadProgress,
        resetGame
    }
})
