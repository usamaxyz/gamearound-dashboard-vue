<template>
  <div class="game-selector-container">
    <div class="selector-label">
      <Gamepad2 :size="18" />
      <span>Active Game:</span>
    </div>
    <div class="custom-select" v-if="games.length > 0">
      <select :value="selectedGameId" @change="e => setSelectedGame(e.target.value)">
        <option v-for="game in games" :key="game.gameId" :value="game.gameId">
          {{ game.name }} ({{ game.gameId }})
        </option>
      </select>
      <ChevronDown class="select-icon" :size="16" />
    </div>
    <div v-else-if="loading" class="selector-loading">
      <RefreshCw class="spinning" :size="18" />
      <span>Loading games...</span>
    </div>
    <div v-else class="selector-empty">
      <p>No games found. Please create a game first.</p>
    </div>
  </div>
</template>

<script>
import { Gamepad2, ChevronDown, RefreshCw } from 'lucide-vue-next';
import { useGamesStore } from '@/stores/games';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

export default {
  name: 'GameSelector',
  components: {
    Gamepad2, ChevronDown, RefreshCw
  },
  setup() {
    const gamesStore = useGamesStore();
    const { games, selectedGameId, loading } = storeToRefs(gamesStore);

    onMounted(() => {
      if (games.value.length === 0) {
        gamesStore.fetchGames();
      }
    });

    return {
      games,
      selectedGameId,
      loading,
      setSelectedGame: gamesStore.setSelectedGame
    };
  }
};
</script>

<style lang="scss" scoped>
.game-selector-container {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);

  .selector-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .custom-select {
    position: relative;
    min-width: 200px;

    select {
      width: 100%;
      padding: 0.5rem 2.5rem 0.5rem 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-bright);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-weight: 600;
      appearance: none;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px var(--primary-glow);
      }
    }

    .select-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-muted);
    }
  }

  .selector-loading, .selector-empty {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
    font-size: 0.9rem;
  }
}
</style>
