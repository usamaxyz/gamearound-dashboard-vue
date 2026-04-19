<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="brand">
          <div class="logo-box">G</div>
          <span class="brand-text">GAME<span>AROUND</span></span>
        </div>
        <p>Sign in to your Gamearound account</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper">
            <Mail class="icon" :size="20" />
            <input 
              v-model="email" 
              type="email" 
              id="email" 
              required 
              :disabled="loading"
              autofocus
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <Lock class="icon" :size="20" />
            <input 
              v-model="password" 
              type="password" 
              id="password" 
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          <AlertCircle :size="18" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
          <ArrowRight v-if="!loading" :size="20" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn } from 'aws-amplify/auth';
import { useAuthStore } from '@/stores/auth';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;

  error.value = '';
  
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email.value,
      password: password.value,
    });

    if (isSignedIn) {
      await authStore.checkAuth();
        router.push({ name: 'home' });
    } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        error.value = 'New password required. Please reset your password.';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = err.message || 'Failed to sign in. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  @include premium-modal;
  width: 100%;
  max-width: 500px;
  padding: 3rem;
  background: var(--bg-surface);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;

  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;

    .logo-box {
      width: 48px;
      height: 48px;
      background: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: var(--bg-deep);
      font-size: 1.5rem;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--primary);
      
      span {
        color: var(--text-main);
      }
    }
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 0.5rem;
    letter-spacing: -0.5px;
  }

  p {
    color: var(--text-muted);
    font-size: 0.95rem;
  }
}

.login-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    .icon {
      position: absolute;
      left: 1rem;
      color: var(--text-dim);
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 2.75rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: 0.9375rem;
      transition: all var(--transition-fast);

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px var(--primary-glow);
      }
    }
  }
}

.error-message {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 44, 44, 0.1);
  border: 1px solid rgba(239, 44, 44, 0.2);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: var(--primary);
  color: #000;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--primary-deep);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--primary-glow);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
