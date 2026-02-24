import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { playSound } from '../utils/sounds'

export function useDialogEngine() {
    const store = useGameStore()

    const nodes = ref([])
    const nodeMap = ref({})

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

    async function processNode(startNodeId) {
        if (!startNodeId || store.isProcessing) return

        store.isProcessing = true
        try {
            let currentNodeToProcess = startNodeId

            while (currentNodeToProcess) {
                const node = nodeMap.value[currentNodeToProcess]
                if (!node) {
                    console.warn(`Node "${currentNodeToProcess}" not found`)
                    break
                }

                store.currentNodeId = currentNodeToProcess

                // ── Part end: transition to next part ──────────
                if (node.type === 'part_end') {
                    store.currentNodeId = null
                    if (node.nextPart) {
                        store.currentPart = node.nextPart
                        await loadPartData(store.currentChapter, node.nextPart)
                        store.showPartIntro = true
                    }
                    await store.saveProgress()
                    break // Stop processing
                }

                // ── Choice node: stop and wait for player ────────
                if (node.type === 'choice') {
                    store.currentChoices = node.choices.map(c => ({
                        ...c,
                        text: replacePlaceholders(c.text)
                    }))
                    store.isWaitingForChoice = true
                    break // Stop processing
                }

                // ── Fake typing indicator ───────────────────────
                if (node.type === 'typing_fake') {
                    const cycles = node.typingCycles || 3
                    for (let i = 0; i < cycles; i++) {
                        store.isTyping = true
                        store.typingSender = node.sender
                        playSound('typing')
                        await sleep(1500 + Math.random() * 1500)
                        store.isTyping = false
                        store.typingSender = ''
                        if (i < cycles - 1) await sleep(800 + Math.random() * 1200)
                    }
                    executeActions(node.actions)
                    currentNodeToProcess = node.nextId
                    store.currentNodeId = node.nextId
                    await store.saveProgress()
                    continue // Go to next node immediately
                }

                // ── Simulate "reading" pause ───────────────────
                if (store.lastWasPlayerChoice && node.sender !== 'player' && node.sender !== 'system') {
                    store.isReading = true
                    await sleep(1000 + Math.random() * 2500)
                    store.markLastPlayerMessageRead()
                    store.isReading = false
                    await sleep(500 + Math.random() * 1500)
                    store.lastWasPlayerChoice = false
                }

                // ── Calculate and apply smart delay ────────────
                const smartDelay = (() => {
                    if (node.delay && node.delay > 0) return node.delay
                    const content = node.content || ''
                    if (node.type === 'audio') return 12000 + Math.random() * 6000
                    if (node.type === 'image') return 3000 + Math.random() * 2000
                    const charDelay = content.length * 60
                    return Math.max(1500, Math.min(5000, charDelay)) + Math.random() * 500
                })()

                if (node.sender !== 'player' && node.sender !== 'system' && smartDelay > 0) {
                    if (node.type === 'audio') store.isRecording = true
                    else store.isTyping = true
                    store.typingSender = node.sender
                    playSound('typing')
                    await sleep(smartDelay)
                    store.isTyping = false
                    store.isRecording = false
                    store.typingSender = ''
                } else if (node.sender === 'system') {
                    const sysPause = Math.max(1000, Math.min(3000, (node.content || '').length * 40))
                    await sleep(node.delay || sysPause)
                }

                // ── Add message and play sound ──────────────────
                store.addMessage({
                    id: node.id,
                    sender: node.sender,
                    type: node.type,
                    content: replacePlaceholders(node.content)
                })
                if (node.sender !== 'player') playSound('receive')

                // ── Execute actions ──────────────────────────────
                executeActions(node.actions)
                await store.saveProgress()

                // ── Auto-read wait ──────────────────────────────
                if (node.nextId || node.conditions) {
                    const readingWait = Math.max(1500, Math.min(5500, (node.content || '').length * 55))
                    await sleep(readingWait + Math.random() * 500)
                }

                // ── Determine next node (priority: conditions) ──
                const condNextId = evaluateConditions(node.conditions)
                currentNodeToProcess = condNextId || node.nextId
            }
        } finally {
            store.isProcessing = false
        }
    }

    async function selectChoice(index) {
        if (!store.isWaitingForChoice) return

        // Immediately block further choices
        store.isWaitingForChoice = false

        const choice = store.currentChoices[index]
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
        store.isWaitingForChoice = false
        store.currentChoices = []

        // Flag that the next NPC message should have a "reading" delay
        store.lastWasPlayerChoice = true

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

    function resetEngine() {
        store.isWaitingForChoice = false
        store.currentChoices = []
        store.isProcessing = false
        store.lastWasPlayerChoice = false
    }

    // ── Exposed API ──────────────────────────────────────

    return {
        startChapter,
        resumeFromNode,
        loadPartData,
        loadChapter, // Exported to allow manual loading if needed
        selectChoice,
        resetEngine,
        isWaitingForChoice: computed(() => store.isWaitingForChoice),
        choices: computed(() => store.currentChoices),
        isProcessing: computed(() => store.isProcessing)
    }
}
