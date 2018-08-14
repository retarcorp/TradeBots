<template>
  <div>
    <app-header></app-header>
    <alert></alert>
    <loader></loader>
    <nuxt/>
  </div>
</template>

<script>
import AppHeader from '~/components/AppHeader';
import Alert from '~/components/Alert';
import Loader from '~/components/Spinner';
  export default {
    components: {
      AppHeader,
      Alert,
      Loader
    }
  }
</script>

<style>
</style>

