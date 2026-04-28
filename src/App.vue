<template>
  <div v-if="authStore.loading" class="loading-screen">
    <div class="loader"></div>
  </div>

  <div v-else-if="authStore.isAuthenticated" class="dashboard-shell">
    <div 
      v-if="isMobile && isSidebarOpen" 
      class="sidebar-overlay" 
      @click="isSidebarOpen = false"
    ></div>

    <AppSidebar :is-open="isSidebarOpen" :is-mobile="isMobile" />

    <main class="main-content" :class="{ 'sidebar-collapsed': !isSidebarOpen }">
      <app_header @toggle-sidebar="toggleSidebar" />

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
      isSidebarOpen: window.innerWidth > 1024,
      isMobile: window.innerWidth <= 1024
    };
  },
  watch: {
    '$route'() {
      if (this.isMobile && this.isSidebarOpen) {
        this.isSidebarOpen = false;
      }
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 1024;
    }
  },
  async mounted() {
    await this.authStore.checkAuth();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>
