<script setup>
defineEmits(['toggle-sidebar'])
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="btn-premium" style="padding: 0.5rem" @click="$emit('toggle-sidebar')">
        ☰
      </button>
      <h2 style="margin: 0; margin-left: 1.5rem; font-size: 1.1rem; font-weight: 600; color: var(--text-main)">
        Dashboard Overview
      </h2>
    </div>

    <div class="topbar-right" style="display: flex; gap: 1rem; align-items: center">
      <button class="btn-premium">
        <span>🔔</span>
      </button>
      <button class="btn-premium btn-primary">
        <span>+ New Game</span>
      </button>
    </div>
  </header>
</template>
