<template>
    <div>
        <div class="bots__settings manual-settings">
            <div class="form-control newBot__settings-control">
                <label class="label" for="label">Название бота:</label>
                <input 
                    v-model="bot.title" 
                    id="bot__name" 
                    maxlength="20" 
                    type="text" 
                    class="input settings__input"
                    :class="{ warn: !bot.title.length }"
                    @blur='checkContent'
                >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="main__pair">Основная пара:</label>
                <select 
                    v-model="bot.pair.to" 
                    id="main__pair" 
                    type="text" 
                    @change="setMinNotional()"
                    @blur='checkContent'
                    class="input settings__input"
                    :class="{ warn: !(bot.pair.to !== '' && bot.pair.to !== undefined) }"
                    >
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="BTC">BTC</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="main__pair">Котируемая пара:</label>
                <select 
                    v-model="bot.pair.from" 
                    id="main__pair" 
                    type="text" 
                    class="input settings__input"
                    :class="{ warn: !(bot.pair.from !== '' && bot.pair.from !== undefined) }"
                    @blur='checkContent'
                >
                    <option 
                        v-for="pair in filteredPairs" 
                        :key="pair.id" 
                        :value="pair"
                        >{{ pair }}</option>
                </select>
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="start__order">Начальный ордер:</label>
                <input @change="changeSafeOrderSize(); checkValue('initialOrder')" 
                    v-model="bot.botSettings.initialOrder" 
                    :step="getStep()" 
                    :min="minNotional" 
                    id="start__order" 
                    type="number" 
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.initialOrder >= minNotional) }"
                    @blur='checkContent'
                >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="save__order">Страховочный ордер:</label>
                <input v-model="bot.botSettings.safeOrder.size" 
                    @change="checkValue('safeOrderSize'); checkSafeOrderSize()"
                    @blur='checkContent'
                    :step="getStep()" 
                    :min="minNotional" 
                    id="save__order" 
                    type="number" 
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.safeOrder.size >= minNotional) }"
                    >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="count__save-order">Кол-во страховочных ордеров:</label>
                <input 
                    :min="0"
                    :max='99' 
                    :step="1" 
                    @change="checkValue('safeOrderAmount'); checkStopLoss(); checkMaxOrders();" 
                    @blur='checkContent'
                    v-model="bot.botSettings.safeOrder.amount" 
                    id="count__save-order" 
                    type="number" 
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.safeOrder.amount > 0) }"
                >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="count__bots">Макс открытых СО:</label>
                <input 
                    :min="0" 
                    :max="bot.botSettings.safeOrder.amount" 
                    :step="1" 
                    @change="checkValue('maxOrders'); checkMaxOrders(true)"
                    @blur='checkContent' 
                    v-model="bot.botSettings.maxOpenSafetyOrders" 
                    id="count__max-save-order" 
                    type="number" 
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.maxOpenSafetyOrders > 0) }"
                >
            </div>
            <div class="form-control newBot__settings-control" style="margin-top: 9px;">
                <label class="label label__double-row" for="deviation">Отклонение от начального ордера %</label>
                <input 
                    @change="checkValue('deviation'); checkStopLoss(true)" 
                    v-model="bot.botSettings.deviation" 
                    id="deviation" 
                    type="number" 
                    step='0.1'
                    max='10' 
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.deviation > 0) }"
                    @blur='checkContent'
                >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="stop__loss">Стоп лосс %</label>
                <input 
                    v-model="bot.botSettings.stopLoss" 
                    @change="checkValue('stopLoss'); checkStopLoss()"
                    id="stop__loss" 
                    type="number" 
                    min="0"
                    max='10'
                    step='0.1'
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.stopLoss >= 0) }"
                    >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="take__profit">Тейк профит %</label>
                <input 
                    v-model="bot.botSettings.takeProfit" 
                    @change="checkValue('takeProfit')" 
                    id="take__profit" 
                    type="number" 
                    min="0"
                    max='10' 
                    step='0.1' 
                    class="input settings__input"
                    :class="{ warn: !(bot.botSettings.takeProfit > 0) }"
                    @blur='checkContent'
                >
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label">Мартингейл</label>
                <div class="checkbox__container">
                    <label class="martingeil__mode" v-if="bot.botSettings.martingale">
                        <input 
                            v-model="bot.botSettings.martingale.active" 
                            id="martingale-on" 
                            class="radio__point" 
                            type="radio"
                            value="1"
                        >Вкл
                    </label>
                    <label class="martingeil__mode"  v-if="bot.botSettings.martingale">
                        <input 
                            v-model="bot.botSettings.martingale.active" 
                            id="martingale-off" 
                            class="radio__point" 
                            type="radio"
                            value="0" 
                            @blur='checkContent'
                        >Выкл
                    </label>
                </div>
            </div>
            <div 
                v-show="(bot.botSettings.martingale && bot.botSettings.martingale.active === '1')" 
                class="form-control newBot__settings-control">
                <label class="label label__double-row" for="save__order-up">Увеличение страховочного ордера: </label>
                <span v-if="bot.botSettings.martingale" class="range__value">{{ bot.botSettings.martingale.value }}</span>
                <input 
                    v-if="bot.botSettings.martingale"
                    v-model="bot.botSettings.martingale.value"
                    @blur='checkContent' 
                    id="save__order-up"
                    type="range" 
                    min="1.01" 
                    max="2" 
                    step="0.01" 
                    class="page__input settings__input-range">
            </div>
        </div>
        <div class="text-right">
            <button 
                @click.prevent="onAddManualBot" 
                class="button button--success" 
                :class="{'button--disabled': !isFormValid}" 
                :disabled="!isFormValid && isAlreadyPushed">{{ bot.botID ? 'Сохранить' : 'Добавить' }}
            </button>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'bot-manual',
        props: {
            mode: String,
            bot: {
                required: false,
                default() {
                    return {
                        state: '1',
                        pair: {
                            from: '',
                            to: ''
                        },
                        title: '',
                        botSettings: {
                            initialOrder: 0,
                            safeOrder: {
                                size: 0,
                                amount: 0
                            },
                            maxOpenSafetyOrders: 0,
                            deviation: 0,
                            stopLoss: 0,
                            takeProfit: 0,
                            martingale: {
                                value: 1.01,
                                active: '0'
                            }
                        }
                    }
                }
            }
        },
        mounted: function() {
            this.setMinNotional(true);
        },
        data() {
            return {
                isAlreadyPushed: false,
                minNotional: 0
            }
        },
        computed: {
            isFormValid() {
                return this.bot.title.length !== 0 && 
                        this.bot.pair.from !== undefined &&
                        this.bot.pair.from !== '' &&
                        this.bot.pair.to !== '' &&
                        Number(this.bot.botSettings.initialOrder) > 0 &&
                        Number(this.bot.botSettings.stopLoss) >= 0 &&
                        Number(this.bot.botSettings.takeProfit) > 0 &&
                        Number(this.bot.botSettings.safeOrder.size) > 0 &&
                        Number(this.bot.botSettings.safeOrder.amount) > 0 &&
                        Number(this.bot.botSettings.maxOpenSafetyOrders) > 0 &&
                        Number(this.bot.botSettings.deviation) > 0
            },
            filteredPairs() {
                if(this.bot.pair.to && this.$store.getters.getPairs) {
                    return this.$store.getters.getPairs[this.bot.pair.to].sort();
                } else return [];
            }
        },
        watch: {
        },
        created() {
        },
        methods: {
            templateMessage(number) {
                this.$store.commit('setStatus', 'info');
                this.$store.commit('setMessage', `Максимальное значение данного поля - ${number}`);
            },
            checkValue(state) {
                if( this.bot.botSettings.safeOrder.amount > 99 ) {
                    this.bot.botSettings.safeOrder.amount = 99;
                    this.templateMessage(99);
                }
                if( this.bot.botSettings.maxOpenSafetyOrders > 99 ) {
                    this.bot.botSettings.maxOpenSafetyOrders = 99;
                    this.templateMessage(99);
                }
                if( this.bot.botSettings.deviation > 10 ) {
                    this.bot.botSettings.deviation = 10;
                    this.templateMessage(10);
                }
                if( this.bot.botSettings.stopLoss > 99 ) {
                    this.bot.botSettings.stopLoss = 99;
                    this.templateMessage(10);
                }
                if( this.bot.botSettings.takeProfit > 10 ) {
                    this.bot.botSettings.takeProfit = 10;
                    this.templateMessage(10);
                }
                let bs = this.bot.botSettings;
                const takeProfit = 'takeProfit',
                    initialOrder = 'initialOrder',
                    stopLoss = 'stopLoss',
                    safeOrderSize = 'safeOrderSize',
                    safeOrderAmount = 'safeOrderAmount',
                    deviation = 'deviation',
                    maxOrders = 'maxOrders';
                switch(state) {
                    case takeProfit: bs.takeProfit = bs.takeProfit < 0 ? 0 : bs.takeProfit; break;
                    case initialOrder: bs.initialOrder = bs.initialOrder < 0 ? 0 : bs.initialOrder; break;
                    case stopLoss: bs.stopLoss = bs.stopLoss < 0 ? 0 : bs.stopLoss; break;
                    case safeOrderSize: bs.safeOrder.size = bs.safeOrder.size < 0 ? 0 : bs.safeOrder.size; break;
                    case safeOrderAmount: bs.safeOrder.amount = bs.safeOrder.amount < 0 ? 0 : bs.safeOrder.amount; break;
                    case deviation: bs.deviation = bs.deviation < 0 ? 0 : bs.deviation; break;
                    case maxOrders: bs.maxOpenSafetyOrders = bs.maxOpenSafetyOrders < 0 ? 0 : bs.maxOpenSafetyOrders; break;
                }
            },
            checkSafeOrderSize() {
                this.bot.botSettings.safeOrder.size = this.bot.botSettings.safeOrder.size <= this.minNotional 
                    ? this.minNotional 
                    : this.bot.botSettings.safeOrder.size;
            },
            checkContent(event) {
                if( event.target && !event.target.value ) {
                    this.$store.commit('setStatus', 'info');
                    this.$store.commit('setMessage', 'Это поле является обязательным');
                }
            },
            changeSafeOrderSize() {
                this.bot.botSettings.initialOrder = this.bot.botSettings.initialOrder <= this.minNotional 
                    ? this.minNotional 
                    : this.bot.botSettings.initialOrder;
                this.bot.botSettings.safeOrder.size = (this.bot.botSettings.safeOrder.size <= 0 ) 
                    ? this.bot.botSettings.initialOrder 
                    : this.bot.botSettings.safeOrder.size
            },
            getStep() {
                return (Math.floor(this.minNotional) >= 1) ? 1 : this.minNotional;
            },
            setMinNotional(flag = false) {
                if(this.bot.pair.to !== '') {
                    let symbol = this.bot.pair.to;
                    this.minNotional = this.$store.getters.getMinNotional(symbol);
                } else {
                    this.minNotional = 0;
                }
                !flag && (this.bot.pair.from = '');
                this.bot.botSettings.initialOrder = this.minNotional;
                this.bot.botSettings.safeOrder.size = this.minNotional;
            },
            checkMaxOrders(flag) {
                let bs = this.bot.botSettings;
                if(!flag) {
                    if(Number(bs.safeOrder.amount) !== 0) {
                        bs.maxOpenSafetyOrders = (bs.safeOrder.amount >= 3) ? 3 : 1;
                    } else {
                        bs.maxOpenSafetyOrders = 0;
                    }
                } else {
                    if(Number(bs.safeOrder.amount) < Number(bs.maxOpenSafetyOrders)) {
                        bs.maxOpenSafetyOrders = bs.safeOrder.amount;
                    }
                }
            },
            checkStopLoss(flag = false) {
                let bs = this.bot.botSettings;
                if(Number(bs.stopLoss) < 0) bs.stopLoss = 0;
                if(flag || (Number(bs.stopLoss) < (bs.deviation * bs.safeOrder.amount + 0.1) && Number(bs.stopLoss) !== 0)) {
                    bs.stopLoss = (bs.deviation * bs.safeOrder.amount + 0.1).toFixed(2)
                }
            },
            // checkContent(event) {
            //     if( !event.target.value ) {
            //         this.$store.commit('setStatus', 'info');
            //         this.$store.commit('setMessage', 'Это поле является обязательным');
            //     }
            // },
            onAddManualBot() {
                if(!this.isAlreadyPushed) {
                    this.isAlreadyPushed = true;
                    this.$store.commit('setСonfigurationProcess', false);
                    this.bot.botSettings.minNotional = this.minNotional;
                    if(this.bot.botID) {
                        let nextBotSettings = {
                            botID: this.bot.botID,
                            title: this.bot.title,
                            pair: this.bot.pair,
                            botSettings: this.bot.botSettings
                            // initialOrder: this.bot.botSettings.initialOrder,
                            // safeOrder: this.bot.botSettings.safeOrder,
                            // stopLoss: this.bot.botSettings.stopLoss,
                            // takeProfit: this.bot.botSettings.takeProfit,
                            // tradingSignals: this.bot.botSettings.tradingSignals,
                            // maxOpenSafetyOrders: this.bot.botSettings.maxOpenSafetyOrders,
                            // deviation: this.bot.botSettings.deviation
                        };
                        this.$store.dispatch('updateBot', nextBotSettings)
                            .then(() => {
                                this.$store.dispatch('setBotsList', true);
                                this.$emit('changed');
                                setTimeout(()=> {
                                    this.isAlreadyPushed = false;
                                }, 1000)
                            })
                    } else {
                        this.$store.dispatch('addBot', this.bot)
                            .then( () => {
                                this.$store.dispatch('setBotsList', true);
                                this.$emit('changed');
                                setTimeout(()=> {
                                    this.isAlreadyPushed = false;
                                }, 1000)
                            })
                    }
                }
            }
        }
    }
</script>

<style scoped>
.bots__settings {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    margin-bottom: 5rem;
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
    margin-right: 1.23rem;
}

.form__input {
    border: 1px solid #DCDCDC
}

.newBot__settings {
    margin-bottom: 2rem
}

input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    border-radius: .8rem;
    height: 1px;
    background-color: #E9E9E9;
    border: 1px solid #DCDCDC;
}

input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    background-color: #C4C4C4;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    cursor: pointer;
}

/* Firefox */
input[type=range]::-moz-range-track {
    -webkit-appearance: none;
    width: 100%;
    border-radius: .8rem;
    height: 1px;
    background-color: #E9E9E9;
    border: 1px solid #DCDCDC;
}

input[type='range']::-moz-range-thumb {
    -webkit-appearance: none;
    background-color: #C4C4C4;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    cursor: pointer;
}

/* IE */

input[type="range"]::-ms-fill-lower,
input[type="range"]::-ms-fill-upper {
    background: transparent;
}
input[type=range]::-ms-track {
    -webkit-appearance: none;
    width: 100%;
    border-radius: .8rem;
    height: 1px;
    background-color: #E9E9E9;
    border: 1px solid #DCDCDC;
}

input[type='range']::-ms-thumb {
    -webkit-appearance: none;
    background-color: #C4C4C4;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    cursor: pointer;
}

.page__field{
    display: inline-flex;
    flex-direction: column;
}

.page__field:not(:last-child){
    margin-right: 1.5rem;
}

.page__label,
.page__label span{
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1.1rem;
}

.checkbox__container {
    display: flex;
    flex-direction: column;
    min-height: 4.5rem;
}

.warn {
    outline: none;
    /* border: 1px solid red; */
    box-shadow: inset 0 0 3px red;
}
</style>

