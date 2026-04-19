<template>
  <div class="users-page fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1>User Management</h1>
        <p>Manage access and permissions for your team.</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        <UserPlus :size="20" />
        <span>Add New User</span>
      </button>
    </div>

    <!-- Stats Section -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon-box accent">
          <Users :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Total Users</span>
          <span class="value">{{ users.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-box primary">
          <ShieldCheck :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Admins</span>
          <span class="value">{{ adminCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-box success">
          <UserCheck :size="28" />
        </div>
        <div class="stat-info">
          <span class="label">Active Sessions</span>
          <span class="value">{{ activeCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-wrapper">
        <Search class="search-icon" :size="20" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search users..." 
          @input="handleSearch"
        />
      </div>
      <button @click="fetchUsers" class="btn-ghost" :disabled="loading" title="Refresh">
        <RefreshCw :class="{ 'spinning': loading }" :size="20" />
      </button>
    </div>

    <!-- Users Table -->
    <div class="table-wrapper">
      <table v-if="users.length > 0" class="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th style="text-align: right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.userId">
            <td>
              <div class="user-row-info">
                <div class="avatar">
                  {{ user.name?.charAt(0) || 'U' }}
                </div>
                <div class="details">
                  <span class="name">{{ user.name }}</span>
                  <span class="email">{{ user.email }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="badge-group">
                <span 
                  v-for="role in user.permissions" 
                  :key="role" 
                  class="badge"
                  :class="role"
                >
                  {{ role }}
                </span>
              </div>
            </td>
            <td>
              <span class="status-pill" :class="user.status.toLowerCase()">
                {{ user.status }}
              </span>
            </td>
            <td>
              <span class="date-text">{{ formatDate(user.createdAt) }}</span>
            </td>
            <td>
              <div class="row-actions">
                <button @click="editUser(user)" class="btn-ghost edit" title="Edit User">
                  <Edit2 :size="16" />
                </button>
                <button @click="confirmDelete(user)" class="btn-ghost delete" title="Delete User">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else-if="loading" class="empty-state">
        <RefreshCw class="spinning" :size="32" />
        <p style="margin-top: 1rem">Loading organization users...</p>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <UserX :size="48" />
        </div>
        <h3>No users found</h3>
        <p>Try adjusting your search or add a new team member.</p>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showAddModal || editingUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-content">
            <h2>{{ editingUser ? 'Edit User' : 'Add New User' }}</h2>
            <p v-if="!editingUser">Fill in the details to add a new team member.</p>
          </div>
          <button @click="closeModal" class="btn-ghost"><X :size="20" /></button>
        </div>
        
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>Full Name</label>
            <div class="input-wrapper has-icon">
              <User :size="18" class="input-icon" />
              <input v-model="form.name" type="text" required />
            </div>
          </div>
          
          <div class="form-group">
            <label>Email Address</label>
            <div class="input-wrapper has-icon">
              <Mail :size="18" class="input-icon" />
              <input v-model="form.email" type="email" :disabled="!!editingUser" required />
            </div>
            <p v-if="editingUser" class="input-hint">Email address cannot be changed.</p>
          </div>
          
          <div class="form-group">
            <label>Access Permissions</label>
            <div class="pill-selection-grid">
              <div 
                v-for="role in availablePermissions" 
                :key="role" 
                class="selection-pill"
                :class="{ 'active': form.permissions.includes(role) }"
                @click="togglePermission(role)"
              >
                <component :is="getRoleIcon(role)" :size="16" />
                <span>{{ role }}</span>
                <Check v-if="form.permissions.includes(role)" :size="14" />
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Discard</button>
            <button type="submit" class="btn-primary" :disabled="formLoading">
              <span v-if="!formLoading">{{ editingUser ? 'Update User' : 'Send Invite' }}</span>
              <RefreshCw v-else class="spinning" :size="18" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import { useAppStore } from '@/stores/app';
import { 
  UserPlus, Users, ShieldCheck, UserCheck, Search, 
  RefreshCw, Edit2, Trash2, X, UserX, User, Mail,
  Shield, Code, Headphones, Check, Layout
} from 'lucide-vue-next';

const appStore = useAppStore();

const users = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const showAddModal = ref(false);
const editingUser = ref(null);
const userToDelete = ref(null);
const formLoading = ref(false);

const form = ref({
  name: '',
  email: '',
  permissions: ['user']
});

const availablePermissions = computed(() => appStore.permissions);

const getRoleIcon = (role) => {
  switch (role.toLowerCase()) {
    case 'admin': return Shield;
    case 'developer': return Code;
    case 'support': return Headphones;
    default: return Layout;
  }
};

const togglePermission = (role) => {
  const index = form.value.permissions.indexOf(role);
  if (index > -1) {
    if (form.value.permissions.length > 1) {
      form.value.permissions.splice(index, 1);
    }
  } else {
    form.value.permissions.push(role);
  }
};

const adminCount = computed(() => users.value.filter(u => u.permissions.includes('admin')).length);
const activeCount = computed(() => users.value.filter(u => u.status === 'ACTIVE').length);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/users', {
      params: { search: searchQuery.value }
    });
    users.value = res.data.users || [];
  } catch (err) {
    console.error('Failed to fetch users:', err);
  } finally {
    loading.value = false;
  }
};

let searchTimeout;
const handleSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchUsers, 300);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const editUser = (user) => {
  editingUser.value = user;
  form.value = {
    name: user.name,
    email: user.email,
    permissions: [...user.permissions]
  };
};

const closeModal = () => {
  showAddModal.value = false;
  editingUser.value = null;
  form.value = { name: '', email: '', permissions: ['user'] };
};

const saveUser = async () => {
  formLoading.value = true;
  try {
    if (editingUser.value) {
      await api.patch(`/users/${editingUser.value.userId}`, {
        name: form.value.name,
        permissions: form.value.permissions
      });
    } else {
      await api.post('/users', form.value);
    }
    await fetchUsers();
    closeModal();
  } catch (err) {
    console.error('Failed to save user:', err);
    alert(err.response?.data?.message || 'Error saving user');
  } finally {
    formLoading.value = false;
  }
};

onMounted(fetchUsers);
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);

  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
  }
  p { color: var(--text-muted); margin: var(--space-1) 0 0; }
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  gap: var(--space-4);

  .search-wrapper {
    position: relative;
    flex: 1;
    max-width: 400px;
    .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-main);
      &:focus { outline: none; border-color: var(--primary); }
    }
  }
}

.user-row-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  .avatar {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-radius: 50%; @include flex-center; font-weight: 700; color: #000;
  }
  .details {
    display: flex; flex-direction: column;
    .name { font-weight: 600; color: var(--text-main); }
    .email { font-size: 0.8125rem; color: var(--text-muted); }
  }
}

.badge-group { display: flex; gap: var(--space-2); }
.date-text { font-size: 0.875rem; color: var(--text-muted); }

.row-actions {
  display: flex; gap: var(--space-2); justify-content: flex-end;
  .btn-ghost {
    &:hover.edit { color: var(--primary); border-color: var(--primary); }
    &:hover.delete { color: var(--danger); border-color: var(--danger); }
  }
}

.pill-selection-grid {
  display: flex; flex-wrap: wrap; gap: var(--space-3);
  .selection-pill {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 1rem; background: rgba(255,255,255,0.03);
    border: 1px solid var(--border); border-radius: 100px;
    cursor: pointer; transition: all var(--transition-fast);
    font-size: 0.875rem; color: var(--text-muted);
    
    &:hover { background: rgba(255,255,255,0.06); border-color: var(--border-bright); color: var(--text-main); }
    &.active { background: rgba(56, 189, 248, 0.1); border-color: var(--primary); color: var(--text-main); }
  }
}
</style>
