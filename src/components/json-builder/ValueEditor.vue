<template>
  <div class="value-editor" :class="{ 'nested': depth > 0 }">
    <div class="editor-header">
      <div class="d-flex align-items-center gap-3 w-100">
        
        <button v-if="['object', 'array'].includes(currentType)" type="button" @click="toggleExpand" class="btn-ghost btn-sm p-1">
          <ChevronDown v-if="isExpanded" :size="16" />
          <ChevronRight v-else :size="16" />
        </button>
        <div v-else style="width: 24px;"></div> <!-- placeholder for alignment -->

        <!-- Name / Key -->
        <div class="field-name d-flex align-items-center" :class="{ 'text-muted': isCustom }">
          <span v-if="name !== null && !isCustom" class="fw-medium text-nowrap" style="margin-right: 8px;">{{ name }}</span>
          <input 
             v-else-if="isCustom" 
             :value="name" 
             @change="renameCustomKey($event.target.value)" 
             class="custom-key-input"
             style="background: transparent; border: 1px dashed var(--border); color: var(--text-main); width: 100px; margin-right: 8px; padding: 2px 4px;"
             title="Rename custom attribute"
          />
          <span v-else class="text-muted fst-italic text-nowrap" style="margin-right: 8px;" title="Array items use numbered indices, not names">Item {{ index !== undefined ? index + 1 : '' }}</span>
          
          <span v-if="isCustom" class="badge bg-secondary ms-2 fs-xs" title="This attribute is manually added and not part of the template">Custom</span>
        </div>

        <!-- Value Input for Primitives -->
        <div v-if="currentType === 'string'" class="input-wrapper mb-0 flex-grow-1">
          <input :value="modelValue" @input="updateValue($event.target.value)" type="text" placeholder="String value" />
        </div>
        <div v-else-if="currentType === 'number'" class="input-wrapper mb-0 flex-grow-1">
          <input :value="modelValue" @input="updateValue(Number($event.target.value))" type="number" placeholder="Number value" />
        </div>
        <div v-else-if="currentType === 'boolean'" class="custom-select-wrapper mb-0 flex-grow-1">
          <select :value="modelValue" @change="updateValue($event.target.value === 'true')">
            <option :value="true">True</option>
            <option :value="false">False</option>
          </select>
          <ChevronDown class="select-icon" :size="16" />
        </div>
        <div v-else class="flex-grow-1 d-flex align-items-center">
            <span class="fs-sm text-muted">[{{ currentType }}]</span>
        </div>

        <!-- Remove Button (for arrays or custom properties) -->
        <button v-if="canRemove" type="button" @click="$emit('remove')" class="btn-ghost delete btn-sm" title="Remove">
          <Trash2 :size="16" />
        </button>

      </div>
    </div>

    <!-- Nested Content for Object/Array -->
    <div v-if="isExpanded && ['object', 'array'].includes(currentType)" class="editor-body mt-2">
      
      <!-- Object Properties -->
      <template v-if="currentType === 'object'">
        <div class="d-flex flex-column gap-2">
          <!-- Schema Properties -->
          <ValueEditor
            v-for="propSchema in schemaProperties"
            :key="propSchema.name"
            :schema="propSchema"
            :name="propSchema.name"
            :model-value="modelValue ? modelValue[propSchema.name] : undefined"
            :depth="depth + 1"
            @update:modelValue="updateObjectKey(propSchema.name, $event)"
          />
          <!-- Custom Properties -->
          <ValueEditor
            v-for="(val, key) in customProperties"
            :key="'custom_'+key"
            :name="key"
            :model-value="val"
            :is-custom="true"
            :depth="depth + 1"
            :can-remove="true"
            @update:modelValue="updateObjectKey(key, $event)"
            @remove="removeObjectKey(key)"
            @rename-key="renameObjectKey(key, $event)"
          />
        </div>
        <div class="mt-2 pl-4">
          <div v-if="isAddingCustom" class="d-flex gap-2 align-items-center mt-2 p-2 bg-surface border rounded">
             <div class="input-wrapper mb-0" style="width: 150px;">
               <input v-model="newCustomKey" type="text" placeholder="Key name" />
             </div>
             <div class="custom-select-wrapper mb-0" style="width: 120px;">
                <select v-model="newCustomType">
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                  <option value="array">Array</option>
                </select>
                <ChevronDown class="select-icon" :size="16" />
             </div>
             <button @click="addCustomProperty" class="btn btn-primary btn-sm">Add</button>
             <button @click="isAddingCustom = false" class="btn-ghost btn-sm"><X :size="16"/></button>
          </div>
          <button v-else @click="isAddingCustom = true" type="button" class="btn btn-secondary btn-sm mt-2">
            <Plus :size="14" />
            <span>Add Custom Field</span>
          </button>
        </div>
      </template>

      <!-- Array Items -->
      <template v-if="currentType === 'array'">
        <div class="d-flex flex-column gap-2">
          <ValueEditor
            v-for="(item, index) in arrayItems"
            :key="index"
            :schema="schema?.items"
            :name="null"
            :index="index"
            :model-value="item"
            :depth="depth + 1"
            :can-remove="true"
            @update:modelValue="updateArrayItem(index, $event)"
            @remove="removeArrayItem(index)"
          />
        </div>
        <div class="mt-2 pl-4">
          <button type="button" @click="addArrayItem" class="btn btn-secondary btn-sm mt-2">
            <Plus :size="14" />
            <span>Add Item</span>
          </button>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
import { ChevronDown, ChevronRight, Trash2, Plus, X } from 'lucide-vue-next';

export default {
  name: 'ValueEditor',
  components: {
    ChevronDown, ChevronRight, Trash2, Plus, X
  },
  props: {
    schema: {
      type: Object,
      default: null
    },
    name: {
      type: [String, Number],
      default: null
    },
    modelValue: {
      type: [String, Number, Boolean, Object, Array],
      default: undefined
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    depth: {
      type: Number,
      default: 0
    },
    canRemove: {
      type: Boolean,
      default: false
    },
    index: {
      type: Number,
      default: undefined
    }
  },
  data() {
    return {
      isExpanded: true,
      isAddingCustom: false,
      newCustomKey: '',
      newCustomType: 'string'
    };
  },
  computed: {
    currentType() {
      if (this.schema && this.schema.type) {
        return this.schema.type;
      }
      if (Array.isArray(this.modelValue)) return 'array';
      if (this.modelValue !== null && typeof this.modelValue === 'object') return 'object';
      if (typeof this.modelValue === 'boolean') return 'boolean';
      if (typeof this.modelValue === 'number') return 'number';
      return 'string';
    },
    schemaProperties() {
      return this.schema?.properties || [];
    },
    customProperties() {
      if (this.currentType !== 'object' || !this.modelValue) return {};
      const schemaKeys = this.schemaProperties.map(p => p.name);
      const custom = {};
      for (const key in this.modelValue) {
        if (!schemaKeys.includes(key)) {
          custom[key] = this.modelValue[key];
        }
      }
      return custom;
    },
    arrayItems() {
      return Array.isArray(this.modelValue) ? this.modelValue : [];
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    updateValue(val) {
      this.$emit('update:modelValue', val);
    },
    updateObjectKey(key, val) {
      const newObj = { ...(this.modelValue || {}) };
      newObj[key] = val;
      this.updateValue(newObj);
    },
    removeObjectKey(key) {
      const newObj = { ...(this.modelValue || {}) };
      delete newObj[key];
      this.updateValue(newObj);
    },
    renameObjectKey(oldKey, newKey) {
      if (!newKey || oldKey === newKey) return;
      const newObj = { ...(this.modelValue || {}) };
      newObj[newKey] = newObj[oldKey];
      delete newObj[oldKey];
      this.updateValue(newObj);
    },
    renameCustomKey(newKey) {
      if (newKey && newKey !== this.name) {
         this.$emit('rename-key', newKey);
      }
    },
    addCustomProperty() {
      if (!this.newCustomKey) return;
      let defaultVal = '';
      if (this.newCustomType === 'number') defaultVal = 0;
      if (this.newCustomType === 'boolean') defaultVal = false;
      if (this.newCustomType === 'object') defaultVal = {};
      if (this.newCustomType === 'array') defaultVal = [];
      
      this.updateObjectKey(this.newCustomKey, defaultVal);
      this.newCustomKey = '';
      this.newCustomType = 'string';
      this.isAddingCustom = false;
    },
    updateArrayItem(index, val) {
      const newArr = [...this.arrayItems];
      newArr[index] = val;
      this.updateValue(newArr);
    },
    removeArrayItem(index) {
      const newArr = [...this.arrayItems];
      newArr.splice(index, 1);
      this.updateValue(newArr);
    },
    addArrayItem() {
      let defaultVal = '';
      const itemType = this.schema?.items?.type || 'string';
      if (itemType === 'number') defaultVal = 0;
      if (itemType === 'boolean') defaultVal = false;
      if (itemType === 'object') defaultVal = {};
      if (itemType === 'array') defaultVal = [];
      if (this.schema?.items?.defaultValue !== undefined) {
         defaultVal = JSON.parse(JSON.stringify(this.schema.items.defaultValue));
      }

      const newArr = [...this.arrayItems, defaultVal];
      this.updateValue(newArr);
    }
  },
  watch: {
     // Initialize default values based on schema if modelValue is undefined
     modelValue: {
       immediate: true,
       handler(newVal) {
          if (newVal === undefined && this.schema) {
             let def = this.schema.defaultValue;
             // clone objects/arrays so we don't mutate schema defaults
             if (def !== undefined) {
                if (typeof def === 'object' && def !== null) {
                   def = JSON.parse(JSON.stringify(def));
                }
                this.$emit('update:modelValue', def);
             } else {
                if (this.schema.type === 'object') this.$emit('update:modelValue', {});
                else if (this.schema.type === 'array') this.$emit('update:modelValue', []);
             }
          }
       }
     }
  }
};
</script>
