<template>
    <div class="main-menu">
        <!-- Animated background -->
        <div class="menu-background">
            <img src="https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/img/app/background.webp" alt=""
                class="bg-image">
            <div class="bg-overlay"></div>
        </div>

        <!-- Content -->
        <div class="menu-content">
            <h1 class="game-title">Friendzoneado</h1>
            <p class="game-subtitle">Elige tu historia</p>

            <!-- Chapter Selection Carousel -->
            <div class="chapter-carousel-wrapper">
                <div class="chapter-carousel">
                    <ChapterCard v-for="chapter in store.chapters" :key="chapter.id" :title="chapter.title"
                        :subtitle="chapter.subtitle" :image="chapter.image" :unlocked="chapter.unlocked"
                        @select="handleSelectChapter(chapter.id)" />
                </div>
            </div>

            <div class="menu-actions">
                <button v-if="store.hasSave" @click="handleContinue" class="btn-secondary-mini">
                    Continuar partida
                </button>
                <div class="footer-actions">
                    <button @click="handleDeleteData" class="btn-ghost-mini">Borrar Datos</button>
                    <button @click="handleExit" class="btn-ghost-mini">Salir</button>
                </div>
            </div>
        </div>

        <div class="menu-footer">
            <p>© 2026 Kredensir Games</p>
        </div>

        <!-- Confirmation Modal -->
        <Transition name="scale">
            <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
                <div class="confirm-modal">
                    <div class="modal-glow"></div>
                    <h2 class="modal-title">¿Deseas continuar?</h2>
                    <p class="modal-text">Ya tienes una partida guardada en este capítulo. ¿Quieres retomar tu historia
                        o empezar desde el principio?</p>

                    <div class="modal-buttons">
                        <button @click="confirmContinue" class="btn-primary">Continuar Historia</button>
                        <button @click="confirmRestart" class="btn-outline-danger">Reiniciar Capítulo</button>
                        <button @click="showConfirmModal = false" class="btn-ghost">Cancelar</button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { playBackgroundMusic, stopBackgroundMusic } from '../utils/sounds'
import { App } from '@capacitor/app'
import ChapterCard from './ChapterCard.vue'

const store = useGameStore()
const showConfirmModal = ref(false)
const pendingChapterId = ref(null)

onMounted(async () => {
    await store.checkSave()
    playBackgroundMusic('https://cdn.jsdelivr.net/gh/boriscr/FriendzoneadoFiles/audio/music/main-menu-mystery.mp3', 0.5)
})

onUnmounted(() => {
    stopBackgroundMusic()
})

const handleContinue = () => {
    store.continueGame()
}

const handleSelectChapter = (id) => {
    if (store.hasSave) {
        pendingChapterId.value = id
        showConfirmModal.value = true
    } else {
        store.selectChapter(id)
    }
}

const confirmContinue = () => {
    showConfirmModal.value = false
    store.continueGame()
}

const confirmRestart = () => {
    showConfirmModal.value = false
    if (pendingChapterId.value !== null) {
        store.selectChapter(pendingChapterId.value)

        // If we already have a player name, trigger the engine immediately
        if (store.playerName) {
            const engine = useDialogEngine()
            engine.startChapter(store.currentChapter, store.currentPart)
        }
    }
}

const handleDeleteData = async () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
        store.resetGame(false)
        await store.checkSave()
    }
}

const handleExit = async () => {
    await App.exitApp()
}
</script>

<style scoped>
.main-menu {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: #fff;
}

.menu-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.5;
    filter: brightness(0.6) contrast(1.2) grayscale(0.3);
    animation: ken-burns 20s ease-in-out infinite;
}

.bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, transparent 0%, rgba(11, 20, 26, 0.8) 100%);
}

.menu-content {
    position: relative;
    z-index: 10;
    text-align: center;
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: 4rem;
}

.game-title {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-shadow: 0 0 20px rgba(108, 92, 231, 0.5);
    background: linear-gradient(to bottom, #fff, #a855f7);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.game-subtitle {
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 2px;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    text-transform: uppercase;
}

/* Carousel Styles */
.chapter-carousel-wrapper {
    width: 100%;
    overflow-x: auto;
    padding: 1rem 0 3rem;
    -webkit-overflow-scrolling: touch;
}

.chapter-carousel-wrapper::-webkit-scrollbar {
    height: 4px;
}

.chapter-carousel-wrapper::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.chapter-carousel-wrapper::-webkit-scrollbar-thumb {
    background: var(--accent);
    border-radius: 10px;
}

.chapter-carousel {
    display: flex;
    gap: 1.5rem;
    padding: 0 2rem;
    width: max-content;
    margin: 0 auto;
}

.menu-actions {
    margin-top: auto;
    padding-bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
}

.footer-actions {
    display: flex;
    gap: 2rem;
}

.btn-secondary-mini {
    padding: 0.8rem 1.5rem;
    background: rgba(108, 92, 231, 0.15);
    color: #fff;
    border: 1px solid rgba(108, 92, 231, 0.3);
    border-radius: 30px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
}

.btn-secondary-mini:hover {
    background: var(--accent);
    box-shadow: 0 0 20px rgba(108, 92, 231, 0.4);
}

.btn-ghost-mini {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.3s ease;
}

.btn-ghost-mini:hover {
    color: #fff;
}

.btn-danger-mini {
    color: #ff4444;
}

.menu-footer {
    position: absolute;
    bottom: 0.5rem;
    z-index: 10;
    font-size: 0.7rem;
    color: var(--text-secondary);
    opacity: 0.5;
}

/* Optional Glitch effect for Continue button if you want it more mysterious */
.btn-glitch:hover {
    animation: glitch 0.3s linear infinite;
}

@keyframes glitch {
    0% {
        transform: translate(0);
    }

    20% {
        transform: translate(-2px, 2px);
    }

    40% {
        transform: translate(-2px, -2px);
    }

    60% {
        transform: translate(2px, 2px);
    }

    80% {
        transform: translate(2px, -2px);
    }

    100% {
        transform: translate(0);
    }
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.confirm-modal {
    position: relative;
    width: 100%;
    max-width: 400px;
    background: rgba(32, 44, 51, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-glow {
    position: absolute;
    inset: -1px;
    border-radius: 25px;
    background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), transparent 60%, rgba(168, 85, 247, 0.2));
    z-index: -1;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: #fff;
}

.modal-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2rem;
}

.modal-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.btn-primary {
    padding: 1rem;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #6c5ce7, #a855f7);
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-primary:active {
    transform: scale(0.98);
}

.btn-outline-danger {
    padding: 1rem;
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 14px;
    background: rgba(255, 68, 68, 0.05);
    color: #ff4d4d;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
}

.btn-ghost {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    padding: 0.5rem;
    cursor: pointer;
}

/* Transitions */
.scale-enter-active,
.scale-leave-active {
    transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>
