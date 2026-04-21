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
          placeholder="Search..."
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
                <button 
                  @click="editUser(user)" 
                  class="btn-ghost edit" 
                  title="Edit User"
                  :disabled="!canModifyUser(user)"
                >
                  <Edit2 :size="16" />
                </button>
                <button 
                  @click="confirmDelete(user)" 
                  class="btn-ghost delete" 
                  title="Delete User"
                  :disabled="!canModifyUser(user)"
                >
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
    <Teleport to="body">
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
            
            <div class="form-group" v-if="editingUser">
              <label>Account Status</label>
              <div class="status-toggle-wrapper" @click="form.status = form.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'">
                <div class="toggle-track" :class="{ 'active': form.status === 'ACTIVE' }">
                  <div class="toggle-thumb"></div>
                </div>
                <span class="status-label">{{ form.status === 'ACTIVE' ? 'Active' : 'Inactive' }}</span>
              </div>
              <p class="input-hint">Inactive users cannot log into the platform.</p>
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
    </Teleport>
    
    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="userToDelete" class="modal-overlay danger" @click.self="userToDelete = null">
        <div class="modal-card danger">
          <div class="modal-header">
            <div class="header-content">
              <h2>Delete User</h2>
              <p>Are you sure you want to delete <strong>{{ userToDelete.name }}</strong>? This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="userToDelete = null" class="btn-secondary">Cancel</button>
            <button @click="handleDelete" class="btn-danger" :disabled="formLoading">
              <span v-if="!formLoading">Delete Permanently</span>
              <RefreshCw v-else class="spinning" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import api from '@/services/api';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { 
  UserPlus, Users, ShieldCheck, UserCheck, Search, 
  RefreshCw, Edit2, Trash2, X, UserX, User, Mail,
  Shield, Code, Headphones, Check, Layout
} from 'lucide-vue-next';

export default {
  name: 'UsersView',
  components: {
    UserPlus, Users, ShieldCheck, UserCheck, Search, 
    RefreshCw, Edit2, Trash2, X, UserX, User, Mail,
    Shield, Code, Headphones, Check, Layout
  },
  setup() {
    const appStore = useAppStore();
    const authStore = useAuthStore();
    return { appStore, authStore };
  },
  data() {
    return {
      users: [],
      loading: false,
      searchQuery: '',
      showAddModal: false,
      editingUser: null,
      userToDelete: null,
      formLoading: false,
      form: {
        name: '',
        email: '',
        permissions: [],
        status: 'ACTIVE'
      },
      searchTimeout: null
    };
  },
  computed: {
    availablePermissions() {
      return this.appStore.permissions;
    },
    adminCount() {
      return this.users.filter(u => u.permissions.includes('admin')).length;
    },
    activeCount() {
      return this.users.filter(u => u.status === 'ACTIVE').length;
    }
  },
  methods: {
    getRoleIcon(role) {
      switch (role.toLowerCase()) {
        case 'admin': return 'Shield';
        case 'manage_users': return 'Users';
        case 'manage_games': return 'Gamepad2';
        default: return 'Layout';
      }
    },
    canModifyUser(targetUser) {
      // Rule: Users with manage_users but without admin cannot modify admin users.
      // 1. If current user is admin, they can modify anyone (except maybe themselves depending on other rules, but here it's about roles)
      const currentUserIsAdmin = this.authStore.hasPermission('admin');
      if (currentUserIsAdmin) return true;

      // 2. If current user is NOT admin but has manage_users
      const targetIsAdmin = targetUser.permissions?.includes('admin');
      
      // If target is admin and current user is not, they cannot modify
      if (targetIsAdmin) return false;

      // Otherwise, they can modify (assuming they have manage_users, which is required to see this page)
      return true;
    },
    togglePermission(role) {
      const index = this.form.permissions.indexOf(role);
      if (index > -1) {
        if (this.form.permissions.length > 1) {
          this.form.permissions.splice(index, 1);
        }
      } else {
        this.form.permissions.push(role);
      }
    },
    async fetchUsers() {
      this.loading = true;
      try {
        const res = await api.get('/users', {
          params: { search: this.searchQuery }
        });
        this.users = res.data.users || [];
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(this.fetchUsers, 300);
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    },
    editUser(user) {
      this.editingUser = user;
      this.form = {
        name: user.name,
        email: user.email,
        permissions: [...user.permissions],
        status: user.status
      };
    },
    closeModal() {
      this.showAddModal = false;
      this.editingUser = null;
      this.form = { name: '', email: '', permissions: [], status: 'ACTIVE' };
    },
    confirmDelete(user) {
      this.userToDelete = user;
    },
    async handleDelete() {
      if (!this.userToDelete) return;
      this.formLoading = true;
      try {
        await api.delete(`/users/${this.userToDelete.userId}`);
        await this.fetchUsers();
        this.userToDelete = null;
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert(err.response?.data?.message || 'Error deleting user');
      } finally {
        this.formLoading = false;
      }
    },
    async saveUser() {
      this.formLoading = true;
      try {
        if (this.editingUser) {
          await api.patch(`/users/${this.editingUser.userId}`, {
            name: this.form.name,
            permissions: this.form.permissions,
            status: this.form.status
          });
        } else {
          await api.post('/users', this.form);
        }
        await this.fetchUsers();
        this.closeModal();
      } catch (err) {
        console.error('Failed to save user:', err);
        alert(err.response?.data?.message || 'Error saving user');
      } finally {
        this.formLoading = false;
      }
    }
  },
  mounted() {
    this.fetchUsers();
  }
};
</script>