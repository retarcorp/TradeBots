<template>
    <div>
        <div class="bots__settings manual-settings">
            <div class="form-control newBot__settings-control">
                <label class="label" for="label">Название бота:</label>
                <input v-model="bot.title" id="bot__name" type="text" class="input settings__input">
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
                    <option value="NANO">NANO</option>
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
                <label class="label" for="start__order">Начальный ордер:</label>
                <input @blur="bot.botSettings.safeOrder.size = bot.botSettings.initialOrder" v-model="bot.botSettings.initialOrder" id="start__order" type="number" class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="save__order">Страховочный ордер:</label>
                <input v-model="bot.botSettings.safeOrder.size" id="save__order" type="number" class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="count__save-order">Кол-во страховочных ордеров:</label>
                <input @blur="checkStopLoss(); checkMaxOrders(); bot.botSettings.maxOpenSafetyOrders = bot.botSettings.safeOrder.amount" v-model="bot.botSettings.safeOrder.amount" id="count__save-order" type="number" class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="count__bots">Макс открытых СО:</label>
                <input @blur="checkMaxOrders" v-model="bot.botSettings.maxOpenSafetyOrders" id="count__max-save-order" type="number" class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control" style="margin-top: 9px;">
                <label class="label label__double-row" for="deviation">Отклонение от начального ордера %</label>
                <input @blur="checkStopLoss" v-model="bot.botSettings.deviation" id="deviation" type="number" step='0.01' class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="stop__loss">Стоп лосс %</label>
                <input 
                    v-model="bot.botSettings.stopLoss" 
                    @blur="checkStopLoss"
                    id="stop__loss" 
                    type="number" 
                    step='0.01'
                    class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label" for="take__profit">Тейк профит %</label>
                <input v-model="bot.botSettings.takeProfit" id="take__profit" type="number" step='0.01' class="input settings__input">
            </div>
            <div class="form-control newBot__settings-control">
                <label class="label">Мартингейл</label>
                <div class="checkbox__container">
                    <label class="martingeil__mode">
                        <input 
                            v-model="bot.botSettings.martingale.active" 
                            id="martingale-on" 
                            class="radio__point" 
                            type="radio"
                            value="1" 
                            >
                        Вкл
                    </label>
                    <label class="martingeil__mode">
                        <input 
                            v-model="bot.botSettings.martingale.active" 
                            id="martingale-off" 
                            class="radio__point" 
                            type="radio"
                            value="0" >
                        Выкл
                    </label>
                </div>
            </div>
            <div 
                v-show="bot.botSettings.martingale.active === '1'" 
                class="form-control newBot__settings-control">
                <label class="label label__double-row" for="save__order-up">Увеличение страховочного ордера: </label>
                <span class="range__value">{{ bot.botSettings.martingale.value }}</span>
                <input 
                    v-model="bot.botSettings.martingale.value" 
                    id="save__order-up"
                    type="range" 
                    min="1.01" 
                    max="2" 
                    step="0.01" 
                    class="page__input settings__input-range">
            </div>
        </div>
        <div class="text-right">
            <button @click.prevent="onAddManualBot" class="button button--success" :class="{'button--disabled': !isFormValid}" :disabled="!isFormValid">{{ bot.botID ? 'Сохранить' : 'Добавить' }}</button>
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
        data() {
            return {
                pairs: {
                    ETH: ['BTC', 'USDT'],
                    BNB: ['BTC', 'ETH', 'USDT'],
                    BTC: ['USDT'],
                    NANO: ['BTC']
                }
            }
        },
        computed: {
            isFormValid() {
                return this.bot.title.length !== 0 &&
                        this.bot.pair.from !== '' &&
                        this.bot.pair.to !== '' &&
                        this.bot.botSettings.initialOrder >= 0.001 &&
                        this.bot.botSettings.stopLoss != 0 &&
                        this.bot.botSettings.takeProfit != 0
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
            checkMaxOrders() {
                if(this.bot.botSettings.maxOpenSafetyOrders > this.bot.botSettings.safeOrder.amount) {
                    this.bot.botSettings.maxOpenSafetyOrders = this.bot.botSettings.safeOrder.amount
                }
            },
            checkStopLoss() {
                if(this.bot.botSettings.stopLoss < (this.bot.botSettings.deviation * this.bot.botSettings.safeOrder.amount)) {
                    this.bot.botSettings.stopLoss = (this.bot.botSettings.deviation * this.bot.botSettings.safeOrder.amount).toFixed(2)
                }
            },
            onAddManualBot() {
                if(this.bot.botID) {
                    this.$store.dispatch('updateBot', this.bot)
                        .then(() => {
                            this.$emit('changed')
                        })
                } else {
                    this.$store.dispatch('addBot', this.bot)
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
</style>

