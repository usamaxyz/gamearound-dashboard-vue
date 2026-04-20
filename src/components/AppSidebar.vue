<script>
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
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

export default {
  name: 'AppSidebar',
  components: {
    LayoutDashboard,
    Users,
    Building2,
    Settings,
    ChevronDown,
    ChevronRight,
    Gamepad2,
    Info,
    LogOut
  },
  props: {
    isOpen: Boolean
  },
  setup() {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    return { authStore, appStore };
  },
  data() {
    return {
      expandedGroups: ['Management']
    };
  },
  computed: {
    filteredNavigation() {
      return [
        { 
          name: 'Dashboard', 
          to: { name: 'home' }, 
          icon: 'LayoutDashboard' 
        },
        {
          name: 'Management',
          icon: 'Building2',
          children: [
            { 
              name: 'Users', 
              to: { name: 'users' }, 
              icon: 'Users',
              show: this.authStore.hasPermission('manage_users')
            },
            { name: 'Companies', to: '/settings', icon: 'Building2', show: true },
          ].filter(child => child.show !== false)
        },
        { 
          name: 'Games', 
          to: '/games', 
          icon: 'Gamepad2' 
        },
      ];
    }
  },
  methods: {
    toggleGroup(groupName) {
      const index = this.expandedGroups.indexOf(groupName);
      if (index > -1) {
        this.expandedGroups.splice(index, 1);
      } else {
        this.expandedGroups.push(groupName);
      }
    },
    isGroupExpanded(groupName) {
      return this.expandedGroups.includes(groupName);
    },
    isChildActive(children) {
      return children.some(child => {
        if (typeof child.to === 'string') return this.$route.path === child.to;
        return this.$route.name === child.to.name;
      });
    }
  }
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
      <div v-for="item in filteredNavigation" :key="item.name" class="nav-group">
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
              :is="isGroupExpanded(item.name) ? 'ChevronDown' : 'ChevronRight'" 
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
      <div v-if="isOpen" class="sidebar-user-profile">
        <div class="avatar">
          {{ authStore.name ? authStore.name.charAt(0).toUpperCase() : 'U' }}
        </div>
        <div class="user-details">
          <p class="user-name">{{ authStore.name }}</p>
          <p class="company-name">{{ authStore.companyName }}</p>
          <p class="user-email">{{ authStore.email }}</p>
        </div>
      </div>
      
      <div v-if="isOpen" class="app-version">
        Version {{ appStore.version }}
      </div>
    </div>
  </aside>
</template>


