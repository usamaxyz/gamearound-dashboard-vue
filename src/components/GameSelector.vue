<template>
  <div class="d-flex align-items-center gap-3 py-3 px-4 bg-card border rounded-md mb-6">
    <div class="d-flex align-items-center gap-2 text-muted-util fw-medium fs-sm">
      <Gamepad2 :size="18" />
      <span>Active Game:</span>
    </div>
    <div class="custom-select-wrapper" v-if="games.length > 0">
      <select :value="selectedGameId" @change="e => setSelectedGame(e.target.value)">
        <option v-for="game in games" :key="game.gameId" :value="game.gameId">
          {{ game.name }}
        </option>
      </select>
      <ChevronDown class="select-icon" :size="16" />
    </div>
    <div v-else-if="loading" class="d-flex align-items-center gap-2 text-muted-util fs-sm">
      <RefreshCw class="spinning" :size="18" />
      <span>Loading games...</span>
    </div>
    <div v-else class="d-flex align-items-center gap-2 text-muted-util fs-sm">
      <p style="margin: 0;">No games found. Please create a game first.</p>
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

