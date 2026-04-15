<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="@/assets/images/logo.svg" alt="logo" width="24" height="24" class="d-inline-block align-text-top">
        {{ appStore.app_name }}
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link :to="{name: 'home'}" class="nav-link">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link :to="{name: 'about'}" class="nav-link link-secondary px-4">About</router-link>
          </li>
        </ul>
        <button class="btn btn-outline-primary">CTA</button>
      </div>
    </div>
  </nav>
</template>

<script>
import {useAppStore} from "@/stores/app.js";

export default {
  setup(){
    const appStore = useAppStore();
    return {
      appStore,
    };
  },
}
</script>