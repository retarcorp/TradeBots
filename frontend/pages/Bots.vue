<template>
    <div class="container bots">
        <div class="row">
            <div class="col-12 col-md-6 col-lg-4">
                <div class="bots__search-wrapper">
                    <input type="text" class="input bots__search">
                    <span class="bots__search-icon">
                        <img src="../assets/svg/search.svg">
                    </span>
                </div>
                <div class="bots__list">
                    <div v-for="bot in botsList" :key="bot.id">
                        <bot-item :id="bot.id">{{ bot.name }}</bot-item>
                    </div>
                </div>
                <div>
                    <button 
                        @click="onAddNewBot" 
                        class="button button--big button--primary bots__add-button"
                        :class="{disabled : isSingleNewBot}" 
                        :disabled="isSingleNewBot"
                        >Добавить бота +</button>
                </div>
            </div>
            <div class="col-12 col-md-6 col-lg-8">
                <nuxt-child />
            </div>
        </div>
    </div>
</template>

<script>
import BotItem from '~/components/BotItem';
export default {
    components: {
        BotItem
    },
    computed: {
        botsList() {
            return this.$store.getters.getBotsList
        },
        isSingleNewBot() {
            return this.botsList.find(bot => bot.id === undefined)
        }
    },
    methods: {
        onAddNewBot() {
            this.$router.push('/bots/add-new')
            this.$store.dispatch('addNewBot', {
                name: 'New Bot'
            })
           
        }
    },
    created() {
        this.$store.dispatch('setBotsList')
    }
}
</script>

