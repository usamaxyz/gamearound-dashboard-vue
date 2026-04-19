<template>
  <nav class="topbar">
    <div class="topbar-left">
      <button 
        v-if="authStore.isAuthenticated" 
        @click="$emit('toggle-sidebar')" 
        class="btn-ghost"
        title="Toggle Sidebar"
      >
        <Menu :size="20" />
      </button>

      <div class="page-info">
        <h1 class="page-title">{{ currentPageName }}</h1>
      </div>
    </div>

    <div class="topbar-right">
      <div v-if="authStore.isAuthenticated" class="user-actions">
        <!-- Notifications or Search could go here -->
        
        <div class="divider"></div>
        
        <div class="user-menu">
          <div class="user-info">
            <span class="user-name">{{ authStore.name }}</span>
            <span class="company-tag">{{ authStore.companyName }}</span>
          </div>
          <button @click="handleLogout" class="btn-danger logout-btn" title="Logout">
            <LogOut :size="18" />
          </button>
        </div>
      </div>
      <div v-else>
        <router-link :to="{name: 'login'}" class="btn-primary login-btn">Sign In</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { LogOut, Menu } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();

defineEmits(['toggle-sidebar']);

const currentPageName = computed(() => {
    const name = route.name?.toString() || 'Dashboard';
    return name.charAt(0).toUpperCase() + name.slice(1);
});

const handleLogout = async () => {
    await authStore.logout();
    router.push({ name: 'login' });
};
</script>

<style lang="scss" scoped>
.topbar {
    height: var(--topbar-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-6);
    @include glass;
    border-top: none; border-left: none; border-right: none;
    z-index: var(--z-sticky);
    position: sticky; top: 0;
}

.topbar-left { display: flex; align-items: center; gap: var(--space-6); }
.page-title { font-size: 1.125rem; font-weight: 700; color: var(--text-main); margin: 0; letter-spacing: -0.5px; }

.topbar-right { display: flex; align-items: center; }
.user-actions { display: flex; align-items: center; gap: var(--space-6); }
.divider { width: 1px; height: 24px; background: var(--border); }

.user-menu { display: flex; align-items: center; gap: var(--space-6); }
.user-info {
    display: flex; flex-direction: column; align-items: flex-end;
    .user-name { font-size: 0.875rem; font-weight: 600; color: var(--text-main); }
    .company-tag { font-size: 0.75rem; color: var(--text-muted); }
}

.logout-btn { width: 36px; height: 36px; padding: 0; }
.login-btn { padding: 0.625rem 1.25rem; text-decoration: none; }

@media (max-width: 768px) {
    .user-info { display: none; }
}
</style>