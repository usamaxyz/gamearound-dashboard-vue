<template>
  <nav class="topbar">
    <div class="topbar-left">
      <router-link :to="{name: 'home'}" class="brand">
        <img src="@/assets/images/logo.svg" alt="logo" class="logo">
        <span class="brand-name">{{ appStore.app_name }}</span>
      </router-link>
      
      <div v-if="authStore.isAuthenticated" class="nav-links">
        <router-link :to="{name: 'home'}" class="nav-link">Dashboard</router-link>
        <router-link :to="{name: 'users'}" class="nav-link">Users</router-link>
      </div>
    </div>

    <div class="topbar-right">
      <div v-if="authStore.isAuthenticated" class="user-menu">
        <div class="user-info">
          <span class="user-name">{{ authStore.email }}</span>
          <span class="company-tag">{{ authStore.companyId ? 'ID: ' + authStore.companyId.slice(0, 8) : 'Admin' }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn" title="Logout">
          <LogOut :size="20" />
        </button>
      </div>
      <div v-else>
        <router-link :to="{name: 'login'}" class="btn-login">Sign In</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { LogOut } from 'lucide-vue-next';

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

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
    padding: 0 2rem;
    @include glass;
    border-top: none;
    border-left: none;
    border-right: none;
    z-index: 50;
    position: sticky;
    top: 0;
}

.topbar-left {
    display: flex;
    align-items: center;
    gap: 3rem;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    
    .logo {
        width: 32px;
        height: 32px;
    }
    
    .brand-name {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text-main);
        letter-spacing: -0.5px;
    }
}

.nav-links {
    display: flex;
    gap: 1.5rem;
    
    .nav-link {
        color: var(--text-muted);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9375rem;
        transition: color 0.2s ease;
        
        &:hover, &.router-link-active {
            color: var(--primary);
        }
    }
}

.topbar-right {
    display: flex;
    align-items: center;
}

.user-menu {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-left: 1.5rem;
    border-left: 1px solid var(--border);
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    
    .user-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-main);
    }
    
    .company-tag {
        font-size: 0.75rem;
        color: var(--text-muted);
    }
}

.logout-btn {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        color: #ef4444;
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }
}

.btn-login {
    padding: 0.625rem 1.25rem;
    background: var(--primary);
    color: #000;
    text-decoration: none;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    
    &:hover {
        background: #7dd3fc;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--primary-glow);
    }
}
</style>