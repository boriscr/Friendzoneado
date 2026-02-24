<template>
    <div class="chapter-card" :class="{ 'is-locked': !unlocked }" @click="handleClick">
        <div class="card-bg">
            <img :src="image" alt="" class="card-img" />
            <div class="card-overlay"></div>
        </div>

        <div class="card-content">
            <div class="card-status" v-if="!unlocked">
                <span class="lock-icon">🔒</span>
                Bloqueado
            </div>
            <h3 class="card-title">{{ title }}</h3>
            <p class="card-subtitle">{{ subtitle }}</p>

            <div class="card-action" v-if="unlocked">
                <span class="play-icon">▶</span>
                Jugar
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: String,
    subtitle: String,
    image: String,
    unlocked: Boolean
})

const emit = defineEmits(['select'])

const handleClick = () => {
    emit('select')
}
</script>

<style scoped>
.chapter-card {
    position: relative;
    min-width: 260px;
    max-width: 260px;
    height: 380px;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #1a1a2e;
    flex-shrink: 0;
}

.chapter-card:hover:not(.is-locked) {
    transform: translateY(-10px) scale(1.02);
    border-color: var(--accent);
    box-shadow: 0 15px 35px rgba(108, 92, 231, 0.3);
}

.card-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(4px) brightness(0.8);
    transition: transform 0.6s ease, filter 0.6s ease;
}

.chapter-card:hover .card-img {
    transform: scale(1.1);
    filter: blur(0) brightness(1);
}

.card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, transparent 40%, rgba(10, 10, 26, 0.95) 100%);
}

.card-content {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1.5rem;
    pointer-events: none;
}

.card-status {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    color: #ff4444;
    align-self: flex-start;
    margin-bottom: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid rgba(255, 68, 68, 0.3);
}

.card-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: #fff;
    line-height: 1.2;
}

.card-subtitle {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}

.card-action {
    margin-top: 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--accent-light);
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s ease;
}

.chapter-card:hover .card-action {
    opacity: 1;
    transform: translateX(0);
}

/* Locked state styles */
.is-locked {
    filter: grayscale(1) brightness(0.7);
    cursor: not-allowed;
}

.is-locked:hover {
    border-color: rgba(255, 255, 255, 0.2);
}

.lock-icon {
    font-size: 0.8rem;
}
</style>
