<template>
    <div class="container bots">
        <div class="row">
            <div class="col-12 col-md-4 col-lg-4">
                <div class="bots__search-wrapper">
                    <input v-model="search" type="text" class="input bots__search">
                    <span class="bots__search-icon">
                        <img src="../assets/svg/search.svg">
                    </span>
                </div>
                <div class="bots__list">
                    <div v-for="bot in filteredBotList" :key="bot.id">
                        <bot-item :id="bot.botID">{{ bot.title }}</bot-item>
                    </div>
                </div>
                <div>
                    <button 
                        @click="onAddNewBot" 
                        class="button button--big button--primary bots__add-button"              
                        >Добавить бота +</button>
                </div>
            </div>
            <div class="col-12 col-md-8 col-lg-8">
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
        filteredBotList() {
            return this.botsList.filter(bot => {
                return (bot.title.toLowerCase()).startsWith(this.search.toLowerCase())
            })
        },
        botsList() {
            return this.$store.getters.getBotsList
        }
    },
    data() {
        return {
            search: ''
        }
    },
    methods: {
        onAddNewBot() {
            this.$router.push('/bots/add-new')
           
        }
    },
    created() {
        this.$store.dispatch('setBotsList')
    }
}
</script>

