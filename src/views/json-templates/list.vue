<template>
  <div class="json-templates-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1>JSON Templates</h1>
        <p>Manage pre-defined JSON templates for Config Catalog bundles and payloads.</p>
      </div>
      <router-link :to="{ name: 'json-templates-create' }" class="btn-primary">
         <Plus :size="20" />
         <span>Create Template</span>
       </router-link>
    </div>

    <!-- Main Content -->
    <template v-if="templates">
      <!-- Filters -->
      <div class="filters-bar mt-4">
        <div class="search-wrapper">
          <Search class="search-icon" :size="20" />
          <input v-model="searchQuery" type="text" placeholder="Search templates..." @input="handleSearch" />
        </div>
        <button @click="fetchTemplates" class="btn-ghost" :disabled="loading" title="Refresh">
          <RefreshCw :class="{ 'spinning': loading }" :size="20" />
        </button>
      </div>

      <div class="table-wrapper">
        <table v-if="filteredTemplates.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Template Name</th>
            <th>Template ID</th>
            <th>Attributes Count</th>
            <th style="text-align: right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="template in filteredTemplates" :key="template.templateId">
            <td>
              <div class="user-row-info">
                <div class="details">
                  <span class="name">{{ template.name }}</span>
                </div>
              </div>
            </td>
            <td><code class="badge">{{ template.templateId }}</code></td>
            <td>
              <span class="text-mono">{{ template.attributes?.length || 0 }}</span>
            </td>
            <td>
              <div class="row-actions">
                <router-link
                  :to="{ name: 'json-templates-edit', params: { templateId: template.templateId } }"
                  class="btn-ghost edit" title="Edit">
                  <Edit2 :size="16" />
                </router-link>
                <button @click="confirmDelete(template)" class="btn-ghost delete" title="Delete">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="loading" class="empty-state">
        <RefreshCw class="spinning" :size="32" />
        <p>Loading templates...</p>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <FileJson :size="48" />
        </div>
        <h3>No templates found</h3>
        <p>Start by creating a new JSON template.</p>
      </div>
    </div>
    </template>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="templateToDelete" class="modal-overlay danger" @click.self="templateToDelete = null">
        <div class="modal-card danger">
          <div class="modal-header">
            <div class="header-content">
              <h2>Delete Template</h2>
              <p>Are you sure you want to delete <strong>{{ templateToDelete.name }}</strong>? This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="templateToDelete = null" class="btn-secondary">Cancel</button>
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
  FileJson, Search, RefreshCw, Edit2, Trash2, Plus
} from 'lucide-vue-next';

export default {
  name: 'JsonTemplatesList',
  components: {
    FileJson, Search, RefreshCw, Edit2, Trash2, Plus
  },
  data() {
    return {
      templates: [],
      loading: false,
      searchQuery: '',
      templateToDelete: null,
      formLoading: false
    };
  },
  computed: {
    filteredTemplates() {
      if (!this.searchQuery) return this.templates;
      const q = this.searchQuery.toLowerCase();
      return this.templates.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.templateId?.toLowerCase().includes(q)
      );
    }
  },
  methods: {
    async fetchTemplates() {
      this.loading = true;
      try {
        const res = await api.get(`/json-templates`);
        this.templates = res.data.templates || [];
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      // Offline filtering handled by computed property
    },
    confirmDelete(template) {
      this.templateToDelete = template;
    },
    async handleDelete() {
      if (!this.templateToDelete) return;
      this.formLoading = true;
      try {
        await api.delete(`/json-templates/${this.templateToDelete.templateId}`);
        await this.fetchTemplates();
        this.templateToDelete = null;
      } catch (err) {
        console.error('Failed to delete template:', err);
        alert(err.response?.data?.message || 'Error deleting template');
      } finally {
        this.formLoading = false;
      }
    }
  },
  mounted() {
    this.fetchTemplates();
  }
};
</script>
