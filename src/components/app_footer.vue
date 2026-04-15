<template>
  <div class="container">
    <footer class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top"><p
        class="col-md-4 mb-0 text-body-secondary">© 2026 Gamearound, Inc</p>

<!--      <router-link :to="{name: 'home'}"-->
<!--                   class="col-md-4 d-flex align-items-center justify-content-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">-->
<!--        <img src="@/assets/images/logo.svg" alt="logo" width="40" height="32" class="d-inline-block align-text-top">-->
<!--      </router-link>-->
      <div
          class="col-md-4 d-flex align-items-center justify-content-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
        <img src="@/assets/images/logo.svg" alt="logo" width="40" height="40" class="d-inline-block align-text-top">
      </div>
      <ul class="nav col-md-4 justify-content-end">
        <li class="nav-item">
          <router-link :to="{name: 'home'}" class="nav-link px-2 text-body-secondary">Home</router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{name: 'about'}" class="nav-link px-2 text-body-secondary">About</router-link>
        </li>
      </ul>
    </footer>
  </div>
</template>

<script>
export default {}
</script>