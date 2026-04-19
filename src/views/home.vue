<template>
  <div class="home-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Welcome back, {{ authStore.name }}</h1>
        <p>Here's what's happening with your games today.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon-box primary">
          <Gamepad2 :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Total Games</span>
          <span class="value">12</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-box success">
          <TrendingUp :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Active Users</span>
          <span class="value">1.2k</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-box accent">
          <Activity :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Growth</span>
          <span class="value">+15%</span>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="empty-state">
        <div class="empty-icon">
          <Layout :size="48" />
        </div>
        <h3>Ready to build?</h3>
        <p>Start by creating a new game or managing your team.</p>
        <div class="modal-actions center">
          <router-link :to="{ name: 'users' }" class="btn-primary">
            Manage Users
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { Gamepad2, TrendingUp, Activity, Layout } from 'lucide-vue-next';

const authStore = useAuthStore();
</script>

<style lang="scss" scoped>
.home-page {
  animation: fadeIn 0.4s ease-out;
}
</style>