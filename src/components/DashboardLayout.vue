<script setup>
import { ref } from 'vue'
import Sidebar from './AppSidebar.vue'
import Topbar from './AppTopbar.vue'

const isSidebarOpen = ref(true)
</script>

<template>
  <div class="dashboard-shell">
    <Sidebar :is-open="isSidebarOpen" />
    
    <main class="main-content">
      <Topbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
