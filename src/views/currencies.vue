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
<!--                  <div class="avatar accent">-->
<!--                    {{ item.name?.charAt(0).toUpperCase() || 'C' }}-->
<!--                  </div>-->
                  <div class="details">
                    <span class="name">{{ item.name }}</span>
                  </div>
                </div>
              </td>
              <td><code class="badge">{{ item.id }}</code></td>
              <td>
                <span class="text-mono">{{ item.launchDeposit || 0 }}</span>
              </td>
              <td>
                <div class="flex-gap-2">
                  <button v-if="item.imageUrl" @click="previewAsset(item, 'image')" class="btn-ghost" title="View Image"
                    style="color: var(--text-muted)">
                    <Image :size="16" />
                  </button>
                  <button v-if="item.assetUrl" @click="previewAsset(item, 'asset')" class="btn-ghost" title="View Model"
                    style="color: var(--text-muted)">
                    <FileCode :size="16" />
                  </button>
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
                <label>Image Asset</label>

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
                  <!-- Preview for already uploaded or selected file -->
                  <div v-if="(form.imageUrl || form.imageFile) && imageMode === 'upload'" class="upload-preview">
                    <img :src="form.imageFile ? getFilePreview(form.imageFile) : getCloudFrontUrl(form.imageUrl)" alt="Preview" />
                    <button type="button" @click="clearFile('image')" class="remove-btn">
                      <X :size="14" />
                    </button>
                  </div>
                  <div class="upload-controls">
                    <template v-if="imageMode === 'upload'">
                      <button type="button" class="btn btn-secondary btn-sm"
                        :disabled="!form.id" title="Select Image" @click="$refs.imageInput.click()">
                        <Upload :size="16" />
                        <span>{{ form.imageFile ? 'Change Image' : 'Choose Image' }}</span>
                      </button>
                      <input type="file" ref="imageInput" @change="e => prepareFile(e, 'image')" hidden />
                    </template>
                    
                    <div v-else class="input-wrapper url-input-field">
                      <input v-model="form.imageUrl" type="text" placeholder="Enter Image URL" />
                    </div>
                  </div>
                  <p v-if="imageMode === 'upload' && !form.id" class="input-hint">
                    Please enter a Currency ID first.
                  </p>
                  <p v-if="form.imageFile" class="text-primary fs-sm mt-1">
                    Ready to upload: {{ form.imageFile.name }}
                  </p>
                </div>
              </div>

              <div class="form-group">
                <label>3D Asset</label>

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
                  <div v-if="(form.assetUrl || form.assetFile) && assetMode === 'upload'" class="upload-file-info">
                    <FileCode :size="18" />
                    <span class="filename">{{ form.assetFile ? form.assetFile.name : getFileName(form.assetUrl) }}</span>
                    <button type="button" @click="clearFile('asset')" class="remove-btn">
                      <X :size="14" />
                    </button>
                  </div>
                  <div class="upload-controls">
                    <template v-if="assetMode === 'upload'">
                      <button type="button" class="btn btn-secondary btn-sm"
                        :disabled="!form.id" title="Select Asset" @click="$refs.assetInput.click()">
                        <Upload :size="16" />
                        <span>{{ form.assetFile ? 'Change Asset' : 'Choose Asset' }}</span>
                      </button>
                      <input type="file" ref="assetInput" @change="e => prepareFile(e, 'asset')" hidden />
                    </template>
                    
                    <div v-else class="input-wrapper url-input-field">
                      <input v-model="form.assetUrl" type="text" placeholder="Enter Asset URL" />
                    </div>
                  </div>
                  <p v-if="assetMode === 'upload' && !form.id" class="input-hint">
                    Please enter a Currency ID first.
                  </p>
                </div>
              </div>
            </div>

            <!-- Progress Steps (Visible when saving) -->
            <div v-if="showProgress" class="steps-list fadeIn">
              <div class="step-item" :class="{ 'active': stepStatus.store === 'loading', 'completed': stepStatus.store === 'success' }">
                <div class="step-icon" :class="stepStatus.store">
                  <RefreshCw v-if="stepStatus.store === 'loading'" class="spinning" :size="18" />
                  <CheckCircle2 v-else-if="stepStatus.store === 'success'" :size="18" />
                  <Circle v-else :size="18" />
                </div>
                <span class="step-text">Storing currency data...</span>
              </div>
              
              <div v-if="imageMode === 'upload' && form.imageFile" class="step-item" :class="{ 'active': stepStatus.image === 'loading', 'completed': stepStatus.image === 'success' }">
                <div class="step-icon" :class="stepStatus.image">
                  <RefreshCw v-if="stepStatus.image === 'loading'" class="spinning" :size="18" />
                  <CheckCircle2 v-else-if="stepStatus.image === 'success'" :size="18" />
                  <Circle v-else :size="18" />
                </div>
                <span class="step-text">Uploading image asset...</span>
              </div>

              <div v-if="assetMode === 'upload' && form.assetFile" class="step-item" :class="{ 'active': stepStatus.asset === 'loading', 'completed': stepStatus.asset === 'success' }">
                <div class="step-icon" :class="stepStatus.asset">
                  <RefreshCw v-if="stepStatus.asset === 'loading'" class="spinning" :size="18" />
                  <CheckCircle2 v-else-if="stepStatus.asset === 'success'" :size="18" />
                  <Circle v-else :size="18" />
                </div>
                <span class="step-text">Uploading 3D model asset...</span>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-secondary" :disabled="formLoading">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="formLoading">
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

    <!-- Image Preview Modal -->
    <ImageModal 
      :is-open="!!assetToPreview" 
      :asset-url="getCloudFrontUrl(previewUrl)" 
      :title="assetToPreview?.name"
      :is-image="isImageFile(previewUrl)"
      @close="assetToPreview = null"
    />
  </div>
</template>

<script>
import api, { getCloudFrontUrl, isImageFile } from '@/services/api';
import axios from 'axios';
import { useGamesStore } from '@/stores/games';
import { storeToRefs } from 'pinia';
import GameSelector from '@/components/GameSelector.vue';
import ImageModal from '@/components/ImageModal.vue';
import {
  Coins, Search, RefreshCw, Edit2, Trash2, X, Plus, Activity, Layout, Code, Upload, Image, FileCode, Gamepad2, CheckCircle2, Circle, ExternalLink
} from 'lucide-vue-next';

export default {
  name: 'CurrenciesView',
  components: {
    GameSelector,
    ImageModal,
    Coins, Search, RefreshCw, Edit2, Trash2, X, Plus, Activity, Layout, Code, Upload, Image, FileCode, Gamepad2, CheckCircle2, Circle, ExternalLink
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
      assetToPreview: null,
      previewType: 'image', // 'image' or 'asset'
      formLoading: false,
      uploadingImage: false,
      uploadingAsset: false,
      form: {
        id: '',
        name: '',
        launchDeposit: 0,
        imageUrl: '',
        assetUrl: '',
        imageFile: null,
        assetFile: null
      },
      imageMode: 'upload', // 'upload' or 'link'
      assetMode: 'upload', // 'upload' or 'link'
      searchTimeout: null,
      showProgress: false,
      stepStatus: {
        store: 'pending',
        image: 'pending',
        asset: 'pending'
      }
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
    },
    previewUrl() {
      if (!this.assetToPreview) return '';
      return this.previewType === 'image' ? this.assetToPreview.imageUrl : this.assetToPreview.assetUrl;
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
    getCloudFrontUrl,
    isImageFile,
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
        assetUrl: '',
        imageFile: null,
        assetFile: null
      };
      this.imageMode = 'upload';
      this.assetMode = 'upload';
      this.showProgress = false;
      this.stepStatus = { store: 'pending', image: 'pending', asset: 'pending' };
      this.showModal = true;
    },
    editCurrency(item) {
      this.editingItem = item;
      this.form = { ...item, imageFile: null, assetFile: null };
      // Force link mode in edit currency as requested
      this.imageMode = 'link';
      this.assetMode = 'link';
      this.showProgress = false;
      this.stepStatus = { store: 'pending', image: 'pending', asset: 'pending' };
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
    previewAsset(item, type) {
      this.previewType = type;
      this.assetToPreview = item;
    },
    closeModal() {
      this.showModal = false;
      this.editingItem = null;
    },
    prepareFile(event, type) {
      const file = event.target.files[0];
      if (!file) return;
      this.form[type + 'File'] = file;
    },
    clearFile(type) {
      this.form[type + 'File'] = null;
      if (type === 'image') this.form.imageUrl = '';
      else this.form.assetUrl = '';
    },
    getFilePreview(file) {
      return URL.createObjectURL(file);
    },
    async performUpload(file, field, category) {
      if (!file) return;
      
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

        // 3. Update form/field
        this.form[field] = finalUrl;
        return true;
      } catch (err) {
        console.error(`Upload failed for ${field}:`, err);
        throw err;
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
      this.showProgress = true;
      
      // Step 1: Store Currency
      this.stepStatus.store = 'loading';
      try {
        const payload = {
          ...this.form,
          gameid: this.selectedGameId
        };
        // Remove file objects from payload
        delete payload.imageFile;
        delete payload.assetFile;

        if (this.editingItem) {
          await api.patch(`/currencies/${this.selectedGameId}/${this.editingItem.id}`, payload);
        } else {
          await api.post(`/currencies/${this.selectedGameId}`, payload);
        }
        this.stepStatus.store = 'success';
      } catch (err) {
        this.stepStatus.store = 'error';
        console.error('Failed to store currency:', err);
        alert(err.response?.data?.message || 'Error storing currency');
        this.formLoading = false;
        return;
      }

      // Step 2: Upload Image
      if (this.imageMode === 'upload' && this.form.imageFile) {
        this.stepStatus.image = 'loading';
        try {
          await this.performUpload(this.form.imageFile, 'imageUrl', 'UI/Currencies');
          // Update the record with the final URL
          await api.patch(`/currencies/${this.selectedGameId}/${this.form.id}`, { imageUrl: this.form.imageUrl });
          this.stepStatus.image = 'success';
        } catch (err) {
          this.stepStatus.image = 'error';
          alert('Image upload failed, but currency was stored.');
        }
      } else {
        this.stepStatus.image = 'success'; // Skipped
      }

      // Step 3: Upload Asset
      if (this.assetMode === 'upload' && this.form.assetFile) {
        this.stepStatus.asset = 'loading';
        try {
          await this.performUpload(this.form.assetFile, 'assetUrl', 'UI/Currencies');
          // Update the record with the final URL
          await api.patch(`/currencies/${this.selectedGameId}/${this.form.id}`, { assetUrl: this.form.assetUrl });
          this.stepStatus.asset = 'success';
        } catch (err) {
          this.stepStatus.asset = 'error';
          alert('Asset upload failed, but currency was stored.');
        }
      } else {
        this.stepStatus.asset = 'success'; // Skipped
      }

      await this.fetchCurrencies();
      setTimeout(() => {
        this.closeModal();
      }, 1000);
      this.formLoading = false;
    }
  },
  mounted() {
    if (this.selectedGameId) {
      this.fetchCurrencies();
    }
  }
};
</script>
