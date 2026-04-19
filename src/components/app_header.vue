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
