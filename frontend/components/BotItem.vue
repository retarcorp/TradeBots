<template>
    <nuxt-link :to="'/bots/' + id" class="bot">
        <div class="bot__name"><slot></slot></div>
        <div class="bot__signal" :class="{'bot__signal--disabled' : !isBotActive}"></div>
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
        },
        computed: {
            isBotActive() {
                if(this.id) {
                    let bot = this.$store.getters.getBot(this.id);
                    return bot.status === '1'
                }
            }
        }
    }
</script>

<style scoped>
.bot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #F1F1F1;
    color: var(--color-primary);
    padding: 2rem 4rem;
    font-size: 1.8rem;
    line-height: 2.1rem;
    cursor: pointer;
    margin-bottom: .6rem;
    transition: .3s all ease
}

.bot:hover {
    background-color: #DCDCDC;
}

.bot__signal {
    width: 1.7rem;
    height: 1.7rem;
    background-color: #72C770;
    border-radius: 100%
}

.bot__signal--disabled {
    background-color: inherit;
}
</style>

