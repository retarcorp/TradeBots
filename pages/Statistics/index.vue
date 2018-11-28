<template>
    <section class="container">
        <div class="form-control newBot__settings-control">
            <label class="label" for="main__pair">Статус:</label>
            <select 
                v-model="statusFilter" 
                type="text" 
                class="input settings__input"
                >
                <option value="-2">Все</option>
                <option value="0">В процессе</option>
                <option value="1">Выполненые</option>
                <option value="2">Отменены</option>
                <option value="-1">Ошибки</option>
            </select>
            <label class="label" for="main__pair">Поиск</label>
            <div class="bots__search-wrapper">
                <input v-model="search" type="text" class="input bots__search">
            </div>
        </div>
        <label for="inpDate" class="dateSearch button button--primary">(Сортировка по дате)</label>
            <input style="display: none" id="inpDate" type="checkbox" v-model="isDateSearch">
            <input v-show="isDateSearch" type="date" id="start" name="trip-start"
                v-model="searchDate1"
                min="2017-01-01" max="2100-01-01">
            <input v-show="isDateSearch" type="date" id="start" name="trip-start"
                v-model="searchDate2"
                min="2017-01-01" max="2100-01-01">
        <table class="table">
            <tr class="table__tr">
                <th class="table__th date">Название</th>
                <th class="table__th pair-head">Пара</th>
                <th class="table__th side">Тейкпрофит</th>
                <th class="table__th price-head">Объемы</th>
                <th class="table__th quantity-head">Статус</th>
                <th class="table__th total-head">Время</th>
            </tr>
            <tbody>
                <tr v-for="(deal, i) in filteredDealList"
                    :key="i"
                    class="table__tr"
                >
                    <td class="table__td title">{{ deal.botTitle }}</td>
                    <td class="table__td pair">{{ deal.symbol }}</td>
                    <td class="table__td income">{{ deal.stats && noExponents(deal.stats.income) }}</td>
                    <td class="table__td volume">{{ deal.stats && noExponents(deal.stats.volume) }}</td>
                    <td class="table__td status">{{ deal.stats && getDealStatus(deal.finalProcessStatus) }}</td>
                    <td class="table__td status">{{ deal.stats && getDate(deal.stats.endTime) }}</td>
                </tr>
            </tbody>
        </table>
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
            statusFilter: 0,
            currentTab: 'opened',
            search: '',
            symbolsA: ['BTC', 'BNB', 'ETH', 'USDT']
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
        getDealStatus(finalProcessStatus = -2) {
            if(finalProcessStatus === 0) return 'В процессе';
            if(finalProcessStatus === 1) return 'Выполнен';
            if(finalProcessStatus === 2) return 'Отменен';
            if(finalProcessStatus === -1) return 'Ошибка';
            if(finalProcessStatus === -2) return 'Нейтрально';
            return '';
        },
        getDate(date = Date.now()) {
            date = new Date(date);
            let hh = String(date.getHours()),
                ss = String(date.getSeconds()),
                DD = String(date.getDate()),
                mm = String(date.getMinutes()),
                MM = String(date.getMonth() + 1),
                YYYY = date.getUTCFullYear();

            hh = hh.length < 2 ? '0' + hh : hh;
            mm = mm.length < 2 ? '0' + mm : mm;
            ss = ss.length < 2 ? '0' + ss : ss;
            DD = DD.length < 2 ? '0' + DD : DD;
            MM = MM.length < 2 ? '0' + MM : MM;

            return `${hh}:${mm}:${ss} ${DD}.${MM}.${YYYY}`;
        },
        getDateNow() {
            let date = new Date();
            let ret = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            return ret;
        },
        getStatistics(prc = {}) {
            let sellOrder, income = 0, volume = 0, findFlag = false, endTime = 0;
            let ret = {};
            for (let i = 0; i < prc.orders.length; i++) {
                let order = prc.orders[i];
                if(order.side === 'SELL' && order.status !== 'CANCELED' && !findFlag) {
                    sellOrder = order;
                    findFlag = true;
                    endTime = order.time;
                }
                if(order.side === "BUY" && order.status === "FILLED") {
                    income -= Number(order.cummulativeQuoteQty) * (1 - 0.001);
                    volume += Number(order.cummulativeQuoteQty);
                }
                if(order.side === "SELL" && order.status === "FILLED") {
                    income += Number(order.cummulativeQuoteQty) * (1 - 0.001);
                }
            }
            if(!endTime && prc.orders && prc.orders.length) {
                endTime = prc.orders[prc.orders.length - 1].time;
            }
            if(sellOrder) {
                ret = {
                    value: sellOrder.cummulativeQuoteQty,
                    income, volume, endTime
                };
            }
            return ret;
        },
        noExponents(number = 0) {
            var data = String(number).split(/[eE]/);
            if (data.length == 1) return Number(data[0]).toFixed(8);
            return number.toFixed(8);
            // var z = '',
            //     sign = number < 0 ? '-' : '',
            //     str = data[0].replace('.', ''),
            //     mag = Number(data[1]) + 1;

            // if (mag < 0) {
            //     z = sign + '0.';
            //     while (mag++) z += '0';
            //     return z + str.replace(/^\-/, '');
            // }
            // mag -= str.length;
            // while (mag--) z += '0';
            // return str + z;
        },
        getDeals(dealFlag = -2) {
            let arr = [];
            let flag = (dealFlag === 'opened') ? true : false;

            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
                    if(prc.orders.length && ((!dealFlag) || ( (dealFlag == -2) || prc.finalProcessStatus == dealFlag)) ) {
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
                                prc.stats = this.getStatistics(prc);
                                arr.push(prc);
                            } else if(sy1 === sy2 && cy === sy1){
                                if(sm1 !== sm2 && cm >= sm1 && cm <= sm2) {
                                    prc.stats = this.getStatistics(prc);
                                    arr.push(prc);
                                } else if(sm1 === sm2 && cm === sm1) {
                                    if(cd >= sd1 && cd <= sd2) {
                                        prc.stats = this.getStatistics(prc);
                                        arr.push(prc);
                                    }
                                }
                            }
                        } else {
                            prc.stats = this.getStatistics(prc);
                            arr.push(prc);
                        }
                    }
                });
            });
            arr.sort( (a, b) => {
                return b.stats.endTime - a.stats.endTime;
            })
            return arr;
        }
    },
    computed: {
        deals() {
            return this.getDeals(Number(this.statusFilter));
        },
        filteredDealList() {
            return this.deals.filter(deal => {
                let a = deal.botTitle ? deal.botTitle : '',
                    b = deal.symbol ? deal.symbol : '',
                    c = deal.botID ? deal.botID : '';
                let string = `${a.toLowerCase()}${b.toLowerCase()}${c.toLowerCase()}`;
                return string.indexOf(this.search.toLowerCase()) >= 0;
            })
        },
        closedDeals() {
            return this.getDeals(2);
        },
        endedDeals() {
            return this.getDeals(1);
        },
        openedDeals() {
            return this.getDeals(0);
        },
        errorDeals() {
            return this.getDeals(-1);
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
