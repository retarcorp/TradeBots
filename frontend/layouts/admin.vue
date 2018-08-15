<template>
  <div>
    <app-admin-header></app-admin-header>
    <alert></alert>
    <loader></loader>
    <nuxt/>
  </div>
</template>

<script>
import AppAdminHeader from '~/components/AppAdminHeader';
import Alert from '~/components/Alert';
import Loader from '~/components/Spinner';
export default {
    components: {
        AppAdminHeader,
        Alert,
        Loader
    }
}
</script>