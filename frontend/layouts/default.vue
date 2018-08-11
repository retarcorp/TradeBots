<template>
  <div>
    <app-header v-if="isAuth"></app-header>
    <nuxt/>
  </div>
</template>

<script>
import AppHeader from '~/components/AppHeader';
  export default {
    components: {
      AppHeader
    },
    computed: {
      isAuth() {
        return this.$store.getters.getAuthorizedStatus
      }
    }
  }
</script>

<style>
  @import '@/assets/css/setup.css';
</style>

