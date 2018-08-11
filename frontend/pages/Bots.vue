<template>
    <div class="container bots">
        <div class="row">
            <div class="col-12 col-md-6 col-lg-4">
                <div class="bots__search-wrapper">
                    <input type="text" class="form__input bots__search">
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
                        class="btn bots__add-button"
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
            this.$store.dispatch('addBot', {
                name: 'New Bot'
            })
           
        }
    },
    created() {
        // this.$axios.$get('/bots/getBotsList')
        //     .then(res => {
        //         if(res.status === 'ok') {
        //             this.$store.dispatch('setBotsList', res.data)
        //         }
        //     })
    }
}
</script>

<style>
@import '~/assets/css/variables.css';
@import '~/assets/css/components/form.css';
.bots__search-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
}

.form__input {
    margin-bottom: 0
}

.bots__search {
    border: 1px solid #DCDCDC;
    max-width: 100%;
}

.bots__search-icon {
    display: block;
    align-self: stretch;
    padding: 1.3rem 1.8rem;
    background-color: #EFEFEF;
}

.bots__add-button {
    /* position: fixed;
    bottom: 0;
    left: 21.3rem; */
    margin-top: 3rem;
    width: 100%;
    font-size: 1.8rem;
    font-weight: 700;
    /* width: 35rem; */
}

.disabled {
    opacity: .5;
}
</style>

