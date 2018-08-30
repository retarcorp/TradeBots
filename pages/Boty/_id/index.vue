<template>
    <div>
        <section class="bots__right-settings bot__manual">
            <div class="settings__header">
                <h1 class="bots__name">{{ bot.title }}</h1>
                <span v-if="bot.state === '0'" class="settings__type">(Автоматический)</span>
                <span v-else class="settings__type">(Ручной)</span>
                <div class="bots__buttons-status">
                    <!-- Send request to server -->
                    <button @click.prevent="setBotFreeze" 
                        class="button button--primary button__freeze"
                        >Заморозить</button>
                    <label class="checkbox">
                        <input 
                            v-model="bot.status" 
                            type="checkbox" 
                            class="checkbox__input button__status"
                            true-value="1"
                            false-value="0">
                        <div class="checkbox__text"></div>
                    </label>
                </div>
            </div>

            <div class="settings__content">

                <!-- <div class="page__field">
                    <label class="page__label" for="counter_bots">Количесво торгующих ботов:</label>
                    <input id="counter_bots" type="text" class="page__input settings__input">
                </div> -->
                <div v-show="!isChanging" class="settings__description">
                    <!-- <p class="settings__item">Дневной объем (BTC): <span>123</span></p> -->
                    <p class="settings__item">Основная пара: 
                        <span>{{ bot.pair.from }}</span>
                    </p>
                    <p class="settings__item">Котируемая пара: 
                        <span>{{ bot.pair.to }}</span>
                    </p>
                    <template v-if="bot.state === '1'">
                        <p class="settings__item">Начальный ордер: 
                            <span>{{ bot.botSettings.initialOrder }}</span>
                        </p>
                        <p class="settings__item">Страховочный ордер: <span>{{ bot.botSettings.safeOrder.size }}</span></p>
                        
                        <p class="settings__item">Кол-во страховочных ордеров: <span>{{ bot.botSettings.safeOrder.amount }}</span></p>
                        
                        <p class="settings__item">Отклонение от начального ордера: <span>{{ bot.botSettings.deviation }}%</span></p>

                        <p class="settings__item">Макс. открытых СО: <span>{{ bot.botSettings.maxOpenSafetyOrders }}</span></p>
                        
                        <p class="settings__item">Стоп лосс: <span>{{ bot.botSettings.stopLoss }}%</span></p>
                        
                        <p class="settings__item">Тейк профит: <span>{{ bot.botSettings.takeProfit }}%</span></p>
                        
                        <p class="settings__item">Мартингейл: 
                            <span>{{ bot.botSettings.martingale.active === '0' ? 'Выкл': 'Вкл' }}</span>
                        </p>
                        
                        <p v-if="bot.botSettings.martingale.active !== '0'" class="settings__item">Увеличение страховочного ордера: <span>{{ bot.botSettings.martingale.value }}</span></p>
                        
                    </template>

                    <template v-else>
                        <p class="settings__item">Дневной объем(BTC): 
                            <span>{{ bot.botSettings.dailyVolumeBTC }}</span>
                        </p>
                        <p>Условия для начала сделки</p>
                        <table class="table">
                            <tr class="table__tr" v-for="(signal,index) in bot.botSettings.tradingSignals" :key="signal.id">
                                <td class="table__td">{{ index + 1 }}. {{ signal.signal }}</td>
                                <td class="table__td">{{ signal.timeframe }}</td>
                                <td class="table__td">{{ signal.transactionTerm }}</td>
                            </tr>
                        </table>
                    </template>
                    
                </div>
                <div>
                    <component @changed="onUpdated" :bot="bot" :is="currentComponent"></component>
                </div>
                <div v-show="!isChanging" class="bots__button">
                    <button @click="onChangeSettings" class="button button--success button__change-settings">Изменить настройки</button>
                    <button @click="onDeleteBot" class="button button--danger button__remove-bot">Удалить бота</button>
                </div>
            </div>

            <div class="bots__order">
                <ul class="tabs__bar">
                    <li @click.prevent="isActive = true" class="tabs__item"  :style="isActive ? 'backgroundColor: #eee': ''">Выставленные ордера</li>
                    <li @click.prevent="isActive = false" class="tabs__item"  :style="!isActive ? 'backgroundColor: #eee': ''">Выполненные</li>
                </ul>
                <div class="tabs__content">
                    <table v-show="isActive" class="table">
                        <tr class="table__tr">
                            <th class="table__th date">Дата</th>
                            <th class="table__th pair-head">Пара</th>
                            <th class="table__th side">Тип</th>
                            <th class="table__th price-head">Цена</th>
                            <th class="table__th quantity-head">Количество</th>
                            <th class="table__th total-head">Всего</th>
                            <th class="table__th status-head">Статус</th>
                            <th class="table__th"></th>
                        </tr>
                        <!-- TODO create component for 1 row -->
                        <tbody class='overflow'>
                            <tr v-for="order in openedOrders"
                                :key="order.id" 
                                class="table__tr">
                                <td class="table__td date">{{ order.time | date }}</td>
                                <td class="table__td pair">{{ order.symbol }}</td>
                                <td 
                                    class="table__td side" 
                                    :class="order.side === 'BUY' ? 'text--success' : 'text--danger'"
                                    >{{ order.side }}({{ order.type }})</td>
                                <td class="table__td price">
                                    {{ order.type !== 'MARKET' ? order.price : (Number(order.cummulativeQuoteQty) / Number(order.origQty)).toFixed(order.price.length - 2) }}  
                                </td>
                                <td class="table__td quantity">{{ order.origQty }}</td>
                                <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                                <td class="table__td status">{{ order.status }}</td>
                                <td class="table__td">
                                    <button @click.prevent="refuseOrder(order.orderId, bot.botID)" class="button table__button button--primary">Отменить</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table v-show="!isActive" class="table">
                        <tr class="table__tr">
                            <th class="table__th date">Дата</th>
                            <th class="table__th pair-head">Пара</th>
                            <th class="table__th side">Тип</th>
                            <th class="table__th price-head">Цена</th>
                            <th class="table__th quantity-head">Количество</th>
                            <th class="table__th total-head">Всего</th>
                            <th class="table__th status-head">Статус</th>
                        </tr>
                        <tbody class='overflow'>
                            <tr v-for="order in closedOrders" :key="order.id" class="table__tr">
                                <td class="table__td date">{{ order.time | date }}</td>
                                <td class="table__td pair">{{ order.symbol }}</td>
                                <td 
                                    class="table__td side" 
                                    :class="order.side === 'BUY' ? 'text--success' : 'text--danger'"
                                    >{{ order.side }}({{ order.type }})</td>
                                <td class="table__td price">
                                    {{ order.type !== 'MARKET' ? order.price : (Number(order.cummulativeQuoteQty) / Number(order.origQty)).toFixed(order.price.length - 2) }}
                                </td>
                                <td class="table__td quantity">{{ order.origQty }}</td>
                                <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                                <td class="table__td status">{{ order.status }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="order__buttons">
                        <button @click.prevent="cancelAll(bot.botID)" class="button button--primary">Отменить и продать</button>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import SettingsManual from '~/components/NewBot/Manual';
import SettingsAutomatic from '~/components/NewBot/Automatic';
    export default {
        components: {
            SettingsManual,
            SettingsAutomatic
        },
        data() {
            return {
                isActive: true,
                currentComponent: null,
                isChanging: false
            }
        },
        filters: {
            date(value) {
                let date = new Date(value);
                return ((date.getMonth() < 9) ? '0' : '') + (date.getMonth() + 1) + '-' +
            ((date.getDate() < 10) ? '0' : '') + date.getDate() + ' ' + ((date.getHours() <= 9) ? '0' : '') + date.getHours() + ':' + ((date.getMinutes() <= 9) ? '0' : '') + date.getMinutes() + ':' + ((date.getSeconds() <= 9) ? '0' : '') + date.getSeconds()
            }
        },
        computed: {
            bot() {
                return this.$store.getters.getBot(this.$route.params.id)
            },
            openedOrders() {
                return this.bot.orders.filter(order => order !== null && (order.status === 'NEW' || order.status === 'PARTIALLY_FILLED'))
            },
            closedOrders() {
                return this.bot.orders.filter(order => order !== null && (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED'))
            }
        },
        watch: {
            'bot.status'(value) {
                this.$axios
                    .$post('/bots/setStatus', {
                        'botID': this.bot.botID,
                        'status': value,
                        'userID': this.$store.getters.getWsId
                    })
                    .then(res => {
                        if(res.status === 'ok') {
                            this.$store.dispatch('setBotsList')
                        } else {
                            this.bot.status = res.data.status;
                        }
                    })
                    .catch(e => console.log(e))
            }
        },
        methods: {
            cancelAll(id) {
                let answer = confirm('Точно выполнить данную операцию?');
                if(answer) {
                    this.$store.commit('setSpiner', true);
                    this.$axios
                        .$post('/bots/orders/cancelAll', {
                            'botID': id
                        })
                        .then( () => this.$store.commit('setSpiner', false) )
                }
            },
            refuseOrder(ordId, botId) {
                let answer = confirm('Точно выполнить данную операцию?');
                if(answer) {
                    this.$axios
                        .$post('/bots/orders/cancel', {
                            'botID': botId,
                            'orderId': ordId
                        })
                        .then( () => this.$store.commit('setSpiner', false) )
                }
            },
            setBotFreeze() {
                this.bot.freeze === '0' 
                ? this.bot.freeze = '1'
                : this.bot.freeze = '0'
                this.$axios
                    .$post('/bots/setFreeze', {
                        botID: this.bot.botID,
                        freeze: this.bot.freeze
                    })
            },
            onDeleteBot() {
                this.$store.dispatch('deleteBot', this.bot.botID)
            },
            onChangeSettings() {
                this.isChanging = true;
                this.bot.state === '1' 
                ? this.currentComponent = "SettingsManual"
                : this.currentComponent = "SettingsAutomatic"
            },
            onSaveSettings() {
                this.$store.commit('setSpiner', true);
                this.$axios
                    .$post('/bots/update', this.bot)
                    .then(res => {
                        if(res.data.status === 'ok') {
                            this.isSaved = true;
                            this.$store.commit('setSpiner', false);
                        } else {
                            console.log(res.message)
                            this.$store.commit('setSpiner', false);
                        }
                    })
                    .catch(e => console.log(e))
            },
            onUpdated() {
                this.isChanging = false;
                this.currentComponent = null;
            }
        }
    }
</script>

<style scoped>


/*    */


/* TABS BAR */

.overflow {
    display: block;
    max-height: 45vh;
    overflow-y: auto;
}

.tabs__bar{
    border-bottom: 1px solid #CECECE;
}

.tabs__item{
    display: inline-block;
    padding: 13px 14px;
    font-size: 14px;
    position: relative;
    cursor: pointer;
}

.tabs__content{
    padding: 0 14px;
}

.bots__right-settings{
    width: 100%;
    border: 1px solid #EFEFEF;
    padding: 2rem;
}

.settings__header{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.bots__name{
    font-size: 2.5rem;
    font-weight: 500;
}

.settings__type{
    color: #B4B4B4;
    font-size: 1.6rem;
    margin-left: 1rem;
}

.button__freeze{
    background: none;
    text-decoration: underline;
    font-weight: 500;
    font-size: 1.3rem;
    margin-right: 1.5rem;
}

.bots__buttons-status{
    display: flex;
    align-items: center;
    margin: 0 auto;
}

.settings__description{
    display: flex;
    flex-wrap: wrap;
}
.settings__item{
    width: 50%;
    margin-bottom: 2rem;
}
.settings__content,
.transactions__terms{
    margin-top: 1rem;
}

/* .transactions__terms .settings__input{
    width: 164px;
} */

.transactions__terms .settings__input:not(:first-of-type){
    margin-left: 2rem;
}

.transactions__terms .page__field{
    flex-direction: row;
    flex-wrap: wrap;
}
.transactions__terms .page__label{
    width: 100%;
}
.transactions__terms .table__td{
    padding: 2rem 1.5rem;
}
.transactions__terms .table__tr:last-child{
    border-bottom: 1px solid #E3E3E3;
}
.terms__recommendation{
    flex: 2;
}

.button__change-settings,
.button__remove-bot{
    background-color: #72C770;
}

.button__remove-bot{
    background-color:#D74C4C;
    margin-left: 2rem;
}

.bots__button{
    display: flex;
    justify-content: flex-end;
}

/* .pair,
.pair-head,
.quantity-head,
.quantity{
    flex: 0.7;
} */
/* .order__buttons{

} */
.button__cancel-sell,
.button__cancel{
    background-color: #DCDCDC;
    color: #000;
    margin-bottom: 1rem;

}

.button__cancel{
    margin-left: 1.5rem;
}

.settings__item,
.settings__item span{
    font-size: 1.5rem;
}
.settings__item{
    font-weight: 500;
}

.header__title{
    font-size: 2.5rem;
    font-weight: 500;

}
.add__header{
    border-bottom: 1px solid #DCDCDC;
    padding-bottom: 1.3rem;
    margin-bottom: 1rem;
}
</style>

