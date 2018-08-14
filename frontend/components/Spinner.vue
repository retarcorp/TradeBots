<template>
    <div>
        <spinner size='100%' v-if='getValueOfLoading'></spinner>
    </div>
</template>

<script>
    import Spinner from 'vue-loading-spinner/src/components/Circle';
    export default {
        props: {
            isActive: {
                default: false,
                // required: true
            }
        },
        components: {
            Spinner
        },
        computed: {
            getValueOfLoading() {
                return this.$store.getters.getValueOfLoading;
            }
        }
    }
</script>

