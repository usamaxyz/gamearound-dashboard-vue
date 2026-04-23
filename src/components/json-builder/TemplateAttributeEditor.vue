<template>
  <div class="attribute-editor">
    <div class="attribute-header">
      <div class="d-flex align-items-center gap-3">
        <button type="button" @click="toggleExpand" class="btn-ghost btn-sm p-1">
          <ChevronDown v-if="isExpanded" :size="16" />
          <ChevronRight v-else :size="16" />
        </button>
        <div v-if="!hideName" class="input-wrapper mb-0" style="width: 200px;">
          <input v-model="attribute.name" type="text" placeholder="Attribute Name" />
        </div>
        <div class="custom-select-wrapper mb-0" style="width: 150px;">
          <select v-model="attribute.type" @change="onTypeChange">
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
          <ChevronDown class="select-icon" :size="16" />
        </div>
      </div>
      
      <div class="d-flex align-items-center gap-2">
        <!-- Default Value for Primitives -->
        <template v-if="['string', 'number'].includes(attribute.type)">
          <div class="input-wrapper mb-0" style="width: 150px;">
            <input 
              v-model="attribute.defaultValue" 
              :type="attribute.type === 'number' ? 'number' : 'text'" 
              placeholder="Default Value" 
            />
          </div>
        </template>
        <template v-else-if="attribute.type === 'boolean'">
           <div class="custom-select-wrapper mb-0" style="width: 150px;">
            <select v-model="attribute.defaultValue">
              <option :value="true">True</option>
              <option :value="false">False</option>
            </select>
            <ChevronDown class="select-icon" :size="16" />
          </div>
        </template>
        
        <button type="button" @click="$emit('remove')" class="btn-ghost delete btn-sm" title="Remove Attribute">
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <div v-if="isExpanded && ['object', 'array'].includes(attribute.type)" class="attribute-body pl-4 mt-3 border-left">
      
      <template v-if="attribute.type === 'object'">
        <p class="fs-sm text-muted mb-2">Object Properties:</p>
        <div class="d-flex flex-column gap-2 mb-3">
          <TemplateAttributeEditor
            v-for="(prop, index) in attribute.properties"
            :key="index"
            :attribute="prop"
            @remove="removeProperty(index)"
          />
        </div>
        <button type="button" @click="addProperty" class="btn btn-secondary btn-sm">
          <Plus :size="14" />
          <span>Add Property</span>
        </button>
      </template>

      <template v-if="attribute.type === 'array'">
        <p class="fs-sm text-muted mb-2">Array Item Schema:</p>
        <div class="mb-3 p-3 bg-surface border rounded">
          <div class="d-flex align-items-center gap-3 mb-3">
             <div class="custom-select-wrapper mb-0" style="width: 150px;">
              <select v-model="attribute.items.type" @change="onArrayItemTypeChange">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
              <ChevronDown class="select-icon" :size="16" />
            </div>
            <span class="fs-sm text-muted">Defines the type of items in this array</span>
          </div>

          <template v-if="['object', 'array'].includes(attribute.items.type)">
             <!-- To avoid infinite recursion without data, we need a slight wrapper or just use the component itself but without name field -->
             <!-- We'll treat array items just like a nameless attribute -->
             <TemplateAttributeEditor
               :attribute="attribute.items"
               :hide-name="true"
             />
          </template>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
import { ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-vue-next';

export default {
  name: 'TemplateAttributeEditor',
  components: {
    ChevronDown, ChevronRight, Trash2, Plus
  },
  props: {
    attribute: {
      type: Object,
      required: true
    },
    hideName: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isExpanded: true
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    onTypeChange() {
      // Reset values based on type
      if (this.attribute.type === 'object') {
        this.attribute.defaultValue = {};
        if (!this.attribute.properties) {
          this.attribute.properties = [];
        }
      } else if (this.attribute.type === 'array') {
        this.attribute.defaultValue = [];
        if (!this.attribute.items) {
          this.attribute.items = { type: 'string' };
        }
      } else if (this.attribute.type === 'boolean') {
        this.attribute.defaultValue = false;
      } else if (this.attribute.type === 'number') {
        this.attribute.defaultValue = 0;
      } else {
        this.attribute.defaultValue = '';
      }
    },
    onArrayItemTypeChange() {
        if (this.attribute.items.type === 'object') {
            this.attribute.items.properties = [];
        } else if (this.attribute.items.type === 'array') {
            this.attribute.items.items = { type: 'string' };
        }
    },
    addProperty() {
      if (!this.attribute.properties) this.attribute.properties = [];
      this.attribute.properties.push({
        name: '',
        type: 'string',
        defaultValue: ''
      });
    },
    removeProperty(index) {
      this.attribute.properties.splice(index, 1);
    }
  }
}
</script>

<style scoped>
.attribute-editor {
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}
.attribute-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.border-left {
  border-left: 2px solid var(--border-color);
}
</style>
