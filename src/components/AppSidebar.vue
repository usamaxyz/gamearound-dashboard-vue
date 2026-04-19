<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from "@/stores/auth";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Gamepad2,
  Info,
  LogOut
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean
});

const route = useRoute();
const authStore = useAuthStore();

const navigation = [
  { 
    name: 'Dashboard', 
    to: { name: 'home' }, 
    icon: LayoutDashboard 
  },
  {
    name: 'Management',
    icon: Building2,
    children: [
      { name: 'Users', to: { name: 'users' }, icon: Users },
      { name: 'Companies', to: '/settings', icon: Building2 },
    ]
  },
  { 
    name: 'Games', 
    to: '/games', 
    icon: Gamepad2 
  },
  {
    name: 'Support',
    icon: Info,
    children: [
      { name: 'About', to: { name: 'about' }, icon: Info },
    ]
  }
];

// Keep track of which groups are expanded
const expandedGroups = ref(['Management']);

const toggleGroup = (groupName) => {
  const index = expandedGroups.value.indexOf(groupName);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(groupName);
  }
};

const isGroupExpanded = (groupName) => expandedGroups.value.includes(groupName);

const isChildActive = (children) => {
  return children.some(child => {
      if (typeof child.to === 'string') return route.path === child.to;
      return route.name === child.to.name;
  });
};
</script>

<template>
  <aside class="sidebar" :class="{ 'collapsed': !isOpen }">
    <div class="sidebar-header">
      <div class="brand">
        <div class="logo-box">G</div>
        <span v-if="isOpen" class="brand-text">GAME<span>AROUND</span></span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div v-for="item in navigation" :key="item.name" class="nav-group">
        <!-- Single Item -->
        <router-link 
          v-if="!item.children" 
          :to="item.to" 
          class="nav-link"
          active-class="active"
        >
          <component :is="item.icon" class="icon" :size="20" />
          <span v-if="isOpen" class="link-text">{{ item.name }}</span>
        </router-link>

        <!-- Nested Group -->
        <template v-else>
          <div 
            class="nav-link group-header" 
            :class="{ 'group-active': isChildActive(item.children) }"
            @click="toggleGroup(item.name)"
          >
            <component :is="item.icon" class="icon" :size="20" />
            <span v-if="isOpen" class="link-text">{{ item.name }}</span>
            <component 
              v-if="isOpen"
              :is="isGroupExpanded(item.name) ? ChevronDown : ChevronRight" 
              class="chevron" 
              :size="16" 
            />
          </div>
          
          <div 
            v-if="isOpen && isGroupExpanded(item.name)" 
            class="nav-children"
          >
            <router-link 
              v-for="child in item.children" 
              :key="child.name" 
              :to="child.to" 
              class="nav-link child-link"
              active-class="active"
            >
              <component :is="child.icon" class="icon" :size="18" />
              <span class="link-text">{{ child.name }}</span>
            </router-link>
          </div>
        </template>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="avatar">
          {{ authStore.email?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div v-if="isOpen" class="user-details">
          <p class="user-name">{{ authStore.email?.split('@')[0] }}</p>
          <p class="user-role">{{ authStore.companyId ? 'Client' : 'Administrator' }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  @include glass;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  z-index: 100;
  overflow: hidden;

  &.collapsed {
    width: var(--sidebar-collapsed-width);
    
    .nav-link {
      justify-content: center;
      padding: 0.8rem 0;
      
      .icon {
        margin-right: 0;
      }
    }
  }
}

.sidebar-header {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  .logo-box {
    width: 32px;
    height: 32px;
    background: var(--primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    color: var(--bg-deep);
    font-size: 1.2rem;
    box-shadow: 0 0 15px var(--primary-glow);
  }
  
  .brand-text {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--primary);
    
    span {
      color: var(--text-main);
    }
  }
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0.75rem;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 10px;
  }
}

.nav-group {
  margin-bottom: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  position: relative;
  
  .icon {
    margin-right: 0.875rem;
    transition: color var(--transition-fast);
  }
  
  .link-text {
    font-size: 0.9375rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .chevron {
    margin-left: auto;
    opacity: 0.5;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-main);
  }
  
  &.active {
    background: rgba(56, 189, 248, 0.1);
    color: var(--primary);
    font-weight: 600;
    
    .icon {
      color: var(--primary);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      height: 50%;
      width: 3px;
      background: var(--primary);
      border-radius: 0 4px 4px 0;
      box-shadow: 0 0 10px var(--primary-glow);
    }
  }
}

.group-header {
  &.group-active {
    color: var(--text-main);
    .icon { color: var(--accent); }
  }
}

.nav-children {
  margin-top: 0.25rem;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.child-link {
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  
  &.active::before {
    left: -1.25rem;
  }
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.1);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    @include flex-center;
    font-weight: 700;
    color: var(--bg-deep);
    flex-shrink: 0;
  }
  
  .user-details {
    overflow: hidden;
    
    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-role {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
    }
  }
}
</style>
