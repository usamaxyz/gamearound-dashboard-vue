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

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppSidebar from '@/components/AppSidebar.vue';
import app_header from '@/components/app_header.vue';

const authStore = useAuthStore();
const isSidebarOpen = ref(true);

onMounted(async () => {
    await authStore.checkAuth();
});
</script>
