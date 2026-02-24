<script setup>
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

const handleRestart = () => {
    store.resetGame(true)
    store.currentView = 'menu'
}
</script>

<template>
    <div v-if="store.isGameOver" class="game-over-overlay">
        <div class="game-over-content">
            <h1 class="glitch-text" data-text="GAME OVER">GAME OVER</h1>
            <p class="message">{{ store.gameOverMessage }}</p>
            <div class="divider"></div>
            <button @click="handleRestart" class="restart-btn">
                VOLVER AL MENÚ
            </button>
        </div>
    </div>
</template>

<style scoped>
.game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(10px);
}

.game-over-content {
    text-align: center;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
}

.glitch-text {
    font-size: 4rem;
    font-weight: 900;
    color: #ff0055;
    margin-bottom: 1rem;
    position: relative;
    text-transform: uppercase;
    letter-spacing: 4px;
}

.message {
    font-size: 1.2rem;
    color: #ccc;
    line-height: 1.6;
    margin-bottom: 2rem;
}

.divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, #ff0055, transparent);
    margin: 2rem 0;
}

.restart-btn {
    background: transparent;
    border: 2px solid #ff0055;
    color: #ff0055;
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.restart-btn:hover {
    background: #ff0055;
    color: white;
    box-shadow: 0 0 20px rgba(255, 0, 85, 0.4);
}

@keyframes glitch {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
}
</style>
