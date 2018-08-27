<template>
    <span class="spiner__wrapper">
        <spinner size='100%' v-if='isActive'></spinner>
    </span>
</template>

<script>
    import Spinner from 'vue-loading-spinner/src/components/Circle';
    export default {
        components: {
            Spinner
        },
        computed: {
            isActive() {
                return this.$store.getters.getSpinerStatus
            }
        }
    }
</script>

<style scoped>
.spiner__wrapper {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: inline-block;
    height: 4rem;
    width: 4rem;
    z-index: 99999999;
}
</style>

