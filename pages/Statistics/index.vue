<template>
    <section class="container">
        <ul class="tabs">
            <li 
                @click="currentTab = 'opened'" 
                class="tabs__item"
                :style="currentTab === 'opened' ? 'backgroundColor: #eee' : ''"
            >Открытые сделки</li>
            <li 
                @click="currentTab = 'closed'" 
                class="tabs__item"
                :style="currentTab === 'closed' ? 'backgroundColor: #eee' : ''"
            >Завершенные</li>
            <label for="inpDate" class="dateSearch button button--primary">(Сортировка по дате)</label>
                    <input style="display: none" id="inpDate" type="checkbox" v-model="isDateSearch">
                    <input v-show="isDateSearch" type="date" id="start" name="trip-start"
                        v-model="searchDate1"
                        min="2017-01-01" max="2100-01-01">
                    <input v-show="isDateSearch" type="date" id="start" name="trip-start"
                        v-model="searchDate2"
                        min="2017-01-01" max="2100-01-01">
            <!-- <li 
                @click="currentTab = 'rejected'" 
                class="tabs__item"
                :style="currentTab === 'rejected' ? 'backgroundColor: #eee' : ''"
            >Ошибки</li> -->
        </ul>
        <div class="tabs__content">

            <div v-show="currentTab === 'opened'">
                <div v-for="deal in openedDeals" :key="deal.processId" class="deal-box">
                    <nuxt-link :to="'/Bots/' + deal.botID" class="nav__link">Бот - {{ deal.botTitle }} | {{ deal.symbol }} {{ deal.processId }} {{ deal.freeze === '1' ? "заморожен" : "" }}</nuxt-link>
                    <!-- <p>Бот - {{ deal.botTitle }} | {{ deal.symbol }} {{ deal.processId }} {{ deal.freeze === '1' ? "заморожен" : "" }}</p> -->
                    <table class="table">
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
                            <tr 
                                v-for="order in deal.orders" 
                                :key="order.id" 
                                class="table__tr"
                            >
                                <td class="table__td date">{{ order.time | date }}</td>
                                <td class="table__td pair">{{ order.symbol }}</td>
                                <td 
                                    class="table__td side" 
                                    :class="order.side === 'BUY' ? 'text--success' : 'text--danger'"
                                    >{{ order.side }}({{ order.type }})</td>
                                <td class="table__td price">{{ order.type !== 'MARKET' ? order.price : (Number(order.cummulativeQuoteQty) / Number(order.origQty)).toFixed(order.price.length - 2) }}</td>
                                <td class="table__td quantity">{{ order.origQty }}</td>
                                <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                                <td class="table__td status">{{ order.status }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>



            <div v-show="currentTab === 'closed'">
                <div v-for="deal in closedDeals" :key="deal.processId" class="deal-box">
                    <nuxt-link :to="'/Bots/' + deal.botID" class="nav__link">Бот - {{ deal.botTitle }} | {{ deal.symbol }} {{ deal.processId }} {{ deal.freeze === '1' ? "заморожен" : "" }}</nuxt-link>

                    <!-- <p>Бот - {{ deal.botTitle }} | {{ deal.symbol }} {{ deal.processId }} {{ deal.freeze === '1' ? "заморожен" : "" }}</p> -->
                    <table class="table">
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
                            <tr 
                                v-for="order in deal.orders" 
                                :key="order.id" 
                                class="table__tr"
                            >
                                <td class="table__td date">{{ order.time | date }}</td>
                                <td class="table__td pair">{{ order.symbol }}</td>
                                <td 
                                    class="table__td side" 
                                    :class="order.side === 'BUY' ? 'text--success' : 'text--danger'"
                                    >{{ order.side }}({{ order.type }})</td>
                                <td class="table__td price">{{ order.type !== 'MARKET' ? order.price : (Number(order.cummulativeQuoteQty) / Number(order.origQty)).toFixed(order.price.length - 2) }}</td>
                                <td class="table__td quantity">{{ order.origQty }}</td>
                                <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                                <td class="table__td status">{{ order.status }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    data() {
        return {
            isDateSearch: false,
            searchDate1: this.getDateNow(),
            searchDate2: this.getDateNow(),
            searchDateTs1: Date.now(),
            searchDateTs2: Date.now(),
            orders: [],
            currentTab: 'opened'
        }
    },
    filters: {
        date(value) {
            let date = new Date(value);
            return ((date.getMonth() < 9) ? '0' : '') + (date.getMonth() + 1) + '-' +
      ((date.getDate() < 10) ? '0' : '') + date.getDate() + ' ' + ((date.getHours() <= 9) ? '0' : '') + date.getHours() + ':' + ((date.getMinutes() <= 9) ? '0' : '') + date.getMinutes() + ':' + ((date.getSeconds() <= 9) ? '0' : '') + date.getSeconds()
        }
    },
    watch: {
        searchDate1() {
            this.searchDateTs1 = new Date(this.searchDate1).getTime();
        },
        searchDate2() {
            this.searchDateTs2 = new Date(this.searchDate2).getTime();
        }
    },
    methods: {
        getDateNow() {
            let date = new Date();
            let ret = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            return ret;
        },
        getDeals(dealFlag = '') {
            if(dealFlag) {
                
                let arr = [];
                let flag = (dealFlag === 'opened') ? true : false;

                this.statisticsList.forEach(bot => {
                    bot.processes.forEach(prc => {
                        if(prc.finallyStatus === flag && prc.orders.length) {
                            if(this.isDateSearch && prc.orders.length) {
                                let cdate = new Date(prc.orders[0].time),
                                    cd = cdate.getDate(),
                                    cm = cdate.getMonth(),
                                    cy = cdate.getFullYear(),
                                    sdate1 = new Date(this.searchDateTs1),
                                    sd1 = sdate1.getDate(),
                                    sm1 = sdate1.getMonth(),
                                    sy1 = sdate1.getFullYear(),
                                    sdate2 = new Date(this.searchDateTs2),
                                    sd2 = sdate2.getDate(),
                                    sm2 = sdate2.getMonth(),
                                    sy2 = sdate2.getFullYear();

                                if(sy1 !== sy2 && cy >= sy1 && cy <= sy2) {
                                    arr.push(prc);
                                } else if(sy1 === sy2 && cy === sy1){
                                    if(sm1 !== sm2 && cm >= sm1 && cm <= sm2) {
                                        arr.push(prc);
                                    } else if(sm1 === sm2 && cm === sm1) {
                                        if(cd >= sd1 && cd <= sd2) {
                                            arr.push(prc);
                                        }
                                    }
                                }
                            } else {
                                arr.push(prc);
                            }
                        }
                    });
                });
                arr.sort( (a, b) => {
                    if(a.orders.length && b.orders.length) {
                        return b.orders[0].time - a.orders[0].time;
                    } else {
                        return b.processId - a.processId;
                    }
                })
                return arr;
            }
            return [];
        }
    },
    computed: {
        closedDeals() {
            return this.getDeals('closed');
        },
        openedDeals() {
            return this.getDeals('opened');
        },
        statisticsList() {
            return this.$store.getters.getStatisticsList || [];
        }
    },
    created() {
    }
}
</script>

<style scoped>

.dateSearch {
    margin: 0 10px 0 10px;
}

.overflow {
    /* display: block;
    max-height: 75vh;
    overflow-y: auto; */
}

.deal-box {
    padding: 1rem;
    width: 100%;
    margin-top: 3rem;
    margin-bottom: 3rem;
    border: 1px solid black;
}
</style>
