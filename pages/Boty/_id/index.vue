<template>
    <div>
        <div v-if="getStatus === 'confirm' || getStatus === 'confirmOrders' || getStatus === 'confirmCurrent' || getStatus === 'deleteBot'" class='confirm-block' @click="checkWindow">
            <div class='confirm-block__content'>
                <p>{{ statusAlert[getStatus] }}</p>
                <div class='confirm-block__buttons-box'>
                    <button
                        class='button button--success'
                        @click='onConfirm'>Да
                    </button>
                    <button
                        class='button'
                        @click='onCancel'>Нет
                    </button>
                </div>
            </div>
        </div>
        <section class="bots__right-settings bot__manual">
            <div class="settings__header">
                <h1 class="bots__name">{{ bot.title }}</h1>
                <span v-if="bot.state === '0'" class="settings__type">(Автоматический)</span>
                <span v-else class="settings__type">(Ручной)</span>
                <div class="bots__buttons-status">
                    <!-- Send request to server -->
                    <button @click.prevent="setBotFreeze"
                        class="button button--primary button__freeze"
                        >{{ bot.freeze == '1' ? 'Разморозить' : 'Заморозить'}}</button>
                    <label class="checkbox">
                        <input
                            @change.prevent="setStatus(bot.status)"
                            type="checkbox"
                            class="checkbox__input button__status"
                            v-model="bot.status"
                            >
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
                    <p class="settings__item">Основная пара:
                        <span>{{ bot.pair.to }}</span>
                    </p>
                    <p class="settings__item">Котируемая пара:
                        <span>{{ bot.pair.from }}</span>
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
                        <!-- <p class="settings__item">Дневной объем(BTC): 
                            <span>{{ bot.botSettings.dailyVolumeBTC }}</span>
                        </p> -->
                        <p class="settings__item">Начальный ордер: 
                            <span>{{ bot.botSettings.initialOrder }}</span>
                        </p>
                        <p class="settings__item">Стоп лосс:  
                            <span>{{ bot.botSettings.stopLoss }}%</span>
                        </p>
                        <p class="settings__item">Тейк профит:  
                            <span>{{ bot.botSettings.takeProfit }}%</span>
                        </p>
                        <p class="settings__item"> Список пар: </p>
                        <div class="symbols-list">
                            <div v-for="symbol in bot.pair.requested" :key="symbol">{{ symbol }}</div>
                        </div>
                        <p class="settings__item">Условия для начала сделки:</p>
                        <div class="table_container">
                            <table class="table">
                                <tbody v-if="bot.botSettings.curTradingSignals.length === 0">
                                    <tr class="table__tr" v-for="(signal,index) in bot.botSettings.tradingSignals" :key="signal.id">
                                        <td class="table__td">{{ index + 1 }}. {{ signal.signal }}</td>
                                        <td class="table__td">{{ signal.timeframe }}</td>
                                        <td class="table__td">{{ signal.checkRating }}</td>
                                    </tr>
                                </tbody>
                                <tbody v-else>
                                    <tr class="table__tr" v-for="(signal,index) in bot.botSettings.curTradingSignals" :key="signal.id">
                                        <td class="table__td">{{ index + 1 }}. {{ signal.signal }}</td>
                                        <td class="table__td">{{ signal.symbol }}</td>
                                        <td class="table__td">{{ signal.timeframe }}</td>
                                        <td class="table__td">{{ signal.checkRating }}</td>
                                        <td class="table__td cur_rating">{{ signal.rating }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                </div>
                <div>
                    <component @changed="onUpdated" :bot="bot" :is="currentComponent"></component>
                </div>
                <div v-show="!isChanging" class="bots__button">
                    <!-- :disabled="!isBotHasOrders" -->
                    <button  :class="{'button--disabled': (isBotHasOrders.length > 0)}" @click="onChangeSettings" class="button button--success button__change-settings">Изменить настройки</button>
                    <button @click="onDeleteBot" class="button button--danger button__remove-bot">Удалить бота</button>
                </div>
            </div>
            <div class='bots__log' v-if='Object.keys(this.bot.processes).length'>
                <ul class="procceses-list">
                    <li 
                        v-for='(log, index) in Object.keys(bot.processes)'
                        :id='index'
                        :key='index'
                        class="processes_tab"
                        :class='{active: currentLogId === log, isNotActive: !bot.processes[log].runningProcess }'
                        @click='fillingInfo(log, $event)'
                    >{{bot.processes[log].symbol}}</li>
                </ul>                
            </div>


            <div class="bots__order" v-if='isActiveTabOrders'>
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
                        <tbody 
                            class='overflow'  
                            v-if='Object.keys(this.bot.processes).length'
                        >
                            <tr v-for="order in openedOrders"
                                :key="order.id"
                                class="table__tr"
                            >
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
                                    <button 
                                        @click.prevent="refuseCurrentOrder(order.orderId, bot.botID)"
                                        v-if='bot.processes[currentId].runningProcess'
                                        class="button table__button button--primary"
                                    >Отменить</button>
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
                        <tbody class='overflow' v-if='Object.keys(this.bot.processes).length'>
                            <tr 
                                v-for="order in closedOrders" 
                                :key="order.id" 
                                class="table__tr"
                            >
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
                    <div class="btc-box"> 
                        <div class="order__buttons" v-if='Object.keys(this.bot.processes).length'>
                            <button 
                                @click.prevent="cancelAll" 
                                class="button button--primary"
                                v-if='bot.processes[currentId].runningProcess'
                            >Отменить и продать</button>
                        </div>
                        <div class="order__buttons" v-if='Object.keys(this.bot.processes).length'>
                            <button 
                                @click.prevent="cancelAllOrders" 
                                class="button button--primary"
                                v-if='bot.processes[currentId].runningProcess'
                            >Отменить все ордера</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <div 
            class="log" 
            v-if='lines && isActiveTabOrders' 
        >
            <div class="log-line" 
                v-for="line in lines" :key="line"
                >{{line}}</div>
        </div>
    </div>
</template>

<script>
let oldHref = location.href;
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
                isChanging: false,
                tmpOrd: null,
                tmpBotId: null,
                currentLogId: 0,
                currentSpecId: 0,
                isActiveProcesses: true,
                isActiveTabOrders: false,
                statusAlert: {
                    confirm: 'Вы точно хотите отменить все ордера и продать все монеты по рыночной цене?',
                    confirmOrders: 'Вы точно хотите отменить все ордера?',
                    confirmCurrent: 'Вы точно хотите отменить ордер?',
                    deleteBot: 'Вы точно хотите отменить все ордера, продать все монеты по рыночной цене и удалить бота?'
                },
                prcs: {}
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
            currentId() {
                if( Object.keys(this.bot.processes).length ) return Object.keys(this.bot.processes)[this.currentSpecId];
                else {
                    this.isActiveProcesses = false;
                    return '';
                }
            },
            isBotHasOrders() {
                if( this.currentId )
                    return this.bot.processes[this.currentId].orders.length &&
                        this.bot.processes[this.currentId].orders.filter(order => order && order.status !== 'CANCELED' &&  (order.status === 'NEW' || order.status === 'PARTIALLY_FILLED')).length
                else return [];        
            },
            bot() {
                return this.$store.getters.getBot(this.$route.params.id)
            },
            openedOrders() {
                if( this.currentId )
                    return this.bot.processes[this.currentId].orders.filter(order => order !== null && order.status !== 'CANCELED' && (order.status === 'NEW' || order.status === 'PARTIALLY_FILLED'))
                else return []; 
            },
            closedOrders() {
                if( this.currentId )
                    return this.bot.processes[this.currentId].orders.filter(order => order !== null && order.status !== 'CANCELED' && (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED'))
                else return []; 
            },
            clientAnswer() {
                return this.$store.getters.getClientAnswer;
            },
            getStatus() {
                return this.$store.getters.getStatus;
            },
            lines() {
                return this.currentId && this.prcs[this.currentId] && this.prcs[this.currentId].log;
            }

        },
        watch: {
            // '$route'(to, from) {
            //     console.log(`currentLogId - ${this.currentId}`)
            // }
        },
        methods: {
            fillingInfo(id, event) {
                this.currentLogId = id;
                this.currentSpecId = +event.target.getAttribute('id');
                // this.lines = this.bot.processes[id].log;
                this.isActiveTabOrders = true;
            },  
            setStatus(value) {
                this.$axios
                    .$post('/bots/setStatus', {
                        'botID': this.bot.botID,
                        'status': value,
                        'userID': this.$store.getters.getWsId
                    })
                    .then(res => {
                        this.checkStatus(res);
                    })
                    .catch(e => console.log(e))
            },
            checkWindow(event) {
                if (event.target.getAttribute('class') === 'confirm-block') {
                    this.$store.commit('clearStatus');
                }
            },
            checkStatus(res) {
                if(res.status === 'ok') {
                    // this.$store.dispatch('setBotsList');
                }
                else if(res.status === 'info') {
                    this.$store.commit('setMessage', res.message);
                    this.$store.commit('setStatus', res.status);
                } else {
                    this.$store.commit('setMessage', res.message);
                    this.$store.commit('setStatus', res.status);
                    this.bot.status = res.data.status;
                }
            },
            onConfirm() {
                if( this.getStatus === 'confirm') {
                    this.$store.commit('setClientAnswer', 'accept');
                    this.cancelAll();
                } else if( this.getStatus === 'confirmOrders') {
                    this.$store.commit('setClientAnswer', 'acceptOrders');
                    this.cancelAllOrders();
                } else if( this.getStatus === 'confirmCurrent' ) {
                    this.$store.commit('setClientAnswer', 'acceptCurrent');
                    this.refuseOrder();
                } else if( this.getStatus === 'deleteBot') {
                    this.$store.commit('setClientAnswer', 'acceptDeleteBot');
                    this.onDeleteBot();
                }
                this.onCancel();
                this.$store.commit('clearAnswer');
            },
            onCancel() {
                this.$store.commit('clearStatus');
            },
            cancelAll() {
                this.$store.commit('setStatus', 'confirm');
                if(this.clientAnswer === 'accept') {
                    // this.$store.commit('setSpiner', true);
                    this.$axios
                        .$post('/bots/orders/cancelAll', {
                            'botID': this.bot.botID,
                            'processeId': this.currentId
                        })
                        .then( res => {
                            // this.$store.commit('setSpiner', false)
                            this.checkStatus(res);
                        })
                }
            },
            cancelAllOrders() {
                this.$store.commit('setStatus', 'confirmOrders');
                if(this.clientAnswer === 'acceptOrders') {
                    // this.$store.commit('setSpiner', true);
                    this.$axios
                        .$post('/bots/orders/cancelAllOrders', {
                            'botID': this.bot.botID,
                            'processeId': this.currentId
                        })
                        .then( res => {
                            // this.$store.commit('setSpiner', false)
                            this.checkStatus(res);
                        })
                }
            },
            onDeleteBot() {
                this.$store.commit('setStatus', 'deleteBot');
                if(this.clientAnswer === 'acceptDeleteBot') {
                    this.$store.dispatch('deleteBot', this.bot.botID)
                }
            },
            refuseCurrentOrder(ordId, botId) {
                this.tmpOrd = ordId;
                this.tmpBotId = botId;
                this.refuseOrder();
            },
            refuseOrder() {
                this.$store.commit('setStatus', 'confirmCurrent');
                if(this.clientAnswer === 'acceptCurrent') {
                    this.$axios
                        .$post('/bots/orders/cancel', {
                            'botID': this.tmpBotId,
                            'orderId': this.tmpOrd,
                            'processeId': this.currentId
                        })
                        // .then( () => this.$store.commit('setSpiner', false) )
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
                    .then( (res) => this.$store.commit('setBotFreeze', res.data.freeze))
            },
            onChangeSettings() {
                // this.$store.isСonfigurationProcess = true;
                this.$store.commit('setСonfigurationProcess', true);

                this.isChanging = true;
                this.bot.state === '1'
                    ? this.currentComponent = "SettingsManual"
                    : this.currentComponent = "SettingsAutomatic"
            },
            onSaveSettings() {
                console.log('ОЛЯЛЯ')
                // this.$store.commit('setSpiner', true);
                // let nextBotSettings = {
                //     botID: this.bot.botID,
                //     title: this.bot.title,
                //     pair: this.bot.pair,
                //     initialOrder: this.bot.botSettings.initialOrder,
                //     safeOrder: this.bot.botSettings.safeOrder,
                //     stopLoss: this.bot.botSettings.stopLoss,
                //     takeProfit: this.bot.botSettings.takeProfit,
                //     tradingSignals: this.bot.botSettings.tradingSignals,
                //     maxOpenSafetyOrders: this.bot.botSettings.maxOpenSafetyOrders,
                //     deviation: this.bot.botSettings.deviation
                // };
                // console.log(nextBotSettings)
                // this.$axios
                //     .$post('/bots/update', nextBotSettings)
                //     .then(res => {
                //         if(res.data.status === 'ok') {
                //             this.isSaved = true;
                //             this.$store.commit('setSpiner', false);
                //         } else {
                //             console.log(res.message)
                //             this.$store.commit('setSpiner', false);
                //         }
                //     })
                //     .catch(e => console.log(e))
            },
            onUpdated() {
                this.isChanging = false;
                this.currentComponent = null;
            },
            getLog() {
                let data = {
                    botID: this.bot.botID,
                    processes: Object.keys(this.bot.processes)
                }

                this.$axios.post(`/api/bots/getBotLog`, data)
                    .then(data => {
                        data = data.data;
                        if(data.status === 'ok') {
                            data.data.forEach(elem => {
                                let log = elem.log.split('\r\n');
                                this.prcs[elem.processeId] || (this.prcs[elem.processeId] = { log: []});
                                this.prcs[elem.processeId].log = log.reverse();
                            });
                            if(this.$route.params.id) {
                                setTimeout(() => {
                                    this.getLog();
                                }, 5000);   
                            }
                        }
                    })
                    .catch(err => console.log(err));
            }
        },
        created() {
            this.getLog();
        }
    }
</script>

<style scoped>

.procceses-list {
    /* display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start; */
}

.btc-box {
    display: flex;
}
.btc-box > div {
    margin: 1rem;
}

.active {
    background-color: rgb(238, 238, 238) !important;
}

.isNotActive {
    background-color:#CECECE; 
}

.processes_tab {
    border: solid 1px rgb(238, 238, 238); 
    border-radius: 1px;
}

.bots__log {
    width: 100%;
    height: 5rem;
    overflow-x: auto;
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
}

.bots__log span {
    font-weight: 500;
    font-size: 2rem;
    margin-right: 2rem;
}

.bots__log ul {
    display: flex;
    flex-direction: row;
    width: 100%;
    overflow-x: auto;
}

.bots__log ul li {
    list-style: none;
    text-decoration: none;
    cursor: pointer;
    margin-left: 1.5rem;
    font-size: 1.6rem;
    padding: 1rem;
}

.bots__log ul li:first-child {
    margin-left: 0;
}

.cur_rating {
    background-color: #f1f1f1;
}

.symbols-list {
    margin-bottom: 1rem;
    width: 100%;
    display: flex;
    border: 1px solid #efefef;
    padding: 1rem;
}

.symbols-list > div {
    margin-right: 0.5rem;
    margin-left: 0.5rem;
}

.table_container {
    margin-bottom: 1rem;
    width: 100%;
    min-height: 100px;
    max-height: 300px;
    overflow-y: auto;
}

.log {
    word-wrap: break-word;
    padding: 1rem;
    max-height: 200px;
    min-height: 100px;
    overflow: auto;
    border: 1px solid #EFEFEF;
    padding: 2rem;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
}

.log-line {
    margin: 0.5rem;
}

.confirm-block {
    display: block;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
}

.confirm-block__content {
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 60%;
}

.confirm-block__content p {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.confirm-block__buttons-box {
    display: flex;
    justify-content: center;
}

.button:not(:last-child) {
    margin-right: 25px;
}

.confirm-block__buttons-box button{
    height: 3rem;
    width: 10rem;
}
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
