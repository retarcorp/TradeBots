<template>
    <div class="automatic">
        <div class="newBot__settings">
            <div class="form-control newBot__settings-control">
                <label class="label">Название бота:</label>
                <input v-model="bot.title" type="text" class="input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="main__pair">Основная пара:</label>
                <select 
                    v-model="bot.pair.from" 
                    id="main__pair" 
                    type="text" 
                    class="input settings__input">
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="BTC">BTC</option>
                </select>
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="main__pair">Котируемая пара:</label>
                <select v-model="bot.pair.to" id="main__pair" type="text" class="input settings__input">
                    <option 
                        v-for="pair in filteredPairs" 
                        :key="pair.id" 
                        :value="pair"
                        >{{ pair }}</option>
                </select>
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label">Дневной объём (BTC):</label>
                <input v-model="bot.botSettings.dailyVolumeBTC" type="number" class="input">
            </div>
        </div>
        <div class="newBot__conditions">
            <div class="newBot__conditions-title">Условия для начала сделки:</div>
            <div class="newBot__conditions-wrapper">
                <select
                    v-model="autoItem.signal"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Стратегия</option>
                    <option 
                        v-for="signal in signals" 
                        :key="signal.id" 
                        :value="signal.id"
                        >{{ signal.name }}</option>
                </select>
                <select
                    v-model="autoItem.timeframe"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Таймфрейм</option>
                    <option 
                        v-for="tr in timefraims" 
                        :key="tr.id" 
                        :value="tr.id"
                        >{{ tr.name }}</option>
                </select>
                <select
                    v-model="autoItem.transactionTerm"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Рекомендация</option>
                    <option
                        v-for="rec in transactionTerms"
                        :key="rec.id"
                        :value="rec.id"
                        >{{ rec.name }}</option>
                </select>
                <button
                    @click.prevent="addItem" 
                    class="button button--success newBot__conditions-select"
                    :class="{'button--disabled' : isFormValid}"
                    :disabled="isFormValid">Добавить условие</button>
            </div>
        </div>
        <div class="newBot__list">
            <automatic-item
                v-for="(item,i) in bot.botSettings.tradingSignals"
                :key="item.id"
                :item="item"
                @item-deleted="onDeleteItem(i)">{{ i+1 }}</automatic-item>
        </div>
        <div class="text-right">
            <button
                @click.prevent="addAutomaticBot"
                :disabled="bot.botSettings.tradingSignals.length === 0" 
                class="button button--success"
                :class="{'button--disabled': bot.botSettings.tradingSignals.length === 0}"
                >{{ (bot && bot.botID) ? 'Сохранить' : 'Добавить' }}</button>
        </div>
    </div>
</template>

<script>
import AutomaticItem from '~/components/NewBot/AutomaticItem';
export default {
    name: 'bot-automatic',
    components: {
        AutomaticItem
    },
    props: {
        bot: {
            required: false,
            default() {
                return {
                    state: '0',
                    pair: {
                        from: '',
                        to: ''
                    },
                    title: '',
                    botSettings: {
                        dailyVolumeBTC: '',
                        tradingSignals: []
                    }

                }
            }
        }
    },
    data() {
        return {
            autoItem: {
                signal: 'default' ,
                timeframe: 'default' ,
                transactionTerm: 'default' 
            },
            signals: [
                { id: 'Tradingview', name: 'Tradingview'}
            ],
            timefraims: [
                { id:"1M", name: '1M' },
                { id:"3M", name: '3M' },
                { id:"5M", name: '5M' },
                { id:"15M", name: '15' },
                { id:"30M", name: '30' },
                { id:"1H", name: '1H' },
                { id:"2H", name: '2H' },
                { id:"4H", name: '4H' },
                { id:"6H", name: '6H' },
                { id:"12H", name: '12' },
                { id:"1D", name: '1D' },
                { id:"1W", name: '1W' }
            ],
            transactionTerms: [
                { id: 'BUY', name: 'Buy'},
                { id: 'STRONG_BUY', name: 'Strong Buy'}
            ],
            pairs: {
                ETH: ['BTC', 'USDT'],
                BNB: ['BTC', 'ETH', 'USDT'],
                BTC: ['USDT']
            }
        }
    },
    computed: {
        isFormValid() {
            return Object.keys(this.autoItem)
                .find(field => this.autoItem[field] === 'default')         
        },
        filteredPairs() {
                return this.pairs[this.bot.pair.from]
        }
    },
    watch: {
        'bot.pair.from'() {
            this.bot.pair.to = ''
        }
    },
    methods: {

        addItem() {
            this.bot.botSettings.tradingSignals.push(this.autoItem)
            this.autoItem = {
                signal: 'default',
                timeframe: 'default',
                transactionTerm: 'default'
            }
        },
        onDeleteItem(i) {
            this.bot.botSettings.tradingSignals.splice(i, 1)
        },
        addAutomaticBot() {
            // const automaticBot = {
            //     'title': this.bot.title,
            //     'pair': this.bot.pair,
            //     'botSettings': {
            //         'dailyVolumeBTC': this.bot.botSettings.dailyVolumeBTC,
            //         'tradingSignals': this.bot.botSettings.tradingSignals
            //     }
            // }
            let path = '';
            (this.bot && this.bot.botID) ? (path = 'updateBot') : (path = 'addBot');
            this.$store.dispatch(path, this.bot)
                .then(() => {
                    this.$emit('changed')
                })
        }
    }
}
</script>

<style scoped>
.newBot__settings {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
}

.newBot__settings-control {
    max-width: 22.1rem;
    width: 100%;
}

.newBot__settings-control:not(:last-child) {
    margin-right: 1.8rem;
}

.form__input {
    border: 1px solid #DCDCDC
}

.newBot__settings {
    margin-bottom: 2rem
}

.newBot__conditions {
    margin-bottom: 2rem
}

.newBot__conditions-title {
    font-size: 1.8rem;
    line-height: 1.8rem;
    color: inherit;
    margin-bottom: 1.1rem;
}

.newBot__conditions-wrapper {
    display: flex;
    flex-wrap: wrap;
}

.newBot__conditions-select {
    display: block;
    max-width: 16rem;
    width: 100%;
    padding: 1rem 2rem;
    margin-bottom: .5rem;
}

.newBot__conditions-select:not(:last-child) {
    margin-right: 2rem
}

.form__button--success {
    color: #fff
}

.disabled {
    opacity: .5;
}
</style>

