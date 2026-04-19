<template>
  <div v-if="authStore.loading" class="loading-screen">
    <div class="loader"></div>
  </div>

  <div v-else-if="authStore.isAuthenticated" class="dashboard-shell">
    <AppSidebar :is-open="isSidebarOpen" />

    <main class="main-content" :class="{ 'sidebar-collapsed': !isSidebarOpen }">
      <app_header @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <div class="content-area">
        <RouterView />
      </div>
    </main>
  </div>

  <div v-else class="auth-shell">
    <RouterView />
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth';
import AppSidebar from '@/components/AppSidebar.vue';
import app_header from '@/components/app_header.vue';

export default {
  name: 'App',
  components: {
    AppSidebar,
    app_header
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      isSidebarOpen: true
    };
  },
  async mounted() {
    await this.authStore.checkAuth();
  }
};
</script>
