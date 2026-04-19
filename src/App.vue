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

<style lang="scss">
.loading-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep);
  
  .loader {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary);
    animation: spin 1s ease-in-out infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-shell {
  min-height: 100vh;
  background: var(--bg-deep);
}

.dashboard-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-deep);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: padding var(--transition-normal);
  padding-left: var(--sidebar-width);
  
  &.sidebar-collapsed {
    padding-left: var(--sidebar-collapsed-width);
  }
}

.content-area {
  padding: 2rem;
  flex: 1;
}

/* Mobile adjustments could go here */
@media (max-width: 1024px) {
  .main-content {
    padding-left: 0 !important;
  }
}
</style>