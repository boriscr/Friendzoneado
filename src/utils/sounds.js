// ── Chat Sound Effects ─────────────────────────────
// Plays one-shot sounds for typing, sending, and receiving messages.

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/audio/effects/messages'

const SOUNDS = {
    typing: `${CDN_BASE}/writing-messaje.mp3`,
    send: `${CDN_BASE}/send-message.mp3`,
    receive: `${CDN_BASE}/receive-message.mp3`
}

// Pre-loaded audio cache
const audioCache = {}

function preload() {
    for (const [key, url] of Object.entries(SOUNDS)) {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.volume = 0.6
        audioCache[key] = audio
    }
}

/**
 * Play a sound effect once.
 * @param {'typing' | 'send' | 'receive'} name
 */
export function playSound(name) {
    try {
        const cached = audioCache[name]
        if (cached) {
            // Clone the audio so overlapping plays don't cut each other
            const clone = cached.cloneNode()
            clone.volume = cached.volume
            clone.play().catch(() => { })
        } else {
            // Fallback: create and play on the fly
            const audio = new Audio(SOUNDS[name])
            audio.volume = 0.6
            audio.play().catch(() => { })
        }
    } catch (e) {
        // Silently fail — sounds are non-critical
    }
}

// Preload sounds on module import
preload()
