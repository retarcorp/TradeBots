<template>
  <div>
    <app-header></app-header>
    <alert></alert>
    <loader></loader>
    <nuxt class='nuxtBlock'/>
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

.nuxtBlock {
  margin-top: 8rem;
}

</style>

