<template>
  <div class="json-template-form-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <button @click="$router.push({ name: 'json-templates' })" class="btn-ghost mb-5">
          <ChevronLeft :size="20" />
          <span>Back to Templates</span>
        </button>
        <h1>{{ isEdit ? 'Edit Template' : 'Create New Template' }}</h1>
        <p>Define the structure and default values for your JSON payload.</p>
      </div>
    </div>

    <div class="w-form py-form">
      <div class="card bg-surface border rounded-lg p-form">
        
        <div class="form-group mb-5">
          <label>Template Name *</label>
          <div class="input-wrapper">
            <input v-model="form.name" type="text" placeholder="e.g., Weapon Item Bundle" required />
          </div>
        </div>

        <div class="form-group mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
             <label class="mb-0">Template Schema (Attributes)</label>
             <button type="button" @click="addAttribute" class="btn-secondary btn-sm">
                <Plus :size="16" />
                <span>Add Root Attribute</span>
             </button>
          </div>
          
          <div v-if="form.attributes.length === 0" class="empty-state p-4 border rounded dashed">
             <p class="text-muted mb-0">No attributes defined yet. Add an attribute to start building your template.</p>
          </div>

          <div v-else class="d-flex flex-column gap-3">
             <TemplateAttributeEditor
               v-for="(attr, index) in form.attributes"
               :key="index"
               :attribute="attr"
               @remove="removeAttribute(index)"
             />
          </div>
        </div>

        <div class="mt-5 d-flex justify-content-end gap-3 pt-4 border-top">
          <button type="button" @click="$router.push({ name: 'json-templates' })" class="btn-secondary"
            :disabled="formLoading">Cancel</button>
          <button @click="saveTemplate" class="btn-primary" :disabled="formLoading">
            <span v-if="!formLoading">{{ isEdit ? 'Save Changes' : 'Create Template' }}</span>
            <RefreshCw v-else class="spinning" :size="18" />
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';
import { ChevronLeft, Plus, RefreshCw } from 'lucide-vue-next';
import TemplateAttributeEditor from '@/components/json-builder/TemplateAttributeEditor.vue';

export default {
  name: 'JsonTemplateForm',
  components: {
    ChevronLeft, Plus, RefreshCw, TemplateAttributeEditor
  },
  data() {
    return {
      isEdit: false,
      formLoading: false,
      form: {
        name: '',
        attributes: []
      }
    };
  },
  async mounted() {
    if (this.$route.params.templateId) {
      this.isEdit = true;
      await this.fetchTemplate();
    }
  },
  methods: {
    async fetchTemplate() {
      this.formLoading = true;
      try {
        const res = await api.get(`/json-templates/${this.$route.params.templateId}`);
        if (res.data.template) {
           this.form = {
              name: res.data.template.name,
              attributes: res.data.template.attributes || []
           };
        }
      } catch (err) {
        console.error('Failed to fetch template:', err);
        alert('Template not found');
        this.$router.push({ name: 'json-templates' });
      } finally {
        this.formLoading = false;
      }
    },
    addAttribute() {
      this.form.attributes.push({
        name: '',
        type: 'string',
        defaultValue: ''
      });
    },
    removeAttribute(index) {
      this.form.attributes.splice(index, 1);
    },
    async saveTemplate() {
      if (!this.form.name) {
         alert('Template Name is required');
         return;
      }

      this.formLoading = true;
      try {
        if (this.isEdit) {
           await api.patch(`/json-templates/${this.$route.params.templateId}`, this.form);
        } else {
           await api.post(`/json-templates`, this.form);
        }
        this.$router.push({ name: 'json-templates' });
      } catch (err) {
        console.error('Failed to save template:', err);
        alert(err.response?.data?.message || 'Error saving template');
      } finally {
        this.formLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.dashed {
  border-style: dashed;
}
</style>
