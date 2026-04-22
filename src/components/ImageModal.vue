<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-card large image-preview-modal">
        <div class="modal-header">
          <div class="header-content">
            <h2>{{ title || 'Asset Preview' }}</h2>
          </div>
          <button @click="close" class="btn-ghost">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body p-0">
          <div class="image-container">
            <img v-if="isImage" :src="assetUrl" :alt="title" class="preview-img" />
            <div v-else class="no-preview">
              <Box :size="64" class="text-dim mb-3" />
              <h3>Preview is not available</h3>
              <p>You can still open or download the original file.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="close" class="btn-secondary">Close</button>
          <a :href="assetUrl" target="_blank" class="btn-primary">
            <ExternalLink :size="18" />
            <span>Open Original</span>
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { X, ExternalLink, Box } from 'lucide-vue-next';

defineProps({
  isOpen: Boolean,
  assetUrl: String,
  title: String,
  isImage: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
.image-preview-modal {
  max-width: 900px !important;
  
  .modal-body {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 350px;
    max-height: 80vh;
  }

  .image-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    overflow: hidden;
  }

  .preview-img {
    display: block;
    max-width: 70%; /* Reduced from 100% to make it smaller */
    max-height: 50vh; /* Reduced from 80vh to make it smaller */
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease;
  }

  .no-preview {
    text-align: center;
    padding: 3rem;
    
    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    p {
      color: var(--text-muted);
      font-size: 0.9375rem;
    }
  }
}
</style>
