import { defineStore } from 'pinia';
import api from '@/services/api';

export const useGamesStore = defineStore('games', {
    state: () => ({
        games: [],
        selectedGameId: localStorage.getItem('selectedGameId') || null,
        loading: false,
    }),

    getters: {
        selectedGame: (state) => state.games.find(g => g.gameId === state.selectedGameId) || null,
    },

    actions: {
        async fetchGames() {
            this.loading = true;
            try {
                const res = await api.get('/games');
                this.games = res.data.games || [];
                
                // If there's a selected ID but it's not in the list, clear it
                if (this.selectedGameId && !this.games.find(g => g.gameId === this.selectedGameId)) {
                    this.setSelectedGame(this.games.length > 0 ? this.games[0].gameId : null);
                } else if (!this.selectedGameId && this.games.length > 0) {
                    // Default to first game
                    this.setSelectedGame(this.games[0].gameId);
                }
            } catch (err) {
                console.error('Failed to fetch games:', err);
            } finally {
                this.loading = false;
            }
        },

        setSelectedGame(gameId) {
            this.selectedGameId = gameId;
            if (gameId) {
                localStorage.setItem('selectedGameId', gameId);
            } else {
                localStorage.removeItem('selectedGameId');
            }
        }
    },
});
