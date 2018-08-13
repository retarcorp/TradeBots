<template>
    <nuxt-link :to="'/bots/' + id" class="bot">
        <div class="bot__name"><slot></slot></div>
        <div class="bot__signal">
            <img src="../assets/svg/circle.svg" alt="">
        </div>
    </nuxt-link>
</template>

<script>
    export default {
        props: {
            id: {
                type: String,
                required: true,
                default: 'add-new'
            }
        }
    }
</script>

<style scoped>
.bot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #DCDCDC;
    color: var(--color-primary);
    padding: 2rem 4rem;
    font-size: 1.8rem;
    line-height: 2.1rem;
    cursor: pointer;
    margin-bottom: .6rem;
}
</style>

