<template>
  <div class="login-page">
    <div class="modal-card login-card">
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
          <div class="input-wrapper has-icon">
            <Mail class="input-icon" :size="20" />
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
          <div class="input-wrapper has-icon">
            <Lock class="input-icon" :size="20" />
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

        <button type="submit" class="btn-primary login-btn" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
          <RefreshCw v-if="loading" class="spinning" :size="20" />
          <ArrowRight v-else :size="20" />
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
import { Mail, Lock, AlertCircle, ArrowRight, RefreshCw } from 'lucide-vue-next';

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
  background: var(--bg-deep);
}

.login-card {
  width: 100%;
  max-width: 500px;
  padding: 4rem;
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
      width: 56px;
      height: 56px;
      background: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: var(--bg-deep);
      font-size: 1.75rem;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-text {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--primary);
      
      span {
        color: var(--text-main);
      }
    }
  }

  p {
    color: var(--text-muted);
    font-size: 1.1rem;
  }
}

.login-btn {
  width: 100%;
  margin-top: 1rem;
}

.error-message {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(239, 44, 44, 0.1);
  border: 1px solid rgba(239, 44, 44, 0.2);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease;
}
</style>
