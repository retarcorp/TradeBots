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
                    v-model="bot.pair.to" 
                    id="main__pair" 
                    type="text" 
                    @change="setMinNotional()"
                    class="input settings__input">
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="BTC">BTC</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="main__pair">Котируемая пара:</label>
                
                <select v-model="bot.pair.from" id="main__pair" type="text" class="input settings__input">
                    <option 
                        v-for="pair in filteredPairs" 
                        :key="pair.id" 
                        :value="pair"
                        >{{ pair }}</option>
                </select>
            </div>
            <div class="form-control newBot__settings-control"> Список пар: </div>
            <div class="newBot__list botPairsList">
                <div
                    v-for="(item, i) in bot.pair.requested"
                    :key="item"
                    :item="item"
                    class="pair-item"
                    >
                        {{ `${item}` }}
                        <button
                            @click.prevent="onDeletePair(i)"
                            class="button pairs-list__delete-button"
                            :class="button__cancel">x
                        </button>
                </div>
                
                <button
                    @click.prevent="addPair"
                    class="button button--success pair_btn"
                    :class="{'button--disabled' : isFormValid_Pairs}"
                    :disabled="isFormValid_Pairs">+
                </button>
            </div>
            
            <!-- <div class="form-control newBot__settings-control">
                <label class="label">Дневной объём (BTC):</label>
                <input v-model="bot.botSettings.dailyVolumeBTC" min="0" @change="checkValue('dailyVolumeBTC')" type="number" class="input">
            </div> -->
            <div class="form-control newBot__settings-control">
                <label class="label" for="start__order">Начальный ордер:</label>
                <input v-model="bot.botSettings.initialOrder" @change="checkValue('initialOrder'); checkInitialOrder()" :min="minNotional" :step="getStep()" id="start__order" type="number" class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="stop__loss">Стоп лосс %</label>
                <input
                    @change="checkValue('stopLoss')"
                    v-model="bot.botSettings.stopLoss"
                    id="stop__loss"
                    type="number"
                    step='0.01'
                    min="0"
                    class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="take__profit">Тейк профит %</label>
                <input v-model="bot.botSettings.takeProfit" @change="checkValue('takeProfit')" min="0" id="take__profit" type="number" step='0.01' class="input settings__input">
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
                    v-model="autoItem.checkRating"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Рекомендация</option>
                    <option
                        v-for="rec in checkRating"
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
                :disabled="!isAllFormValid"
                class="button button--success"
                :class="{'button--disabled': !isAllFormValid}"
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
        minNotional: 0,
        bot: {
            required: false,
            default() {
                return {
                    state: '0',
                    pair: {
                        from: '',
                        to: '',
                        requested: []
                    },
                    title: '',
                    botSettings: {
                        initialOrder: 0,
                        // dailyVolumeBTC: 0,
                        stopLoss: 0,
                        takeProfit: 0,
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
                checkRating: 'default'
            },
            signals: [
                { id: 'Tradingview', name: 'Tradingview'}
            ],
            timefraims: [
                { id:"1m", name: '1m' },
                { id:"5m", name: '5m' },
                { id:"15m", name: '15m' },
                { id:"1h", name: '1h' },
                { id:"4h", name: '4h' },
                { id:"1d", name: '1d' },
                { id:"1w", name: '1w' },
                { id:"1M", name: '1M' }
            ],
            checkRating: [
                { id: 'Buy', name: 'Buy'},
                { id: 'Strong Buy', name: 'Strong Buy'}
            ],
            pairs: {
                ETH: ['BTC', 'USDT'],
                BNB: ['BTC', 'ETH', 'USDT'],
                BTC: ['USDT']
            }
        }
    },
    computed: {
        isAllFormValid() {
            return this.bot.pair.requested.length !== 0 &&
                this.bot.pair.to !== '' &&
                this.bot.title.length !== 0 &&
                this.bot.botSettings.initialOrder > 0 &&
                this.bot.botSettings.stopLoss >= 0 &&
                this.bot.botSettings.takeProfit > 0 &&
                this.bot.botSettings.tradingSignals.length > 0 
                // this.bot.botSettings.dailyVolumeBTC !== ''
        },
        isFormValid() {
            return Object.keys(this.autoItem)
                .find(field => this.autoItem[field] === 'default')
        },
        isFormValid_Pairs() {
            return this.bot.pair.from === 'default' || this.bot.pair.from === ''
        },
        filteredPairs() {
            return this.$store.state.pairs[this.bot.pair.to]
        }
    },
    watch: {
        'bot.pair.to'() {
            this.bot.pair.from = ''
            this.bot.pair.requested = [] 
        }
    },
    methods: {
        checkValue(state) {
            let bs = this.bot.botSettings;
            const takeProfit = 'takeProfit',
                initialOrder = 'initialOrder',
                stopLoss = 'stopLoss';
                // dailyVolumeBTC = 'dailyVolumeBTC';
            switch(state) {
                case takeProfit: bs.takeProfit = bs.takeProfit < 0 ? 0 : bs.takeProfit; break;
                case initialOrder: bs.initialOrder = bs.initialOrder < 0 ? 0 : bs.initialOrder; break;
                case stopLoss: bs.stopLoss = bs.stopLoss < 0 ? 0 : bs.stopLoss; break;
                // case dailyVolumeBTC: bs.dailyVolumeBTC = bs.dailyVolumeBTC < 0 ? 0 : bs.dailyVolumeBTC; break;
            }
        },
        checkInitialOrder() {
            this.bot.botSettings.initialOrder = this.bot.botSettings.initialOrder <= this.minNotional ? this.minNotional : this.bot.botSettings.initialOrder;
        },
        getStep() {
            if(Math.floor(this.minNotional) >= 1) return 1;
            else return this.minNotional;
        },
        setMinNotional() {
            if(this.bot.pair.to !== '') {
                let symbol = this.bot.pair.to;
                this.minNotional = this.$store.getters.getMinNotional(symbol);
            }
            else {
                this.minNotional = 0;
            }
            this.bot.botSettings.initialOrder = this.minNotional
        },
        addItem() {
            this.bot.botSettings.tradingSignals.push(this.autoItem)
            this.autoItem = {
                signal: 'default',
                timeframe: 'default',
                checkRating: 'default'
            }
        },
        addPair() {
            this.bot.pair.requested.push(this.bot.pair.from)
            this.bot.pair.from = 'default'
        },
        onDeletePair(i) {
            this.bot.pair.requested.splice(i, 1)
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
            this.$store.commit('setСonfigurationProcess', false);
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
.botPairsList {
    margin-bottom: 1rem;
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    width: 100%;
    border: 1px solid #e3e3e3;
    padding: 1rem;
}

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

.button_pair {
    display: inline-flex;
}

.pair-item {
    margin-left: 0.5rem;
}

.pairs-list__delete-button {
    margin-left: 0.5rem;
    margin-right: 1rem;
    color: red !important; 
    background-color: whitesmoke;
    border: none;
}

.pair_btn {
    margin-left: 2rem; 
}
</style>
