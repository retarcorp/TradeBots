<template>
    <div class="container bots">
        <div class="row">
            <div class="col-12 col-md-4 col-lg-4 fixed">
                <div class="bots__search-wrapper">
                    <input v-model="search" type="text" class="input bots__search">
                    <span class="bots__search-icon">
                        <img src="../assets/svg/search.svg">
                    </span>
                </div>
                <div class="bots__list">
                    <div v-for="bot in filteredBotList" :key="bot.id">
                        <bot-item :id="bot.botID">{{ bot.title }}&nbsp; ({{ bot.pair.from }} / {{bot.pair.to}})</bot-item>
                    </div>
                </div>
                <div class='bots__button'>
                    <button 
                        @click="onAddNewBot" 
                        class="button button--big button--primary bots__add-button"              
                        >Добавить бота +</button>
                </div>
            </div>
            <div class="col-12 col-md-8 col-lg-8 margin">
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
            this.$router.push('/Boty/Novy')
           
        }
    },
    created() {
        this.$store.dispatch('setBotsList')
    }
}
</script>

<style>

/* .bots {
    position: relative;
} */

.fixed {
    position: fixed;
    max-width: 33.3333333%;
}

.margin {
    margin-left: 400px;
}

@media screen and (max-width: 768px) {
    .fixed {
        position: static;
        width: 100%;
        max-width: 100%;
    }

    .margin {
        margin-left: 0px;
    }
}

@media screen and (min-width: 1240px) {
    .fixed {
        position: fixed;
        width: 25%;
        max-width: 25%;
    }

    .margin {
        margin-left: 400px;
    }
}

.bots__list {
    height: 80vh;
    max-height: 70vh;
    overflow-y: auto;
}

</style>
