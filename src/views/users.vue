<template>
  <div class="users-page">
    <div class="page-header">
      <div class="header-content">
        <h1>User Management</h1>
        <p>Manage access and permissions for your team.</p>
      </div>
      <button @click="showAddModal = true" class="add-btn">
        <UserPlus :size="20" />
        <span>Add New User</span>
      </button>
    </div>

    <!-- Stats Section -->
    <div class="stats-grid">
      <div class="stat-card">
        <Users class="icon purple" :size="24" />
        <div class="stat-info">
          <span class="label">Total Users</span>
          <span class="value">{{ users.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <ShieldCheck class="icon blue" :size="24" />
        <div class="stat-info">
          <span class="label">Admins</span>
          <span class="value">{{ adminCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <UserCheck class="icon green" :size="24" />
        <div class="stat-info">
          <span class="label">Active Sessions</span>
          <span class="value">{{ activeCount }}</span>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="filters-bar">
      <div class="search-wrapper">
        <Search class="search-icon" :size="20" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search items..." 
          @input="handleSearch"
        />
      </div>
      <div class="actions">
        <button @click="fetchUsers" class="refresh-btn" :disabled="loading">
          <RefreshCw :class="{ 'spinning': loading }" :size="20" />
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <table v-if="users.length > 0">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.userId">
            <td>
              <div class="user-info">
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
              <div class="role-badges">
                <span 
                  v-for="role in user.permissions" 
                  :key="role" 
                  class="role-badge"
                  :class="role"
                >
                  {{ role }}
                </span>
              </div>
            </td>
            <td>
              <span class="status-indicator" :class="user.status.toLowerCase()">
                {{ user.status }}
              </span>
            </td>
            <td>
              <span class="date">{{ formatDate(user.createdAt) }}</span>
            </td>
            <td>
              <div class="row-actions">
                <button @click="editUser(user)" class="action-btn edit" title="Edit User">
                  <Edit2 :size="16" />
                </button>
                <button @click="confirmDelete(user)" class="action-btn delete" title="Delete User">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else-if="loading" class="empty-state">
        <p>Loading users...</p>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <UserX :size="48" />
        </div>
        <h3>No users found</h3>
        <p>Try adjusting your search or add a new team member.</p>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showAddModal || editingUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Edit User' : 'Add New User' }}</h2>
          <button @click="closeModal" class="close-btn"><X :size="24" /></button>
        </div>
        
        <form @submit.prevent="saveUser" class="modal-form">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.name" type="text" placeholder="John Doe" required />
          </div>
          
          <div class="form-group">
            <label>Email Address</label>
            <input v-model="form.email" type="email" placeholder="john@company.com" :disabled="!!editingUser" required />
          </div>
          
          <div class="form-group">
            <label>Permissions</label>
            <div class="permissions-grid">
              <label v-for="role in availablePermissions" :key="role" class="checkbox-label">
                <input type="checkbox" :value="role" v-model="form.permissions" />
                <span>{{ role.charAt(0).toUpperCase() + role.slice(1) }}</span>
              </label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn" :disabled="formLoading">
              {{ formLoading ? 'Saving...' : (editingUser ? 'Save Changes' : 'Invite User') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="userToDelete" class="modal-overlay" @click.self="userToDelete = null">
      <div class="modal-card mini">
        <h3>Delete User?</h3>
        <p>Are you sure you want to remove <strong>{{ userToDelete.name }}</strong>? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="userToDelete = null" class="cancel-btn">Cancel</button>
          <button @click="handleDelete" class="delete-btn" :disabled="formLoading">Delete</button>
        </div>
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
  RefreshCw, Edit2, Trash2, X, UserX 
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
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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

const confirmDelete = (user) => {
  userToDelete.value = user;
};

const handleDelete = async () => {
  formLoading.value = true;
  try {
    await api.delete(`/users/${userToDelete.value.userId}`);
    await fetchUsers();
    userToDelete.value = null;
  } catch (err) {
     console.error('Failed to delete user:', err);
     alert(err.response?.data?.message || 'Error deleting user');
  } finally {
    formLoading.value = false;
  }
};

onMounted(fetchUsers);
</script>

<style lang="scss" scoped>
.users-page {
  animation: fadeIn 0.5s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 0.25rem;
  }

  p {
    color: var(--text-muted);
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: var(--primary);
    color: #000;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #7dd3fc;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--primary-glow);
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  @include premium-card;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;

  .icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);

    &.purple { color: #a855f7; }
    &.blue { color: #3b82f6; }
    &.green { color: #10b981; }
  }

  .stat-info {
    display: flex;
    flex-direction: column;

    .label {
      color: var(--text-muted);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }
  }
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  .search-wrapper {
    position: relative;
    flex: 1;
    max-width: 400px;

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-main);
      
      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }
  }

  .refresh-btn {
    padding: 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: var(--primary);
      border-color: var(--primary);
    }

    .spinning {
      animation: spin 1s linear infinite;
    }
  }
}

.table-container {
  @include premium-card;
  background: var(--bg-surface);
  overflow: hidden;

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;

    th {
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-main);
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;

  .avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #000;
  }

  .details {
    display: flex;
    flex-direction: column;

    .name {
      font-weight: 600;
      color: var(--text-main);
    }

    .email {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  }
}

.role-badges {
  display: flex;
  gap: 0.5rem;
}

.role-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
  
  &.admin { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
  &.user { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }
  &.developer { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
  &.support { background: rgba(16, 185, 129, 0.1); color: #10b981; }
}

.status-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.active {
    color: #10b981;
    &::before { background: #10b981; box-shadow: 0 0 8px #10b981; }
  }

  &.inactive {
    color: var(--text-muted);
    &::before { background: var(--text-muted); }
  }
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;

  .action-btn {
    padding: 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      &.edit { color: var(--primary); border-color: var(--primary); }
      &.delete { color: #ef4444; border-color: #ef4444; }
    }
  }
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-card {
  @include premium-card;
  background: var(--bg-surface);
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  
  &.mini {
    max-width: 400px;
    text-align: center;
    p { color: var(--text-muted); margin-bottom: 2rem; }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
  }
}

.modal-form {
  .form-group {
    margin-bottom: 1.5rem;
    label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-deep);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-main);
      &:focus { outline: none; border-color: var(--primary); }
    }
  }
}

.permissions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-deep);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-muted);

    input { width: auto !important; cursor: pointer; }
    &:hover { color: var(--text-main); }
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  button {
    flex: 1;
    padding: 0.875rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); color: var(--text-main); }
  .save-btn { background: var(--primary); border: none; color: #000; }
  .delete-btn { background: #ef4444; border: none; color: #fff; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
