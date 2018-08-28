<template>
    <nuxt-link :to="'/bots/' + id" class="bot">
        <div class="bot__name"><slot></slot></div>
        <div v-show="isBotHasOrders" class="bot__status"><img src="~/assets/svg/market.svg"></div>
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
            bot() {
                return this.$store.getters.getBot(this.id)
            },
            isBotHasOrders() {
                return this.bot.orders.length &&
                        this.bot.orders.filter(order => order.status === 'NEW' || order.status === 'PARTIALLY_FILLED').length
            },
            isBotActive() {
                if(this.id) {
                    return this.bot.status === '1'
                }
            }
        }
    }
</script>

<style scoped>
.bot {
    position: relative;
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

.bot__status {
    position: absolute;
    top: 50%;
    left: 75%;
    transform: translateY(-50%)
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

