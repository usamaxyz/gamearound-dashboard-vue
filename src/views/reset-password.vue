<template>
  <div class="login-page">
    <div class="modal-card login-card">
      <div class="login-header">
        <div class="brand">
          <div class="logo-box">G</div>
          <span class="brand-text">GAME<span>AROUND</span></span>
        </div>
        <h1>Reset Password</h1>
        <p>Enter the code sent to your email and your new password.</p>
      </div>

      <div v-if="success" class="success-message-container">
        <div class="success-icon-box">
          <CheckCircle :size="48" />
        </div>
        <h3>Password Reset Successful</h3>
        <p>Your password has been updated. You can now sign in with your new password.</p>
        <router-link :to="{ name: 'login' }" class="btn-primary mt-4 w-full">
          Go to Login
          <ArrowRight :size="20" />
        </router-link>
      </div>

      <form v-else @submit.prevent="handleResetPassword" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper has-icon">
            <Mail class="input-icon" :size="20" />
            <input 
              v-model="email" 
              type="email" 
              id="email" 
              required 
              :disabled="loading"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="code">Verification Code</label>
          <div class="input-wrapper has-icon">
            <Hash class="input-icon" :size="20" />
            <input 
              v-model="code" 
              type="text" 
              id="code" 
              required 
              :disabled="loading"
              autofocus
              placeholder="Enter 6-digit code"
            />
          </div>
        </div>

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
              placeholder="Min. 8 characters"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm New Password</label>
          <div class="input-wrapper has-icon">
            <Lock class="input-icon" :size="20" />
            <input 
              v-model="confirmPassword" 
              type="password" 
              id="confirm-password" 
              required 
              :disabled="loading"
              placeholder="Repeat new password"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          <AlertCircle :size="18" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="btn-primary login-btn" :disabled="loading">
          <span v-if="loading">Resetting password...</span>
          <span v-else>Update Password</span>
          <RefreshCw v-if="loading" class="spinning" :size="20" />
          <KeyRound v-else :size="20" />
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
import { confirmResetPassword } from 'aws-amplify/auth';
import { Mail, Lock, Hash, AlertCircle, RefreshCw, KeyRound, CheckCircle, ArrowRight } from 'lucide-vue-next';

export default {
  name: 'ResetPasswordView',
  components: {
    Mail,
    Lock,
    Hash,
    AlertCircle,
    RefreshCw,
    KeyRound,
    CheckCircle,
    ArrowRight
  },
  data() {
    return {
      email: this.$route.query.email || '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      error: '',
      loading: false,
      success: false
    };
  },
  methods: {
    async handleResetPassword() {
      if (this.newPassword !== this.confirmPassword) {
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
        await confirmResetPassword({
          username: this.email,
          confirmationCode: this.code,
          newPassword: this.newPassword
        });
        this.success = true;
      } catch (err) {
        console.error('Reset password error:', err);
        this.error = err.message || 'Failed to reset password. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.success-message-container {
  text-align: center;
  padding: 1rem 0;
}

.success-icon-box {
  color: var(--success);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.success-message-container h3 {
  color: var(--text-main);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.success-message-container p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 1rem;
}

.form-footer {
    margin-top: 1.5rem;
}

.text-center {
    text-align: center;
}

.text-muted {
    color: var(--text-muted);
}
</style>
