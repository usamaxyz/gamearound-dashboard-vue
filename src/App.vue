<template>
  <app_header/>
  <RouterView/>

  <div class="container">
    <app_footer/>
  </div>
</template>

<script>
import app_header from './components/app_header.vue';
import app_footer from './components/app_footer.vue';

export default {
  components: {
    app_header,
    app_footer,
  },
}

</script>