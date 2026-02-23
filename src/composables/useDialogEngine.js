import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { playSound } from '../utils/sounds'

export function useDialogEngine() {
    const store = useGameStore()

    const nodes = ref([])
    const nodeMap = ref({})
    const waitingForChoice = ref(false)
    const currentChoices = ref([])
    const isProcessing = ref(false)
    const lastWasPlayerChoice = ref(false)

    // ── Helpers ──────────────────────────────────────────

    function replacePlaceholders(text) {
        if (!text) return text
        return text.replace(/\{\{name\}\}/g, store.playerName)
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    function evaluateConditions(conditions) {
        if (!conditions || conditions.length === 0) return null

        for (const cond of conditions) {
            const currentVal = store.gameState[cond.variable]
            let passes = false

            switch (cond.operator) {
                case '>=': passes = currentVal >= cond.value; break
                case '<=': passes = currentVal <= cond.value; break
                case '>': passes = currentVal > cond.value; break
                case '<': passes = currentVal < cond.value; break
                case '==': passes = currentVal === cond.value; break
                case '!=': passes = currentVal !== cond.value; break
                default: passes = false
            }

            if (passes) return cond.nextId
        }
        return null
    }

    function executeActions(actions) {
        if (!actions) return
        for (const action of actions) {
            if (action.type === 'set') {
                store.updateState(action.variable, action.value)
            } else if (action.type === 'setNPCStatus') {
                store.isNPCConnected = action.value
            } else if (action.type === 'setBlocked') {
                store.isBlocked = action.value
            }
        }
    }

    // ── Core engine ──────────────────────────────────────

    async function loadPartData(chapter, part) {
        try {
            const module = await import(`../data/chapter${chapter}_part${part}.json`)
            loadChapter(module.default)
        } catch (e) {
            console.error(`Failed to load data for chapter ${chapter} part ${part}:`, e)
        }
    }

    function loadChapter(chapterData) {
        nodes.value = chapterData.nodes
        nodeMap.value = {}
        for (const node of chapterData.nodes) {
            nodeMap.value[node.id] = node
        }
        if (chapterData.title) {
            store.currentPartTitle = chapterData.title
        }
    }

    async function processNode(nodeId) {
        if (!nodeId || isProcessing.value) return

        const node = nodeMap.value[nodeId]
        if (!node) {
            console.warn(`Node "${nodeId}" not found`)
            return
        }

        isProcessing.value = true
        store.currentNodeId = nodeId

        // ── Part end: transition to next part ──────────
        if (node.type === 'part_end') {
            isProcessing.value = false
            store.currentNodeId = null // Clear for next part
            if (node.nextPart) {
                store.currentPart = node.nextPart
                // Pre-load the next part's data so the Intro screen shows the correct title
                await loadPartData(store.currentChapter, node.nextPart)
                store.showPartIntro = true
            }
            await store.saveProgress()
            return
        }

        // ── Choice node: stop and wait for player ────────
        if (node.type === 'choice') {
            currentChoices.value = node.choices.map(c => ({
                ...c,
                text: replacePlaceholders(c.text)
            }))
            waitingForChoice.value = true
            isProcessing.value = false
            return
        }

        // ── Fake typing: typing indicator cycles, no message ─
        if (node.type === 'typing_fake') {
            const cycles = node.typingCycles || 3
            for (let i = 0; i < cycles; i++) {
                store.isTyping = true
                store.typingSender = node.sender
                playSound('typing')
                // Type for a random duration (1.5-3s)
                await sleep(1500 + Math.random() * 1500)
                store.isTyping = false
                store.typingSender = ''
                // Pause between cycles (0.8-2s)
                if (i < cycles - 1) {
                    await sleep(800 + Math.random() * 1200)
                }
            }

            // Execute any actions (like disconnecting)
            executeActions(node.actions)
            store.currentNodeId = node.nextId
            await store.saveProgress()
            isProcessing.value = false

            if (node.nextId) {
                await processNode(node.nextId)
            }
            return
        }

        // ── Simulate "reading" pause after player choice ─
        if (lastWasPlayerChoice.value && node.sender !== 'player' && node.sender !== 'system') {
            // Random delay before NPC "reads" the message (1-3.5s)
            const readDelay = 1000 + Math.random() * 2500
            store.isReading = true
            await sleep(readDelay)

            // Mark the player's message as "read" (double check ✓✓)
            store.markLastPlayerMessageRead()
            store.isReading = false

            // Extra random pause before starting to type (0.5-2s)
            const thinkDelay = 500 + Math.random() * 1500
            await sleep(thinkDelay)

            lastWasPlayerChoice.value = false
        }

        // ── Calculate smart delay based on content ────────
        function calculateSmartDelay(node) {
            // If explicit delay is set in JSON, use it as override
            if (node.delay && node.delay > 0) return node.delay

            const content = node.content || ''

            if (node.type === 'audio') {
                // Audio messages take longer: 12-18 seconds (simulates recording)
                return 12000 + Math.random() * 6000
            } else if (node.type === 'image') {
                // Images: 3-5 seconds
                return 3000 + Math.random() * 2000
            } else {
                // Text: scale with length (60ms per character, min 1.5s, max 5s)
                const charDelay = content.length * 60
                return Math.max(1500, Math.min(5000, charDelay)) + Math.random() * 500
            }
        }

        const smartDelay = calculateSmartDelay(node)

        // ── Show typing/recording indicator for NPC messages ─
        if (node.sender !== 'player' && node.sender !== 'system' && smartDelay > 0) {
            if (node.type === 'audio') {
                store.isRecording = true
            } else {
                store.isTyping = true
            }
            store.typingSender = node.sender
            playSound('typing')
            await sleep(smartDelay)
            store.isTyping = false
            store.isRecording = false
            store.typingSender = ''
        } else if (node.sender === 'system') {
            // System messages: brief pause scaled to length
            const sysPause = Math.max(1000, Math.min(3000, (node.content || '').length * 40))
            await sleep(node.delay || sysPause)
        }

        // ── Build the message ────────────────────────────
        const message = {
            id: node.id,
            sender: node.sender,
            type: node.type,
            content: replacePlaceholders(node.content)
        }

        store.addMessage(message)

        // Play receive sound for NPC/system messages
        if (node.sender !== 'player') {
            playSound('receive')
        }

        // ── Wait for player to read the message ──────────
        // Only if there's a next node to process automatically
        if (node.nextId || node.conditions) {
            const readingWait = Math.max(1500, Math.min(5500, (node.content || '').length * 55))
            await sleep(readingWait + Math.random() * 500)
        }

        // ── Execute attached actions ─────────────────────
        executeActions(node.actions)

        // ── Auto-save after each message ─────────────────
        store.currentNodeId = node.nextId
        await store.saveProgress()

        // ── Determine next node ──────────────────────────
        isProcessing.value = false

        // Check conditions first
        const condNextId = evaluateConditions(node.conditions)
        if (condNextId) {
            await processNode(condNextId)
            return
        }

        // Otherwise use the default nextId
        if (node.nextId) {
            await processNode(node.nextId)
        }
    }

    async function selectChoice(index) {
        if (!waitingForChoice.value) return

        const choice = currentChoices.value[index]
        if (!choice) return

        // Add the player's message to chat
        store.addMessage({
            id: `player_${Date.now()}`,
            sender: 'player',
            type: 'text',
            content: choice.text
        })

        // Play send sound
        playSound('send')

        // Apply stat impacts
        store.applyImpact(choice.impact)

        // Reset choice state
        waitingForChoice.value = false
        currentChoices.value = []

        // Flag that the next NPC message should have a "reading" delay
        lastWasPlayerChoice.value = true

        // Save and continue
        await store.saveProgress()

        // Process the next node
        if (choice.nextId) {
            await processNode(choice.nextId)
        }
    }

    async function startChapter(chapter, part = 1) {
        try {
            const module = await import(`../data/chapter${chapter}_part${part}.json`)
            loadChapter(module.default)
            store.currentChapter = chapter
            store.currentPart = part
            await processNode('start')
        } catch (e) {
            console.error(`Failed to load chapter ${chapter} part ${part}:`, e)
        }
    }

    async function resumeFromNode(chapter, part, nodeId) {
        try {
            const module = await import(`../data/chapter${chapter}_part${part}.json`)
            loadChapter(module.default)
            store.currentChapter = chapter
            store.currentPart = part
            if (nodeId) {
                await processNode(nodeId)
            }
        } catch (e) {
            console.error(`Failed to resume chapter ${chapter} part ${part}:`, e)
        }
    }

    // ── Exposed API ──────────────────────────────────────

    const isWaitingForChoice = computed(() => waitingForChoice.value)
    const choices = computed(() => currentChoices.value)

    return {
        startChapter,
        resumeFromNode,
        loadPartData,
        loadChapter, // Exported to allow manual loading if needed
        selectChoice,
        isWaitingForChoice,
        choices,
        isProcessing: computed(() => isProcessing.value)
    }
}
