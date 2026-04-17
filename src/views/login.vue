<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/images/logo.svg" alt="logo" class="logo" />
        <h1>Welcome Back</h1>
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
              placeholder="name@company.com" 
              required 
              :disabled="loading"
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
              placeholder="••••••••" 
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
  min-height: calc(100vh - 150px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  @include premium-card;
  width: 100%;
  max-width: 450px;
  padding: 3rem;
  background: var(--bg-surface);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;

  .logo {
    width: 48px;
    height: 48px;
    margin-bottom: 1.5rem;
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
      color: var(--text-main);
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    .icon {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      background: var(--bg-deep);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: 1rem;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px var(--primary-glow);
      }

      &::placeholder {
        color: var(--text-muted);
        opacity: 0.5;
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
  color: #ef4444;
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
    background: #7dd3fc;
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
