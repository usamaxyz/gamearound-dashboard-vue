<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <p class="copyright">© 2026 Gamearound, Inc. All rights reserved.</p>
      </div>
      
      <div class="footer-center">
        <img src="@/assets/images/logo.svg" alt="logo" class="footer-logo">
      </div>
      
      <div class="footer-right">
        <ul class="footer-nav">
          <li><router-link :to="{name: 'home'}">Home</router-link></li>
          <li><router-link :to="{name: 'about'}">About</router-link></li>
          <li><a href="#">Support</a></li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.app-footer {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 1px solid var(--border);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.footer-logo {
  width: 32px;
  height: 32px;
  opacity: 0.5;
  filter: grayscale(1);
}

.footer-nav {
  list-style: none;
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: 0;

  a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-main);
    }
  }
}
</style>