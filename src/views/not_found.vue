<template>
  <div class="not-found-page">
    <div class="empty-state">
      <div class="empty-icon">
        <Ghost :size="80" />
      </div>
      <h1 class="error-code">404</h1>
      <h3>Page not found</h3>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      
      <div class="modal-actions center">
        <router-link :to="{ name: 'home' }" class="btn-primary">
          Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { Ghost } from 'lucide-vue-next';

export default {
  name: 'NotFoundView',
  components: {
    Ghost
  }
};
</script>
