<script setup>
defineProps({
  isOpen: Boolean
})
</script>

<template>
  <aside class="sidebar" :class="{ 'collapsed': !isOpen }">
    <div class="sidebar-brand">
      GAME<span style="color: white">AROUND</span>
    </div>

    <ul class="sidebar-nav">
      <li class="nav-item">
        <router-link to="/" class="nav-link" active-class="active">
          <span class="icon">🏠</span>
          <span>Dashboard</span>
        </router-link>
      </li>
      <li class="nav-item">
        <router-link to="/games" class="nav-link" active-class="active">
          <span class="icon">🎮</span>
          <span>Games</span>
        </router-link>
      </li>
      <li class="nav-item">
        <router-link to="/users" class="nav-link" active-class="active">
          <span class="icon">👥</span>
          <span>Users</span>
        </router-link>
      </li>
      <li class="nav-item">
        <router-link to="/settings" class="nav-link" active-class="active">
          <span class="icon">⚙️</span>
          <span>Companies</span>
        </router-link>
      </li>
    </ul>

    <div class="sidebar-footer" style="padding: 1rem; border-top: 1px solid var(--border)">
        <div class="user-pill" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem; border-radius: var(--radius-md); background: rgba(0,0,0,0.2)">
            <div class="avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--bg-deep)">U</div>
            <div class="user-info" style="font-size: 0.8rem">
                <div style="color: var(--text-main); font-weight: 600">Admin User</div>
                <div style="color: var(--text-muted); font-size: 0.7rem">Company UUID...</div>
            </div>
        </div>
    </div>
  </aside>
</template>
