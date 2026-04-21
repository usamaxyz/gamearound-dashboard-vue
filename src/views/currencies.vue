<template>
  <div class="currencies-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1>Currency Management</h1>
        <p>Configure and manage game currencies and assets.</p>
      </div>
      <button @click="openAddModal" class="btn-primary" :disabled="!selectedGameId">
        <Plus :size="20" />
        <span>Add Currency</span>
      </button>
    </div>

    <!-- Game Selector -->
    <GameSelector />

    <!-- Main Content -->
    <template v-if="selectedGameId">
      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <Search class="search-icon" :size="20" />
          <input v-model="searchQuery" type="text" placeholder="Search..." @input="handleSearch" />
        </div>
        <button @click="fetchCurrencies" class="btn-ghost" :disabled="loading" title="Refresh">
          <RefreshCw :class="{ 'spinning': loading }" :size="20" />
        </button>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table v-if="currencies.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>ID</th>
              <th>Deposit</th>
              <th>Assets</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredCurrencies" :key="item.id">
              <td>
                <div class="user-row-info">
                  <div class="avatar-square" v-if="item.imageUrl">
                    <img :src="item.imageUrl" :alt="item.name" />
                  </div>
                  <div class="avatar accent" v-else>
                    {{ item.name?.charAt(0).toUpperCase() || 'C' }}
                  </div>
                  <div class="details">
                    <span class="name">{{ item.name }}</span>
                  </div>
                </div>
              </td>
              <td><code class="badge">{{ item.id }}</code></td>
              <td>
                <span class="text-mono text-primary" style="font-weight: 600">{{ item.launchDeposit || 0 }}</span>
              </td>
              <td>
                <div class="flex-gap-2">
                  <a v-if="item.imageUrl" :href="item.imageUrl" target="_blank" class="hover-primary" title="View Image"
                    style="color: var(--text-muted)">
                    <Image :size="16" />
                  </a>
                  <a v-if="item.assetUrl" :href="item.assetUrl" target="_blank" class="hover-primary" title="View Model"
                    style="color: var(--text-muted)">
                    <FileCode :size="16" />
                  </a>
                </div>
              </td>
              <td>
                <div class="row-actions">
                  <button @click="editCurrency(item)" class="btn-ghost edit" title="Edit">
                    <Edit2 :size="16" />
                  </button>
                  <button @click="confirmDelete(item)" class="btn-ghost delete" title="Delete">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else-if="loading" class="empty-state">
          <RefreshCw class="spinning" :size="32" />
          <p>Loading currencies...</p>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <Coins :size="48" />
          </div>
          <h3>No currencies found</h3>
          <p>Start by adding a new currency for this game.</p>
        </div>
      </div>
    </template>

    <div v-else class="empty-state select-game-prompt">
      <Gamepad2 :size="48" />
      <h3>Please select a game</h3>
      <p>Select a game from the list above to manage its currencies.</p>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card large">
          <div class="modal-header">
            <div class="header-content">
              <h2>{{ editingItem ? 'Edit Currency' : 'Add New Currency' }}</h2>
              <p>Game: <strong>{{ selectedGame?.name }}</strong></p>
            </div>
            <button @click="closeModal" class="btn-ghost">
              <X :size="20" />
            </button>
          </div>

          <form @submit.prevent="saveCurrency">
            <div class="form-grid gap-lg">
              <!-- Row 1: Name & ID -->
              <div class="form-group">
                <label>Currency Name</label>
                <div class="input-wrapper has-icon">
                  <Coins :size="18" class="input-icon" />
                  <input v-model="form.name" type="text" placeholder="e.g. Gold" required />
                </div>
              </div>

              <div class="form-group">
                <label>ID</label>
                <div class="input-wrapper has-icon">
                  <FileCode :size="18" class="input-icon" />
                  <input v-model="form.id" type="text" :disabled="!!editingItem" placeholder="e.g. gold" required />
                </div>
              </div>

              <!-- Row 2: Launch Deposit (Single Column Width) -->
              <div class="form-group span-1">
                <label>Launch Deposit *</label>
                <div class="input-wrapper">
                  <input v-model.number="form.launchDeposit" type="number" placeholder="0" required min="0" />
                </div>
              </div>
              <div class="spacer"></div>

              <!-- Row 3: File Uploads -->
              <div class="form-group">
                <label>Image Asset (PNG/JPG)</label>

                <div class="radio-group">
                  <label class="radio-item">
                    <input type="radio" v-model="imageMode" value="upload" />
                    <span>Upload</span>
                  </label>
                  <label class="radio-item">
                    <input type="radio" v-model="imageMode" value="link" />
                    <span>Link</span>
                  </label>
                </div>

                <div class="upload-container">
                  <div v-if="form.imageUrl && imageMode === 'upload'" class="upload-preview">
                    <img :src="form.imageUrl" alt="Preview" />
                    <button type="button" @click="form.imageUrl = ''" class="remove-btn">
                      <X :size="14" />
                    </button>
                  </div>
                  <div class="upload-controls">
                    <label v-if="imageMode === 'upload'" class="btn-secondary btn-sm upload-trigger"
                      :class="{ 'disabled': !form.id || uploadingImage }">
                      <Upload :size="16" />
                      <span>{{ uploadingImage ? 'Uploading...' : 'Choose Image' }}</span>
                      <input type="file" @change="e => handleUpload(e, 'imageUrl', 'UI/Currency')" accept="image/*"
                        hidden />
                    </label>
                    <div v-else class="input-wrapper url-input-field">
                      <input v-model="form.imageUrl" type="text" placeholder="Enter Image URL" />
                    </div>
                  </div>
                  <p v-if="imageMode === 'upload' && !form.id" class="input-hint">
                    Please enter a Currency ID first to enable upload.
                  </p>
                </div>
              </div>

              <div class="form-group">
                <label>3D Asset (.asset)</label>

                <div class="radio-group">
                  <label class="radio-item">
                    <input type="radio" v-model="assetMode" value="upload" />
                    <span>Upload</span>
                  </label>
                  <label class="radio-item">
                    <input type="radio" v-model="assetMode" value="link" />
                    <span>Link</span>
                  </label>
                </div>

                <div class="upload-container">
                  <div v-if="form.assetUrl && assetMode === 'upload'" class="upload-file-info">
                    <FileCode :size="18" />
                    <span class="filename">{{ getFileName(form.assetUrl) }}</span>
                    <button type="button" @click="form.assetUrl = ''" class="remove-btn">
                      <X :size="14" />
                    </button>
                  </div>
                  <div class="upload-controls">
                    <label v-if="assetMode === 'upload'" class="btn-secondary btn-sm upload-trigger"
                      :class="{ 'disabled': !form.id || uploadingAsset }">
                      <Upload :size="16" />
                      <span>{{ uploadingAsset ? 'Uploading...' : 'Choose Asset' }}</span>
                      <input type="file" @change="e => handleUpload(e, 'assetUrl', 'UI/Currency')" accept=".asset"
                        hidden />
                    </label>
                    <div v-else class="input-wrapper url-input-field">
                      <input v-model="form.assetUrl" type="text" placeholder="Enter Asset URL" />
                    </div>
                  </div>
                  <p v-if="assetMode === 'upload' && !form.id" class="input-hint">
                    Please enter a Currency ID first to enable upload.
                  </p>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="formLoading || uploadingImage || uploadingAsset">
                <span v-if="!formLoading">{{ editingItem ? 'Save Changes' : 'Create Currency' }}</span>
                <RefreshCw v-else class="spinning" :size="18" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div v-if="itemToDelete" class="modal-overlay danger" @click.self="itemToDelete = null">
        <div class="modal-card danger">
          <div class="modal-header">
            <div class="header-content">
              <h2>Delete Currency</h2>
              <p>Are you sure you want to delete <strong>{{ itemToDelete.name }}</strong>? This will remove it from
                <strong>{{ selectedGame?.name }}</strong>.
              </p>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="itemToDelete = null" class="btn-secondary">Cancel</button>
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
import axios from 'axios';
import { useGamesStore } from '@/stores/games';
import { storeToRefs } from 'pinia';
import GameSelector from '@/components/GameSelector.vue';
import {
  Coins, Search, RefreshCw, Edit2, Trash2, X, Plus, Activity, Layout, Code, Upload, Image, FileCode, Gamepad2
} from 'lucide-vue-next';

export default {
  name: 'CurrenciesView',
  components: {
    GameSelector,
    Coins, Search, RefreshCw, Edit2, Trash2, X, Plus, Activity, Layout, Code, Upload, Image, FileCode, Gamepad2
  },
  setup() {
    const gamesStore = useGamesStore();
    const { selectedGameId, selectedGame } = storeToRefs(gamesStore);
    return { selectedGameId, selectedGame };
  },
  data() {
    return {
      currencies: [],
      loading: false,
      searchQuery: '',
      showModal: false,
      editingItem: null,
      itemToDelete: null,
      formLoading: false,
      uploadingImage: false,
      uploadingAsset: false,
      form: {
        id: '',
        name: '',
        launchDeposit: 0,
        imageUrl: '',
        assetUrl: ''
      },
      imageMode: 'upload', // 'upload' or 'link'
      assetMode: 'upload', // 'upload' or 'link'
      searchTimeout: null
    };
  },
  computed: {
    filteredCurrencies() {
      if (!this.searchQuery) return this.currencies;
      const q = this.searchQuery.toLowerCase();
      return this.currencies.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      );
    }
  },
  watch: {
    selectedGameId() {
      if (this.selectedGameId) {
        this.fetchCurrencies();
      } else {
        this.currencies = [];
      }
    }
  },
  methods: {
    async fetchCurrencies() {
      if (!this.selectedGameId) return;
      this.loading = true;
      try {
        const res = await api.get(`/currencies/${this.selectedGameId}`);
        this.currencies = res.data.currencies || [];
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      // Offline filtering for now, but keeping the pattern
    },
    openAddModal() {
      this.editingItem = null;
      this.form = {
        id: '',
        name: '',
        launchDeposit: 0,
        imageUrl: '',
        assetUrl: ''
      };
      this.imageMode = 'upload';
      this.assetMode = 'upload';
      this.showModal = true;
    },
    editCurrency(item) {
      this.editingItem = item;
      this.form = { ...item };
      // Force link mode in edit currency as requested
      this.imageMode = 'link';
      this.assetMode = 'link';
      this.showModal = true;
    },
    confirmDelete(item) {
      this.itemToDelete = item;
    },
    async handleDelete() {
      if (!this.itemToDelete) return;
      this.formLoading = true;
      try {
        await api.delete(`/currencies/${this.selectedGameId}/${this.itemToDelete.id}`);
        await this.fetchCurrencies();
        this.itemToDelete = null;
      } catch (err) {
        console.error('Failed to delete currency:', err);
        alert(err.response?.data?.message || 'Error deleting currency');
      } finally {
        this.formLoading = false;
      }
    },
    closeModal() {
      this.showModal = false;
      this.editingItem = null;
    },
    async handleUpload(event, field, category) {
      if (!this.form.id) {
        alert('Please enter a Currency ID first to ensure correct file naming.');
        event.target.value = ''; // Reset input
        return;
      }

      const file = event.target.files[0];
      if (!file) return;

      if (field === 'imageUrl') this.uploadingImage = true;
      else this.uploadingAsset = true;

      try {
        // 1. Get pre-signed URL
        const res = await api.post('/assets/upload', {
          gameId: this.selectedGameId,
          category: category,
          recordId: this.form.id,
          fileName: file.name,
          contentType: file.type
        });

        const { uploadUrl, finalUrl } = res.data;

        // 2. Upload to S3
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type }
        });

        // 3. Update form
        this.form[field] = finalUrl;
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to upload file. Check permissions.');
      } finally {
        if (field === 'imageUrl') this.uploadingImage = false;
        else this.uploadingAsset = false;
      }
    },
    getFileName(url) {
      if (!url) return '';
      const parts = url.split('/');
      return parts[parts.length - 1];
    },
    async saveCurrency() {
      if (!this.selectedGameId) return;
      this.formLoading = true;
      try {
        const payload = {
          ...this.form,
          gameid: this.selectedGameId
        };

        if (this.editingItem) {
          await api.patch(`/currencies/${this.selectedGameId}/${this.editingItem.id}`, payload);
        } else {
          await api.post(`/currencies/${this.selectedGameId}`, payload);
        }
        await this.fetchCurrencies();
        this.closeModal();
      } catch (err) {
        console.error('Failed to save currency:', err);
        alert(err.response?.data?.message || 'Error saving currency');
      } finally {
        this.formLoading = false;
      }
    }
  },
  mounted() {
    if (this.selectedGameId) {
      this.fetchCurrencies();
    }
  }
};
</script>
