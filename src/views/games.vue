<template>
  <div class="games-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1>Games Management</h1>
        <p>Manage and configure games in your organization.</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        <Gamepad2 :size="20" />
        <span>Add New Game</span>
      </button>
    </div>

    <!-- Stats Section -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon-box accent">
          <Gamepad2 :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Total Games</span>
          <span class="value">{{ games.length }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-wrapper">
        <Search class="search-icon" :size="20" />
        <input v-model="searchQuery" type="text" placeholder="Search games..." @input="handleSearch" />
      </div>
      <button @click="fetchGames" class="btn-ghost" :disabled="loading" title="Refresh">
        <RefreshCw :class="{ 'spinning': loading }" :size="20" />
      </button>
    </div>

    <!-- Games Table -->
    <div class="table-wrapper">
      <table v-if="games.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>Game ID</th>
            <th>Created</th>
            <th style="text-align: right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="game in games" :key="game.gameId">
            <td>
              <div class="user-row-info">
                <div class="avatar accent">
                  {{ game.name?.charAt(0).toUpperCase() || 'G' }}
                </div>
                <div class="details">
                  <span class="name">{{ game.name }}</span>
                </div>
              </div>
            </td>
            <td>
              <code class="game-id-badge">{{ game.gameId }}</code>
            </td>
            <td>
              <span class="date-text">{{ formatDate(game.createdAt) }}</span>
            </td>
            <td>
              <div class="row-actions">
                <button @click="editGame(game)" class="btn-ghost edit" title="Edit Game">
                  <Edit2 :size="16" />
                </button>
                <button @click="confirmDelete(game)" class="btn-ghost delete" title="Delete Game">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="loading" class="empty-state">
        <RefreshCw class="spinning" :size="32" />
        <p style="margin-top: 1rem">Loading organization games...</p>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <Gamepad2 :size="48" />
        </div>
        <h3>No games found</h3>
        <p>Try adjusting your search or add a new game.</p>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <div v-if="showAddModal || editingGame" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <div class="header-content">
              <h2>{{ editingGame ? 'Edit Game' : 'Add New Game' }}</h2>
              <p v-if="!editingGame">Enter the details for the new game.</p>
            </div>
            <button @click="closeModal" class="btn-ghost">
              <X :size="20" />
            </button>
          </div>

          <form @submit.prevent="saveGame">
            <div class="form-group">
              <label>Game Name</label>
              <div class="input-wrapper has-icon">
                <Layout :size="18" class="input-icon" />
                <input v-model="form.name" type="text" placeholder="e.g. Space Odyssey" required />
              </div>
            </div>

            <div class="form-group">
              <label>Game ID (Permanent)</label>
              <div class="input-wrapper has-icon">
                <Code :size="18" class="input-icon" />
                <input v-model="form.gameId" type="text" :disabled="!!editingGame" placeholder="e.g. space-odyssey-01"
                  required />
              </div>
              <p v-if="editingGame" class="input-hint">Game ID cannot be changed.</p>
              <p v-else class="input-hint">Used for API integration. Must be unique.</p>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Discard</button>
              <button type="submit" class="btn-primary" :disabled="formLoading">
                <span v-if="!formLoading">{{ editingGame ? 'Update Game' : 'Create Game' }}</span>
                <RefreshCw v-else class="spinning" :size="18" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div v-if="gameToDelete" class="modal-overlay danger" @click.self="gameToDelete = null">
        <div class="modal-card danger">
          <div class="modal-header">
            <div class="header-content">
              <h2>Delete Game</h2>
              <p>Are you sure you want to delete <strong>{{ gameToDelete.name }}</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="gameToDelete = null" class="btn-secondary">Cancel</button>
            <button @click="handleDelete" class="btn-danger" :disabled="formLoading">
              <span v-if="!formLoading">Delete Permanently</span>
              <RefreshCw v-else class="spinning" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import api from '@/services/api';
import {
  Gamepad2, Search, RefreshCw, Edit2, Trash2, X, Activity, Layout, Code
} from 'lucide-vue-next';

export default {
  name: 'GamesView',
  components: {
    Gamepad2, Search, RefreshCw, Edit2, Trash2, X, Activity, Layout, Code
  },
  data() {
    return {
      games: [],
      loading: false,
      searchQuery: '',
      showAddModal: false,
      editingGame: null,
      gameToDelete: null,
      formLoading: false,
      form: {
        name: '',
        gameId: ''
      },
      searchTimeout: null
    };
  },
  computed: {},
  methods: {
    async fetchGames() {
      this.loading = true;
      try {
        const res = await api.get('/games', {
          params: { search: this.searchQuery }
        });
        this.games = res.data.games || [];
      } catch (err) {
        console.error('Failed to fetch games:', err);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(this.fetchGames, 300);
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    },
    editGame(game) {
      this.editingGame = game;
      this.form = {
        name: game.name,
        gameId: game.gameId
      };
    },
    confirmDelete(game) {
      this.gameToDelete = game;
    },
    async handleDelete() {
      if (!this.gameToDelete) return;
      this.formLoading = true;
      try {
        await api.delete(`/games/${this.gameToDelete.gameId}`);
        await this.fetchGames();
        this.gameToDelete = null;
      } catch (err) {
        console.error('Failed to delete game:', err);
        alert(err.response?.data?.message || 'Error deleting game');
      } finally {
        this.formLoading = false;
      }
    },
    closeModal() {
      this.showAddModal = false;
      this.editingGame = null;
      this.form = { name: '', gameId: '' };
    },
    async saveGame() {
      this.formLoading = true;
      try {
        if (this.editingGame) {
          await api.patch(`/games/${this.editingGame.gameId}`, {
            name: this.form.name
          });
        } else {
          await api.post('/games', this.form);
        }
        await this.fetchGames();
        this.closeModal();
      } catch (err) {
        console.error('Failed to save game:', err);
        alert(err.response?.data?.message || 'Error saving game');
      } finally {
        this.formLoading = false;
      }
    }
  },
  mounted() {
    this.fetchGames();
  }
};
</script>