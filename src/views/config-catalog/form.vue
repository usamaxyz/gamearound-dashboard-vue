<template>
  <div class="catalog-form-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <button @click="$router.push({ name: 'config-catalog' })" class="btn-ghost mb-5">
          <ChevronLeft :size="20" />
          <span>Back to Catalog</span>
        </button>
        <h1>{{ isEdit ? 'Edit Item' : 'Add New Item' }}</h1>
        <p>Game: <strong>{{ selectedGame?.name }}</strong></p>
      </div>
    </div>

    <div v-if="!selectedGameId" class="empty-state">
      <Gamepad2 :size="48" />
      <h3>No game selected</h3>
      <p>Please select a game from the list to continue.</p>
    </div>

    <div v-else class="w-form py-form">
      <div class="card bg-surface border rounded-lg p-form">
        <div class="form-grid gap-lg">
          <!-- Row 1: Item ID & Category -->
          <div class="form-group">
            <label>Item ID *</label>
            <div class="input-wrapper">
              <input v-model="form.itemid" type="text" :disabled="isEdit" required />
            </div>
            <p class="input-hint">Unique identifier for the item.</p>
          </div>

          <div class="form-group">
            <label>Category *</label>
            <div class="input-wrapper">
              <input v-model="form.category" type="text" :disabled="isEdit" required />
            </div>
            <p class="input-hint">Partition key for the catalog.</p>
          </div>

          <!-- Row 2: Name & Description -->
          <div class="form-group span-2">
            <label>Name *</label>
            <div class="input-wrapper">
              <input v-model="form.name" type="text" required />
            </div>
          </div>

          <div class="form-group span-2">
            <label>Description</label>
            <div class="input-wrapper">
              <textarea v-model="form.description" rows="3"></textarea>
            </div>
          </div>

          <!-- Row 3: Pricing & Currency -->
          <div class="form-group">
            <label>Price</label>
            <div class="input-wrapper">
              <input v-model.number="form.price" type="number" placeholder="0" />
            </div>
          </div>

          <div class="form-group">
            <label>Currency</label>
            <div class="custom-select-wrapper">
              <select v-model="form.currency">
                <option value="">Select Currency</option>
                <option v-for="curr in currencies" :key="curr.id" :value="curr.id">
                  {{ curr.name }}
                </option>
              </select>
              <ChevronDown class="select-icon" :size="16" />
            </div>
          </div>

          <!-- Row 4: Limits -->
          <div class="form-group">
            <label>Limited Amount</label>
            <div class="input-wrapper">
              <input v-model.number="form.limitedAmount" type="number" placeholder="-1" />
            </div>
            <p class="input-hint">-1 for unlimited.</p>
          </div>

          <div class="form-group">
            <label>Max Uses</label>
            <div class="input-wrapper">
              <input v-model.number="form.maxUses" type="number" placeholder="0" />
            </div>
          </div>

          <div class="form-group">
            <label>Max Time (seconds)</label>
            <div class="input-wrapper">
              <input v-model.number="form.maxTime" type="number" placeholder="0" />
            </div>
          </div>

          <!-- Row 5: Toggles -->
          <div class="span-2">
            <div class="pill-selection-grid">
              <div class="selection-pill" :class="{ 'active': form.stackable === 'true' }" @click="form.stackable = form.stackable === 'true' ? 'false' : 'true'">
                <span>Stackable</span>
              </div>
              <div class="selection-pill" :class="{ 'active': form.tradable === 'true' }" @click="form.tradable = form.tradable === 'true' ? 'false' : 'true'">
                <span>Tradable</span>
              </div>
              <div class="selection-pill" :class="{ 'active': form.inAppPurchase === 'true' }" @click="form.inAppPurchase = form.inAppPurchase === 'true' ? 'false' : 'true'">
                <span>In-App Purchase</span>
              </div>
            </div>
          </div>

          <hr class="span-2" />

          <!-- Row 6: Assets -->
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
              <div v-if="(form.imageUrl || form.imageFile) && imageMode === 'upload'" class="upload-preview">
                <img :src="form.imageFile ? getFilePreview(form.imageFile) : getCloudFrontUrl(form.imageUrl)"
                  alt="Preview" />
                <button type="button" @click="clearFile('image')" class="remove-btn">
                  <X :size="14" />
                </button>
              </div>
              <div class="upload-controls">
                <template v-if="imageMode === 'upload'">
                  <button type="button" class="btn btn-secondary btn-sm" :disabled="!form.itemid"
                    @click="$refs.imageInput.click()">
                    <Upload :size="16" />
                    <span>{{ form.imageFile ? 'Change Image' : 'Choose Image' }}</span>
                  </button>
                  <input type="file" ref="imageInput" @change="e => prepareFile(e, 'image')" hidden />
                </template>
                <div v-else class="input-wrapper url-input-field">
                  <input v-model="form.imageUrl" type="text" placeholder="Enter Image URL" />
                </div>
              </div>
              <p v-if="imageMode === 'upload' && !form.itemid" class="input-hint">Please enter an Item ID first.</p>
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
              <div v-if="(form.assetId || form.assetFile) && assetMode === 'upload'" class="upload-file-info">
                <FileCode :size="18" />
                <span class="filename">{{ form.assetFile ? form.assetFile.name : getFileName(form.assetId) }}</span>
                <button type="button" @click="clearFile('asset')" class="remove-btn">
                  <X :size="14" />
                </button>
              </div>
              <div class="upload-controls">
                <template v-if="assetMode === 'upload'">
                  <button type="button" class="btn btn-secondary btn-sm" :disabled="!form.itemid"
                    @click="$refs.assetInput.click()">
                    <Upload :size="16" />
                    <span>{{ form.assetFile ? 'Change Asset' : 'Choose Asset' }}</span>
                  </button>
                  <input type="file" ref="assetInput" @change="e => prepareFile(e, 'asset')" hidden />
                </template>
                <div v-else class="input-wrapper url-input-field">
                  <input v-model="form.assetId" type="text" placeholder="Enter Asset URL" />
                </div>
              </div>
              <p v-if="assetMode === 'upload' && !form.itemid" class="input-hint">Please enter an Item ID first.</p>
            </div>
          </div>

          <hr class="span-2" />

          <!-- Row 7: JSON Fields -->
          <div class="form-group span-2">
            <JsonBuilder
              v-model="form.bundle"
              :templates="jsonTemplates"
              label="Bundle Data"
              description="Select a template or manually build the bundle JSON object."
            />
          </div>

          <div class="form-group span-2">
            <JsonBuilder
              v-model="form.payload"
              :templates="jsonTemplates"
              label="Payload Data"
              description="Select a template or manually build the payload JSON object."
            />
          </div>
        </div>

        <!-- Progress Steps (Visible when saving) -->
        <div v-if="showProgress" class="steps-list fadeIn mt-4">
          <div class="step-item"
            :class="{ 'active': stepStatus.store === 'loading', 'completed': stepStatus.store === 'success' }">
            <div class="step-icon" :class="stepStatus.store">
              <RefreshCw v-if="stepStatus.store === 'loading'" class="spinning" :size="18" />
              <CheckCircle2 v-else-if="stepStatus.store === 'success'" :size="18" />
              <Circle v-else :size="18" />
            </div>
            <span class="step-text">Storing item data...</span>
          </div>

          <div v-if="imageMode === 'upload' && form.imageFile" class="step-item"
            :class="{ 'active': stepStatus.image === 'loading', 'completed': stepStatus.image === 'success' }">
            <div class="step-icon" :class="stepStatus.image">
              <RefreshCw v-if="stepStatus.image === 'loading'" class="spinning" :size="18" />
              <CheckCircle2 v-else-if="stepStatus.image === 'success'" :size="18" />
              <Circle v-else :size="18" />
            </div>
            <span class="step-text">Uploading image asset...</span>
          </div>

          <div v-if="assetMode === 'upload' && form.assetFile" class="step-item"
            :class="{ 'active': stepStatus.asset === 'loading', 'completed': stepStatus.asset === 'success' }">
            <div class="step-icon" :class="stepStatus.asset">
              <RefreshCw v-if="stepStatus.asset === 'loading'" class="spinning" :size="18" />
              <CheckCircle2 v-else-if="stepStatus.asset === 'success'" :size="18" />
              <Circle v-else :size="18" />
            </div>
            <span class="step-text">Uploading 3D model asset...</span>
          </div>
        </div>

        <div class="mt-4 d-flex justify-content-end gap-3">
          <button type="button" @click="$router.push({ name: 'config-catalog' })" class="btn-secondary"
            :disabled="formLoading">Cancel</button>
          <button @click="saveItem" class="btn-primary" :disabled="formLoading">
            <span v-if="!formLoading">{{ isEdit ? 'Save Changes' : 'Create Item' }}</span>
            <RefreshCw v-else class="spinning" :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api, { getCloudFrontUrl } from '@/services/api';
import axios from 'axios';
import { useGamesStore } from '@/stores/games';
import { storeToRefs } from 'pinia';
import {
  ChevronLeft, RefreshCw, Upload, X, CheckCircle2, Circle, Gamepad2, FileCode, ChevronDown
} from 'lucide-vue-next';
import JsonBuilder from '@/components/json-builder/JsonBuilder.vue';

export default {
  name: 'ConfigCatalogForm',
  components: {
    ChevronLeft, RefreshCw, Upload, X, CheckCircle2, Circle, Gamepad2, FileCode, ChevronDown, JsonBuilder
  },
  setup() {
    const gamesStore = useGamesStore();
    const { selectedGameId, selectedGame } = storeToRefs(gamesStore);
    return { selectedGameId, selectedGame };
  },
  data() {
    return {
      formLoading: false,
      isEdit: false,
      imageMode: 'upload',
      assetMode: 'upload',
      showProgress: false,
      stepStatus: {
        store: 'pending',
        image: 'pending',
        asset: 'pending'
      },
      currencies: [],
      jsonTemplates: [],
      form: {
        itemid: '',
        category: '',
        name: '',
        description: '',
        price: 0,
        currency: '',
        limitedAmount: -1,
        maxUses: 0,
        maxTime: 0,
        stackable: 'false',
        tradable: 'false',
        inAppPurchase: 'false',
        imageUrl: '',
        assetId: '',
        bundle: '',
        payload: '',
        imageFile: null,
        assetFile: null
      }
    };
  },
  async mounted() {
    const gamesStore = useGamesStore();
    if (gamesStore.games.length === 0) {
      await gamesStore.fetchGames();
    }

    if (this.selectedGameId) {
      this.fetchCurrencies();
    }

    if (this.$route.params.itemid) {
      this.isEdit = true;
      this.fetchItem();
    }
    
    this.fetchTemplates();
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
    async fetchCurrencies() {
      if (!this.selectedGameId) return;
      try {
        const res = await api.get(`/currencies/${this.selectedGameId}`);
        this.currencies = res.data.currencies || [];
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      }
    },
    async fetchTemplates() {
      try {
        const res = await api.get('/json-templates');
        this.jsonTemplates = res.data.templates || [];
      } catch (err) {
        console.error('Failed to fetch json templates:', err);
      }
    },
    async fetchItem() {
      if (!this.selectedGameId) return;
      this.formLoading = true;
      try {
        // Since list fetches all, we might find it in the list or fetch it specifically
        // For simplicity and correctness, fetch the game's catalog and find the item
        const res = await api.get(`/config-catalog/${this.selectedGameId}`);
        const item = res.data.items.find(i =>
          i.itemid === this.$route.params.itemid &&
          i.category === this.$route.params.category
        );

        if (item) {
          this.form = { ...item, imageFile: null, assetFile: null };
          this.imageMode = 'link';
          this.assetMode = 'link';
        } else {
          alert('Item not found');
          this.$router.push({ name: 'config-catalog' });
        }
      } catch (err) {
        console.error('Failed to fetch item:', err);
      } finally {
        this.formLoading = false;
      }
    },
    prepareFile(event, type) {
      const file = event.target.files[0];
      if (!file) return;
      this.form[type + 'File'] = file;
    },
    clearFile(type) {
      this.form[type + 'File'] = null;
      if (type === 'image') this.form.imageUrl = '';
      else this.form.assetId = '';
    },
    getFilePreview(file) {
      return URL.createObjectURL(file);
    },
    getFileName(url) {
      if (!url) return '';
      const parts = url.split('/');
      return parts[parts.length - 1];
    },
    async performUpload(file, field, category) {
      if (!file) return;
      try {
        const res = await api.post('/assets/upload', {
          gameId: this.selectedGameId,
          category: category,
          recordId: this.form.itemid,
          fileName: file.name,
          contentType: file.type
        });
        const { uploadUrl, finalUrl } = res.data;
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type }
        });
        this.form[field] = finalUrl;
        return true;
      } catch (err) {
        console.error(`Upload failed for ${field}:`, err);
        throw err;
      }
    },
    async saveItem() {
      if (!this.selectedGameId) return;
      if (!this.form.itemid || !this.form.category || !this.form.name) {
        alert('Item ID, Category, and Name are required');
        return;
      }

      this.formLoading = true;
      this.showProgress = true;

      // Step 1: Store Item Data
      this.stepStatus.store = 'loading';
      try {
        const payload = { ...this.form };
        delete payload.imageFile;
        delete payload.assetFile;

        if (this.isEdit) {
          await api.patch(`/config-catalog/${this.selectedGameId}/${this.form.category}/${this.form.itemid}`, payload);
        } else {
          await api.post(`/config-catalog/${this.selectedGameId}`, payload);
        }
        this.stepStatus.store = 'success';
      } catch (err) {
        this.stepStatus.store = 'error';
        alert(err.response?.data?.message || 'Error saving item');
        this.formLoading = false;
        return;
      }

      // Step 2: Upload Image
      if (this.imageMode === 'upload' && this.form.imageFile) {
        this.stepStatus.image = 'loading';
        try {
          await this.performUpload(this.form.imageFile, 'imageUrl', 'catalog/images');
          await api.patch(`/config-catalog/${this.selectedGameId}/${this.form.category}/${this.form.itemid}`, { imageUrl: this.form.imageUrl });
          this.stepStatus.image = 'success';
        } catch (err) {
          this.stepStatus.image = 'error';
        }
      } else {
        this.stepStatus.image = 'success';
      }

      // Step 3: Upload Asset
      if (this.assetMode === 'upload' && this.form.assetFile) {
        this.stepStatus.asset = 'loading';
        try {
          await this.performUpload(this.form.assetFile, 'assetId', 'catalog/assets');
          await api.patch(`/config-catalog/${this.selectedGameId}/${this.form.category}/${this.form.itemid}`, { assetId: this.form.assetId });
          this.stepStatus.asset = 'success';
        } catch (err) {
          this.stepStatus.asset = 'error';
        }
      } else {
        this.stepStatus.asset = 'success';
      }

      setTimeout(() => {
        this.$router.push({ name: 'config-catalog' });
      }, 1000);
    }
  }
};
</script>
