<template>
  <div class="catalog-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1>Config Catalog</h1>
        <p>Manage game items, assets, and configurations.</p>
      </div>
      <router-link :to="{ name: 'config-catalog-add' }" class="btn-primary" 
        :style="{ opacity: !selectedGameId ? 0.6 : 1, pointerEvents: !selectedGameId ? 'none' : 'auto' }">
         <Plus :size="20" />
         <span>Add Item</span>
       </router-link>
    </div>

    <!-- Game Selector -->
    <GameSelector />

    <!-- Main Content -->
    <template v-if="selectedGameId">
      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <Search class="search-icon" :size="20" />
          <input v-model="searchQuery" type="text" placeholder="Search by name or ID..." @input="handleSearch" />
        </div>
        <button @click="fetchCatalog" class="btn-ghost" :disabled="loading" title="Refresh">
          <RefreshCw :class="{ 'spinning': loading }" :size="20" />
        </button>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table v-if="items.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Assets</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.category + item.itemid">
              <td>
                <div class="user-row-info">
                  <div class="details">
                    <span class="name">{{ item.name }}</span>
                    <span class="subtext">{{ item.itemid }}</span>
                  </div>
                </div>
              </td>
              <td><code class="badge">{{ item.category }}</code></td>
              <td>
                <div class="d-flex flex-column">
                  <span class="text-mono">{{ item.price || 0 }}</span>
                  <span class="fs-sm text-muted-util">{{ item.currency }}</span>
                </div>
              </td>
              <td>
                <div class="flex-gap-2">
                  <button v-if="item.imageUrl" @click="previewAsset(item, 'image')" class="btn-ghost" title="View Image"
                    style="color: var(--text-muted)">
                    <Image :size="16" />
                  </button>
                  <button v-if="item.assetId" @click="previewAsset(item, 'asset')" class="btn-ghost" title="View Model"
                    style="color: var(--text-muted)">
                    <FileCode :size="16" />
                  </button>
                </div>
              </td>
              <td>
                <div class="row-actions">
                  <router-link
                    :to="{ name: 'config-catalog-edit', params: { category: item.category, itemid: item.itemid } }"
                    class="btn-ghost edit" title="Edit">
                    <Edit2 :size="16" />
                  </router-link>
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
          <p>Loading catalog items...</p>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <Package :size="48" />
          </div>
          <h3>No items found</h3>
          <p>Start by adding a new item to the catalog.</p>
        </div>
      </div>
    </template>

    <div v-else class="empty-state select-game-prompt">
      <Gamepad2 :size="48" />
      <h3>Please select a game</h3>
      <p>Select a game from the list above to manage its catalog.</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="itemToDelete" class="modal-overlay danger" @click.self="itemToDelete = null">
        <div class="modal-card danger">
          <div class="modal-header">
            <div class="header-content">
              <h2>Delete Item</h2>
              <p>Are you sure you want to delete <strong>{{ itemToDelete.name }}</strong>? This action cannot be undone.
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
    <ImageModal :is-open="!!assetToPreview" :asset-url="getCloudFrontUrl(previewUrl)" :title="assetToPreview?.name"
      :is-image="previewType === 'image'" @close="assetToPreview = null" />
  </div>
</template>

<script>
import api, { getCloudFrontUrl } from '@/services/api';
import { useGamesStore } from '@/stores/games';
import { storeToRefs } from 'pinia';
import GameSelector from '@/components/GameSelector.vue';
import ImageModal from '@/components/ImageModal.vue';
import {
  Package, Search, RefreshCw, Edit2, Trash2, X, Plus, Image, FileCode, Gamepad2
} from 'lucide-vue-next';

export default {
  name: 'ConfigCatalogList',
  components: {
    GameSelector,
    ImageModal,
    Package, Search, RefreshCw, Edit2, Trash2, X, Plus, Image, FileCode, Gamepad2
  },
  setup() {
    const gamesStore = useGamesStore();
    const { selectedGameId } = storeToRefs(gamesStore);
    return { selectedGameId };
  },
  data() {
    return {
      items: [],
      loading: false,
      searchQuery: '',
      itemToDelete: null,
      assetToPreview: null,
      previewType: 'image',
      formLoading: false
    };
  },
  computed: {
    filteredItems() {
      if (!this.searchQuery) return this.items;
      const q = this.searchQuery.toLowerCase();
      return this.items.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.itemid?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    },
    previewUrl() {
      if (!this.assetToPreview) return '';
      return this.previewType === 'image' ? this.assetToPreview.imageUrl : this.assetToPreview.assetId;
    }
  },
  watch: {
    selectedGameId() {
      if (this.selectedGameId) {
        this.fetchCatalog();
      } else {
        this.items = [];
      }
    }
  },
  methods: {
    getCloudFrontUrl,
    async fetchCatalog() {
      if (!this.selectedGameId) return;
      this.loading = true;
      try {
        const res = await api.get(`/config-catalog/${this.selectedGameId}`);
        this.items = res.data.items || [];
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      // Offline filtering
    },
    confirmDelete(item) {
      this.itemToDelete = item;
    },
    async handleDelete() {
      if (!this.itemToDelete) return;
      this.formLoading = true;
      try {
        await api.delete(`/config-catalog/${this.selectedGameId}/${this.itemToDelete.category}/${this.itemToDelete.itemid}`);
        await this.fetchCatalog();
        this.itemToDelete = null;
      } catch (err) {
        console.error('Failed to delete item:', err);
        alert(err.response?.data?.message || 'Error deleting item');
      } finally {
        this.formLoading = false;
      }
    },
    previewAsset(item, type) {
      this.previewType = type;
      this.assetToPreview = item;
    }
  },
  mounted() {
    if (this.selectedGameId) {
      this.fetchCatalog();
    }
  }
};
</script>
