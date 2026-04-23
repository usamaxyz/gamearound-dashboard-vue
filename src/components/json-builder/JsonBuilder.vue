<template>
  <div class="json-builder">
    <div class="builder-header mb-3">
      <div class="d-flex align-items-center gap-3">
        <label class="mb-0 fw-bold">{{ label }}</label>
        <div class="custom-select-wrapper mb-0 flex-grow-1" style="max-width: 300px;">
          <select v-model="selectedTemplateId" @change="applyTemplate">
            <option value="">-- Custom (No Template) --</option>
            <option v-for="tpl in templates" :key="tpl.templateId" :value="tpl.templateId">
              {{ tpl.name }}
            </option>
          </select>
          <ChevronDown class="select-icon" :size="16" />
        </div>
        <button type="button" class="btn-ghost btn-sm" @click="toggleRawMode">
           <Code v-if="!rawMode" :size="16" title="View Raw JSON" />
           <List v-else :size="16" title="View Builder" />
        </button>
      </div>
      <p class="fs-sm text-muted mt-1 mb-0">{{ description }}</p>
    </div>

    <div class="builder-body">
      <template v-if="!rawMode">
        <ValueEditor
          v-if="internalValue !== null"
          :schema="rootSchema"
          name="Root"
          :model-value="internalValue"
          @update:modelValue="onValueUpdate"
        />
        <div v-else class="text-center p-3">
          <button type="button" @click="initializeEmpty" class="btn-secondary btn-sm">Initialize Object</button>
        </div>
      </template>

      <template v-else>
        <div class="input-wrapper mb-0">
          <textarea 
            v-model="rawJsonString" 
            @change="onRawChange"
            rows="10" 
            class="font-mono text-sm"
            :class="{ 'border-danger': jsonError }"
          ></textarea>
        </div>
        <p v-if="jsonError" class="text-danger fs-sm mt-1 mb-0">{{ jsonError }}</p>
      </template>
    </div>
  </div>
</template>

<script>
import ValueEditor from './ValueEditor.vue';
import { ChevronDown, Code, List } from 'lucide-vue-next';

export default {
  name: 'JsonBuilder',
  components: {
    ValueEditor, ChevronDown, Code, List
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    templates: {
      type: Array,
      default: () => []
    },
    label: {
      type: String,
      default: 'JSON Builder'
    },
    description: {
      type: String,
      default: 'Select a template or build custom JSON.'
    }
  },
  data() {
    return {
      selectedTemplateId: '',
      internalValue: null,
      rawMode: false,
      rawJsonString: '',
      jsonError: ''
    };
  },
  computed: {
    selectedTemplate() {
      if (!this.selectedTemplateId) return null;
      return this.templates.find(t => t.templateId === this.selectedTemplateId);
    },
    rootSchema() {
      if (this.selectedTemplate) {
        return {
          type: 'object',
          properties: this.selectedTemplate.attributes
        };
      }
      return { type: 'object', properties: [] };
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (!this.rawMode) {
          this.parseValue(newVal);
        }
      }
    }
  },
  methods: {
    parseValue(str) {
      if (!str) {
        this.internalValue = {};
        return;
      }
      try {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
           this.internalValue = parsed;
        } else {
           // Not an object, fallback
           this.internalValue = {};
        }
        this.jsonError = '';
      } catch (e) {
        console.warn('Failed to parse JSON string in JsonBuilder:', e);
        this.internalValue = {};
      }
    },
    onValueUpdate(newVal) {
      this.internalValue = newVal;
      this.emitUpdate();
    },
    emitUpdate() {
      const str = JSON.stringify(this.internalValue, null, 2);
      this.rawJsonString = str;
      this.$emit('update:modelValue', str);
    },
    applyTemplate() {
      if (!this.selectedTemplate) return;
      
      const newObj = { ...(this.internalValue || {}) };
      
      // Inject defaults for keys that don't exist
      const applyDefaults = (props, target) => {
         if (!props) return;
         props.forEach(prop => {
            if (target[prop.name] === undefined && prop.defaultValue !== undefined) {
               target[prop.name] = JSON.parse(JSON.stringify(prop.defaultValue));
            }
         });
      };
      
      applyDefaults(this.selectedTemplate.attributes, newObj);
      
      this.internalValue = newObj;
      this.emitUpdate();
    },
    initializeEmpty() {
      this.internalValue = {};
      this.emitUpdate();
    },
    toggleRawMode() {
      if (!this.rawMode) {
         this.rawJsonString = JSON.stringify(this.internalValue, null, 2);
         this.jsonError = '';
      } else {
         this.onRawChange();
      }
      if (!this.jsonError) {
         this.rawMode = !this.rawMode;
      }
    },
    onRawChange() {
       try {
          const parsed = JSON.parse(this.rawJsonString);
          this.internalValue = parsed;
          this.jsonError = '';
          this.$emit('update:modelValue', this.rawJsonString);
       } catch (e) {
          this.jsonError = e.message;
       }
    }
  }
};
</script>

<style scoped>
.json-builder {
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
}
.font-mono {
  font-family: monospace;
}
</style>
