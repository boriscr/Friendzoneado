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
            }
        }
    }

    // ── Core engine ──────────────────────────────────────

    function loadChapter(chapterData) {
        nodes.value = chapterData.nodes
        nodeMap.value = {}
        for (const node of chapterData.nodes) {
            nodeMap.value[node.id] = node
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

        // ── Show typing indicator for NPC messages ───────
        if (node.sender !== 'player' && node.sender !== 'system' && node.delay > 0) {
            store.isTyping = true
            store.typingSender = node.sender
            playSound('typing')
            await sleep(node.delay)
            store.isTyping = false
            store.typingSender = ''
        } else if (node.sender === 'system' && node.delay > 0) {
            await sleep(node.delay)
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

    async function startChapter(chapterData) {
        loadChapter(chapterData)
        await processNode('start')
    }

    async function resumeFromNode(chapterData, nodeId) {
        loadChapter(chapterData)
        if (nodeId) {
            await processNode(nodeId)
        }
    }

    // ── Exposed API ──────────────────────────────────────

    const isWaitingForChoice = computed(() => waitingForChoice.value)
    const choices = computed(() => currentChoices.value)

    return {
        startChapter,
        resumeFromNode,
        selectChoice,
        isWaitingForChoice,
        choices,
        isProcessing: computed(() => isProcessing.value)
    }
}
