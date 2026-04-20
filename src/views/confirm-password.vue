<template>
  <div class="login-page">
    <div class="modal-card login-card">
      <div class="login-header">
        <div class="brand">
          <div class="logo-box">G</div>
          <span class="brand-text">GAME<span>AROUND</span></span>
        </div>
        <h1>Set New Password</h1>
        <p>A new password is required for your account.</p>
      </div>

      <form @submit.prevent="handleConfirmPassword" class="login-form">
        <div class="form-group">
          <label for="new-password">New Password</label>
          <div class="input-wrapper has-icon">
            <Lock class="input-icon" :size="20" />
            <input 
              v-model="newPassword" 
              type="password" 
              id="new-password" 
              required 
              :disabled="loading"
              autofocus
              placeholder="Enter your new password"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="confirm-new-password">Confirm Password</label>
          <div class="input-wrapper has-icon">
            <Lock class="input-icon" :size="20" />
            <input 
              v-model="confirmNewPassword" 
              type="password" 
              id="confirm-new-password" 
              required
              :disabled="loading"
              placeholder="Re-enter your new password"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          <AlertCircle :size="18" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="btn-primary login-btn" :disabled="loading">
          <span v-if="loading">Updating password...</span>
          <span v-else>Update & Sign In</span>
          <RefreshCw v-if="loading" class="spinning" :size="20" />
          <ArrowRight v-else :size="20" />
        </button>

        <div class="form-footer mt-4 text-center">
            <router-link :to="{ name: 'login' }" class="text-muted hover:text-primary transition-colors">
                Back to Login
            </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { confirmSignIn } from 'aws-amplify/auth';
import { useAuthStore } from '@/stores/auth';
import { Lock, AlertCircle, ArrowRight, RefreshCw } from 'lucide-vue-next';

export default {
  name: 'ConfirmPasswordView',
  components: {
    Lock,
    AlertCircle,
    ArrowRight,
    RefreshCw
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      newPassword: '',
      confirmNewPassword: '',
      error: '',
      loading: false
    };
  },
  methods: {
    async handleConfirmPassword() {
      if (this.newPassword !== this.confirmNewPassword) {
        this.error = 'Passwords do not match.';
        return;
      }

      if (this.newPassword.length < 8) {
        this.error = 'Password must be at least 8 characters long.';
        return;
      }

      this.loading = true;
      this.error = '';
      
      try {
        const result = await confirmSignIn({
          challengeResponse: this.newPassword
        });

        if (result.isSignedIn) {
          await this.authStore.checkAuth();
          this.$router.push({ name: 'home' });
        } else {
          // This case might happen if multiple steps are required
          console.log('Next step required:', result.nextStep);
          this.error = 'Additional authentication steps are required.';
        }
      } catch (err) {
        console.error('Password confirmation error:', err);
        this.error = err.message || 'Failed to update password. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.form-footer {
    margin-top: 1.5rem;
}
.text-center {
    text-align: center;
}
.text-muted {
    color: var(--text-muted);
}
.mt-4 {
    margin-top: 1rem;
}
</style>
