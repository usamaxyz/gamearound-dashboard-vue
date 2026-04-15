<template>
  <div class="container">
    <header
        class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-between py-3 mb-5">
      <div class="col-lg-3 mb-2 mb-lg-0">
        <a href="/" class="d-inline-flex link-body-emphasis text-decoration-none">
          <img src="@/assets/images/logo.svg" alt="balloptix">
        </a>
      </div>
      <ul class="nav col-12 col-lg-auto mb-2 justify-content-center mb-lg-0">
        <li><router-link :to="{name: 'home'}" class="nav-link link-secondary px-4">Home</router-link></li>
        <li><router-link :to="{name: 'about'}" class="nav-link link-secondary px-4">About Us</router-link></li>
        <li><router-link :to="{name: 'classes'}" class="nav-link link-secondary px-4">Classes</router-link></li>
        <li><router-link :to="{name: 'pricing'}" class="nav-link link-secondary px-4">Pricing</router-link></li>
      </ul>
      <div class="col-lg-3 text-end">
        <button type="button" class="btn btn-primary rounded-pill px-4">Try Beta</button>
      </div>
    </header>
  </div>
</template>

<script>
export default {}
</script>