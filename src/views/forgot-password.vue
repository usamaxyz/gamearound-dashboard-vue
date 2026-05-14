<template>
  <div class="login-page">
    <div class="modal-card login-card">
      <div class="login-header">
        <div class="brand">
          <div class="logo-box">G</div>
          <span class="brand-text">GAME<span>AROUND</span></span>
        </div>
        <h1>Forgot Password</h1>
        <p>Enter your email to receive a verification code.</p>
      </div>

      <div v-if="success" class="success-message-container">
        <div class="success-icon-box">
          <CheckCircle :size="48" />
        </div>
        <h3>Check your email</h3>
        <p>A verification code has been sent to <strong>{{ email }}</strong>.</p>
        <button @click="goToReset" class="btn-primary mt-4 w-full">
          Enter Verification Code
          <ArrowRight :size="20" />
        </button>
      </div>

      <form v-else @submit.prevent="handleForgotPassword" class="login-form">
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
              autofocus
              placeholder="Enter your registered email"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          <AlertCircle :size="18" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="btn-primary login-btn" :disabled="loading">
          <span v-if="loading">Sending code...</span>
          <span v-else>Send Reset Code</span>
          <RefreshCw v-if="loading" class="spinning" :size="20" />
          <Send v-else :size="20" />
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
import { resetPassword } from 'aws-amplify/auth';
import { Mail, AlertCircle, RefreshCw, Send, ArrowRight, CheckCircle } from 'lucide-vue-next';

export default {
  name: 'ForgotPasswordView',
  components: {
    Mail,
    AlertCircle,
    RefreshCw,
    Send,
    ArrowRight,
    CheckCircle
  },
  data() {
    return {
      email: '',
      error: '',
      loading: false,
      success: false
    };
  },
  methods: {
    async handleForgotPassword() {
      this.loading = true;
      this.error = '';
      
      try {
        await resetPassword({
          username: this.email
        });
        this.success = true;
      } catch (err) {
        console.error('Forgot password error:', err);
        this.error = err.message || 'Failed to send reset code. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    goToReset() {
      this.$router.push({ 
        name: 'reset-password', 
        query: { email: this.email } 
      });
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
