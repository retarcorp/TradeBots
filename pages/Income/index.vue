<template>
    <section class="container">

        <div class="bots__order incomes__common">
            <div class="incomes__title title--big">Доход за сегодня</div>
            <div class="income-list" v-for="(value, key) in dayIncome" :key="key">
                <p class="title--medium">{{ key }}: {{ noExponents(value) }}</p>
            </div>
        </div>

        <div class="bots__order incomes__common">
            <div class="incomes__title title--big">Доход за все время</div>
            <div class="income-list" v-for="(value, key) in allIncome" :key="key">
                <p class="title--medium">{{ key }}: {{ noExponents(value) }}</p>
            </div>
        </div>

        <div v-show="isDateSearch" class="bots__order incomes__common">
            <div class="incomes__title title--big">Доход за {{searchDate1}} - {{searchDate2}}</div>
            <div class="income-list" v-for="(value, key) in dateSearchIncome" :key="key">
                <p class="title--medium">{{ key }}: {{ noExponents(value) }}</p>
            </div>
        </div>



        <p class="bots-income-title">Доход по сделкам:</p>

        <div class="bot-income-box">
            <div class="bot-tabs jsc">
                <div class="bot-income-block tabs__item">
                    <p>Бот / Пара: </p>
                </div> 
                <div class="bot-income-block tabs__item">
                    <p>Объемы: </p>
                </div>
                <div class="bot-income-block tabs__item">
                    <p>Прибыль: </p>
                </div>
                <div class="bot-income-block tabs__item">
                    <label>Дата:</label>
                    <label for="inpDate" class="dateSearch button button--primary">(Сортировка по дате)</label>
                    <input style="display: none" id="inpDate" type="checkbox" v-model="isDateSearch">
                    <input v-show="isDateSearch" type="date" id="start" name="trip-start"
                        v-model="searchDate1"
                        min="2017-01-01" max="2100-01-01">
                    <input v-show="isDateSearch" type="date" id="start" name="trip-start"
                        v-model="searchDate2"
                        min="2017-01-01" max="2100-01-01">
                </div>
            </div>
            <div v-for="prcIncome in processesIncome" :key="prcIncome.botID" class="bot-income bot-tabs jsc">
                <div class="bot-income-block tabs__item">
                    <p>{{ prcIncome.botTitle }} / {{ prcIncome.symbol }}</p>
                </div> 
                <div class="bot-income-block tabs__item">
                    <p v-for="(inc, _key) in prcIncome.volume" :key="_key">
                        {{ _key }}: {{ noExponents(inc) }}
                    </p>
                    <p>USD: {{getUSDPrice(prcIncome.curSymbol, prcIncome.volume[prcIncome.curSymbol])}}</p>
                </div>
                <div class="bot-income-block tabs__item">
                    <p v-for="(inc, _key) in prcIncome.income" :key="_key">
                        {{ _key }}: {{ noExponents(inc) }}
                    </p>
                    <p>USD: {{getUSDPrice(prcIncome.curSymbol, prcIncome.income[prcIncome.curSymbol])}}</p>
                </div>
                <div class="bot-income-block tabs__item">
                    <p>{{ getDate(prcIncome.endTime) }}</p>
                </div>
            </div>
        </div>

        <!-- <p class="bots-income-title">Доход по ботам:</p> -->
        <!-- <div class="bot-income-box">
            <div v-for="botIncome in botsIncome" :key="botIncome.botID" class="bot-income">
                <p>Бот - {{ botIncome.title }} ({{ botIncome.botID }})</p>
                <div class="income-list" v-for="(value, key) in botIncome.income" :key="key">
                    <p class="title--medium">{{ key }}: {{value}}</p>
                </div>
            </div>
        </div> -->



        <!-- <div class="bots__order incomes">
            <div class="incomes__title title--big">Доход за Сегодня</div>
            <div class="income-list" v-for="symbol in income.dayIncome" :key="symbol.name">
                <p class="title--medium">Пара: {{ income.allIncome[symbol.name].name }}: {{income.dayIncome[symbol.name].value}}</p>
            </div>
        </div>
        <div class="bots__order incomes__common">
            <div class="incomes__title title--big">Доход за все время</div>
            <div class="income-list" v-for="symbol in income.allIncome" :key="symbol.name">
                <p class="title--medium">Пара: {{ income.allIncome[symbol.name].name }}: {{ income.allIncome[symbol.name].value }}</p>
            </div>
        </div> -->
    </section>
</template>

<script>
export default {
    data() {
        return {
            isDateSearch: false,
            income: {
                dayIncome: {},
                allIncome: {}
            },
            searchDate1: this.getDateNow(),
            searchDate2: this.getDateNow(),
            searchDateTs1: Date.now(),
            searchDateTs2: Date.now(),
            symbolsA: ['BTC', 'BNB', 'ETH', 'USDT']
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
    computed: {
        statisticsList() {
            return this.$store.getters.getStatisticsList || [];
        },
        // usdExh() {
        //     return this.$store.getters.getUsdExh || 0;
        processesIncome() {
            let arr = [];
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED', day = 86400000;

            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus && prc.orders.length) {
                        let curSymbol = '',
                            sCurSymbol = '';
                        for(let i = 0; i < this.symbolsA.length; i++) {
                            let p = prc.symbol.indexOf(this.symbolsA[i]);
                            if(p > 1) {
                                curSymbol = this.symbolsA[i];
                                sCurSymbol = prc.symbol.replace(curSymbol, '');
                            } 
                        }


                        let endTime = 0;
                        for (let i = 0; i < prc.orders.length; i++) {
                            if(prc.orders[i].side === 'SELL' && prc.orders[i].status === 'FILLED') {
                                endTime = prc.orders[i].time;
                                break;
                            }
                        }
                        if(!endTime && prc.orders.length) {
                            endTime = prc.orders[prc.orders.length - 1].time;
                        }

                        let prcIncome = {
                            botTitle: prc.botTitle,
                            botID: bot.botID,
                            processId: prc.processId,
                            endTime,
                            volume: {},
                            curSymbol: curSymbol,
                            sCurSymbol: sCurSymbol,
                            symbol: prc.symbol,
                            income: {}
                        }

                        if(!prcIncome.income[curSymbol]) {
                            prcIncome.income[curSymbol] = 0;
                        }
                        if(!prcIncome.volume[curSymbol]) {
                            prcIncome.volume[curSymbol] = 0;
                        }

                        // if(!prcIncome.income[sCurSymbol]) {
                        //     prcIncome.income[sCurSymbol] = 0;
                        // }
                        // if(!prcIncome.volume[sCurSymbol]) {
                        //     prcIncome.volume[sCurSymbol] = 0;
                        // }

                        prc.orders.forEach(order => {
                            if(order.side === BUY && order.status === FILLED) {
                                prcIncome.income[curSymbol] -= Number(order.cummulativeQuoteQty) * (1 - 0.001);
                                prcIncome.volume[curSymbol] += Number(order.cummulativeQuoteQty);


                                // prcIncome.income[sCurSymbol] -= Number(order.executedQty);
                                // prcIncome.volume[sCurSymbol] += Number(order.executedQty);

                            } else if(order.side === SELL && order.status === FILLED) {
                                prcIncome.income[curSymbol] += Number(order.cummulativeQuoteQty) * (1 - 0.001);
                                // prcIncome.income[sCurSymbol] += Number(order.executedQty);
                            }
                                
                        });
                        
                        if(curSymbol === 'USDT') prcIncome.income[curSymbol] = Number(prcIncome.income[curSymbol].toFixed(4)); 
                        // else prcIncome.income[curSymbol] = Number(prcIncome.income[curSymbol].toFixed(5));

                        // if(sCurSymbol === 'USDT') prcIncome.income[sCurSymbol] = Number(prcIncome.income[sCurSymbol].toFixed(4)); 
                        // else prcIncome.income[sCurSymbol] = Number(prcIncome.income[sCurSymbol].toFixed(5));

                        if(curSymbol === 'USDT') prcIncome.volume[curSymbol] = Number(prcIncome.volume[curSymbol].toFixed(4)); 
                        // else prcIncome.volume[curSymbol] = Number(prcIncome.volume[curSymbol].toFixed(5));

                        // if(sCurSymbol === 'USDT') prcIncome.volume[sCurSymbol] = Number(prcIncome.volume[sCurSymbol].toFixed(4)); 
                        // else prcIncome.volume[sCurSymbol] = Number(prcIncome.volume[sCurSymbol].toFixed(5));
                        if(prcIncome.income[curSymbol] !== 0) {
                            if(this.isDateSearch) {
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
                                    arr.push(prcIncome);
                                } else if(sy1 === sy2 && cy === sy1){
                                    if(sm1 !== sm2 && cm >= sm1 && cm <= sm2) {
                                        arr.push(prcIncome);
                                    } else if(sm1 === sm2 && cm === sm1) {
                                        if(cd >= sd1 && cd <= sd2) {
                                            arr.push(prcIncome);
                                        }
                                    }
                                }
                            } else {
                                arr.push(prcIncome);
                            }
                        }
                    }
                });
            });

            arr.sort( (a, b) => {
                return b.endTime - a.endTime;
            })
            return arr;
        },
        botsIncome() {
            let arr = [];
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED',
                fixedUSD = 4,
                fixed = 6;

            this.statisticsList.forEach(bot => {
                let botIncome = {
                    botID: bot.botID,
                    title: bot.title,
                    income: {}
                };

                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus && prc.orders.length) {
                        let curSymbol = '',
                            sCurSymbol = '';

                        for(let i = 0; i < this.symbolsA.length; i++) {
                            let p = prc.symbol.indexOf(this.symbolsA[i]);
                            if(p > 1) {
                                curSymbol = this.symbolsA[i];
                                sCurSymbol = prc.symbol.replace(curSymbol, '');
                                // sCurSymbol = this.symbolsA[i].replace(curSymbol, '');
                            }
                        }
                        if(!botIncome.income[curSymbol]) {
                            botIncome.income[curSymbol] = 0;
                        }

                        prc.orders.forEach(order => {
                            if(order.side === BUY && order.status === FILLED) {
                                botIncome.income[curSymbol] -= Number(order.cummulativeQuoteQty) * (1 - 0.001);
                                botIncome.income[sCurSymbol] -= Number(order.executedQty) * (1 - 0.001);
                            } else if(order.side === SELL && order.status === FILLED) {
                                botIncome.income[curSymbol] += Number(order.cummulativeQuoteQty) * (1 - 0.001);
                                botIncome.income[sCurSymbol] += Number(order.executedQty) * (1 - 0.001);
                            }
                        });
                        if(curSymbol === 'USDT') botIncome.income[curSymbol] = Number(botIncome.income[curSymbol].toFixed(fixedUSD)); 
                        // else botIncome.income[curSymbol] = Number(botIncome.income[curSymbol].toFixed(fixed));
                        if(sCurSymbol === 'USDT') botIncome.income[sCurSymbol] = Number(botIncome.income[sCurSymbol].toFixed(fixedUSD)); 
                        // else botIncome.income[sCurSymbol] = Number(botIncome.income[sCurSymbol].toFixed(fixed));
                    }
                });
                
                arr.push(botIncome);
            });
            return arr;
        },
        dateSearchIncome() {
            let income = {};
            if(this.isDateSearch) {
                const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';
                
                let prc = this.processesIncome || [];
                prc.forEach(inc => {
                    !income[inc.curSymbol] && (income[inc.curSymbol] = 0);
                    income[inc.curSymbol] += Number(inc.income[inc.curSymbol]);
                });
            } 
            return income;
        },
        dayIncome() {
            let income = {};
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';
            const oneDay = 86400000,
                curDay = Date.now(),
                prevDay = curDay - oneDay;
            
            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus && prc.orders.length) {
                        let curSymbol = '';

                        for(let i = 0; i < this.symbolsA.length; i++) {
                            let p = prc.symbol.indexOf(this.symbolsA[i]);
                            if(p > 1) {
                                curSymbol = this.symbolsA[i];
                            }
                                                    }
                        if(!income[curSymbol]) {
                            income[curSymbol] = 0;
                        }

                        prc.orders.forEach(order => {
                            if(Number(order.time) - prevDay <= oneDay) {
                                if(order.side === BUY && order.status === FILLED) {
                                    income[curSymbol] -= Number(order.cummulativeQuoteQty) * (1 - 0.001);
                                } else if(order.side === SELL && order.status === FILLED) {
                                    income[curSymbol] += Number(order.cummulativeQuoteQty) * (1 - 0.001);
                                }
                            }
                        });
                        if(curSymbol === 'USDT') income[curSymbol] = Number(income[curSymbol].toFixed(4)); 
                        // else income[curSymbol] = Number(income[curSymbol].toFixed(5));
                    }
                });
            });
            return income;
        },
        allIncome() {
            let income = {};
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';
            
            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus && prc.orders.length) {
                        let curSymbol = '';

                        for(let i = 0; i < this.symbolsA.length; i++) {
                            let p = prc.symbol.indexOf(this.symbolsA[i]);
                            if(p > 1) {
                                curSymbol = this.symbolsA[i];
                            }
                        }
                        if(!income[curSymbol]) {
                            income[curSymbol] = 0;
                        }

                        prc.orders.forEach(order => {
                            if(order.side === BUY && order.status === FILLED) {
                                income[curSymbol] -= Number(order.cummulativeQuoteQty) * (1 - 0.001);
                            } else if(order.side === SELL && order.status === FILLED) {
                                income[curSymbol] += Number(order.cummulativeQuoteQty) * (1 - 0.001);
                            }
                        });
                        if(curSymbol === 'USDT') income[curSymbol] = Number(income[curSymbol].toFixed(4));
                        // else income[curSymbol] = Number(income[curSymbol].toFixed(5));
                    }
                });
            });
            return income;
        }
    },
    methods: {
        getUSDPrice(symbol = '', price = 0, s) {
            if(symbol !== 'USD' && symbol) {
                let USDPrice = this.$store.getters.getUSDPriceToSymbol(symbol);
                if(USDPrice) {
                    return this.noExponents(price * USDPrice) || '-';
                } else return '-';
            }
        },
        getDateNow() {
            let date = new Date();
            let ret = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            return ret;
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
.income-list {
    width: 100%;
}
.income-list p {
    margin-bottom: 4px;
}
.incomes__common{
    margin-top: 20px;
}
.incomes__title{

}
.bot-income {
    justify-content: space-between;
    margin-bottom: 2rem;
    margin-top: 2rem;
    padding: 1rem;
    border: 1px solid black;
}

.jsc {
    justify-content: space-between;
    display: flex;
}
.jsc > div {
    width: 100%;
    text-align: left;
}
.bots-income-title {

    margin-top: 3rem; 
    padding-bottom: 1rem;
    width: 100%;
    border-bottom: 1px solid black
}

.bot-income-block {
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
}

div {
    cursor: auto;
}
</style>

