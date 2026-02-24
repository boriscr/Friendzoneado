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
    const currentView = ref('menu')
    const hasSave = ref(false)

    // ── Narrative state variables ───────────────────────
    const gameState = reactive({
        valeria_affection: 50,
        mistery_level: 0,
        tension_level: 0,
        is_liar: false,
        is_boaster: false,
        quiz_points: 0,
        knows_address: false
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

    // ── Engine Internal State (Centralized) ─────────────
    const isProcessing = ref(false)
    const isWaitingForChoice = ref(false)
    const currentChoices = ref([])
    const lastWasPlayerChoice = ref(false)

    // ── Chapters Data ───────────────────────────────────
    const chapters = ref([
        {
            id: 1,
            title: 'Capítulo 1: Lazos de Sangre',
            subtitle: 'Un reencuentro inesperado que desatará una red de secretos y obsesión.',
            image: 'https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/img/chapter_1/1-portada.webp',
            unlocked: true
        },
        {
            id: 2,
            title: 'Capítulo 2: Sombras del Pasado',
            subtitle: 'Las consecuencias de tus actos comienzan a manifestarse. No hay vuelta atrás.',
            image: 'https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/img/chapter_2/2-portada.webp',
            unlocked: false // Will be set to true when Chapter 1 ends
        }
    ])

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
            gameStarted: gameStarted.value,
            currentView: currentView.value,
            currentChapter: currentChapter.value,
            currentPart: currentPart.value
        }
        await Preferences.set({ key: 'gameProgress', value: JSON.stringify(data) })
    }

    async function loadProgress() {
        const { value } = await Preferences.get({ key: 'gameProgress' })
        if (value) {
            hasSave.value = true
            try {
                const data = JSON.parse(value)
                Object.assign(gameState, data.gameState)
                chatHistory.value = data.chatHistory || []
                currentNodeId.value = data.currentNodeId || null
                currentView.value = data.currentView || 'menu'
                currentChapter.value = data.currentChapter || 1
                currentPart.value = data.currentPart || 1

                if (data.gameStarted) {
                    gameStarted.value = true
                }
            } catch (e) {
                console.warn('Failed to load saved progress:', e)
            }
        }
    }

    async function checkSave() {
        const { value: progress } = await Preferences.get({ key: 'gameProgress' })
        const { value: name } = await Preferences.get({ key: 'playerName' })
        hasSave.value = !!progress || !!name
    }

    function resetGame(keepName = true) {
        if (!keepName) {
            playerName.value = ''
            Preferences.remove({ key: 'playerName' })
        }
        gameStarted.value = false
        currentChapter.value = 1
        currentPart.value = 1
        showPartIntro.value = false
        hasSave.value = false
        gameState.valeria_affection = 50
        gameState.mistery_level = 0
        gameState.is_liar = false
        gameState.is_boaster = false
        chatHistory.value = []
        currentNodeId.value = null
        isTyping.value = false
        isReading.value = false
        isRecording.value = false
        typingSender.value = ''
        isNPCConnected.value = true
        isBlocked.value = false

        // Reset centralized engine state
        isProcessing.value = false
        isWaitingForChoice.value = false
        currentChoices.value = []
        lastWasPlayerChoice.value = false
        gameState.quiz_points = 0
        Preferences.remove({ key: 'gameProgress' })
    }

    function startNewGame() {
        resetGame()
        currentView.value = 'nameEntry'
    }

    async function continueGame() {
        await loadProgress()

        // Fallback: If after loading we are still on 'menu', force transition to chatList or chat
        if (currentView.value === 'menu') {
            if (chatHistory.value.length > 0) {
                currentView.value = 'chatList'
            } else if (gameStarted.value) {
                currentView.value = 'chatList'
            } else {
                currentView.value = 'nameEntry'
            }
        }
    }

    function selectChapter(id) {
        const chapter = chapters.value.find(c => c.id === id)
        if (chapter && chapter.unlocked) {
            resetGame()
            currentChapter.value = id
            currentPart.value = 1

            // If we already have a player name, we can jump to chatList
            if (playerName.value) {
                currentView.value = 'chatList'
            } else {
                currentView.value = 'nameEntry'
            }
        }
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
        currentView,
        hasSave,
        chatHistory,
        currentNodeId,
        isTyping,
        isReading,
        isRecording,
        typingSender,
        isNPCConnected,
        isBlocked,
        chapters,
        // actions
        setPlayerName,
        loadPlayerName,
        addMessage,
        markLastPlayerMessageRead,
        updateState,
        applyImpact,
        saveProgress,
        loadProgress,
        checkSave,
        resetGame,
        startNewGame,
        continueGame,
        selectChapter,
        // Engine State (Centralized)
        isProcessing,
        isWaitingForChoice,
        currentChoices,
        lastWasPlayerChoice
    }
})
