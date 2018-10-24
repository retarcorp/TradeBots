<template>
    <section class="container">

        <div class="bots__order incomes__common">
            <div class="incomes__title title--big">Доход за сегодня</div>
            <div class="income-list" v-for="(value, key) in dayIncome" :key="key">
                <p class="title--medium">{{ key }}: {{ value }}</p>
            </div>
        </div>

        <div class="bots__order incomes__common">
            <div class="incomes__title title--big">Доход за все время</div>
            <div class="income-list" v-for="(value, key) in allIncome" :key="key">
                <p class="title--medium">{{ key }}: {{ value }}</p>
            </div>
        </div>

        <p class="bots-income-title">Доход по процессам:</p>

        <div class="bot-income-box">
            <div v-for="prcIncome in processesIncome" :key="prcIncome.botID" class="bot-income tabs">
                <div class="bot-income-block tabs__item">
                    <p>Бот - {{ prcIncome.botTitle }} ({{ prcIncome.botID }})</p>
                    <p>Процесс - {{ prcIncome.processId }}</p>
                    <p>Пара - {{ prcIncome.symbol }}</p>
                </div> 
                <div class="bot-income-block tabs__item">
                    <p>Объемы: </p>
                    <p>{{ prcIncome.volumeBTC }} BTC</p>
                    <p>{{ prcIncome.volumeCur }} {{ prcIncome.curSymbol }}</p>
                </div>
                <div class="bot-income-block tabs__item">
                    <p>Прибыль: </p>
                    <p v-for="(inc, _key) in prcIncome.income" :key="_key">
                        {{ _key }}: {{ Math.round(inc * 100000) / 100000 }}
                    </p>
                </div>
                <div class="bot-income-block tabs__item">
                    <p>Дата: {{ getDate(prcIncome.endTime) }}</p>
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
            income: {
                dayIncome: {},
                allIncome: {}
            },
            symbolsA: ['BTC', 'BNB', 'ETH', 'USDT']
        }
    },
    computed: {
        statisticsList() {
            return this.$store.getters.getStatisticsList || [];
        },
        processesIncome() {
            let arr = [];
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';

            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus) {
                        let curSymbol = '';
                        for(let i = 0; i < this.symbolsA.length; i++) {
                            let p = prc.symbol.indexOf(this.symbolsA[i]);
                            if(p > 1) {
                                curSymbol = this.symbolsA[i];
                            }
                        }

                        let prcIncome = {
                            botTitle: prc.botTitle,
                            botID: bot.botID,
                            processId: prc.processId,
                            endTime: prc.orders[prc.orders.length - 1].time,
                            volumeBTC: Number(prc.orders[prc.orders.length - 1].origQty),
                            volumeCur: Number(prc.orders[prc.orders.length - 1].cummulativeQuoteQty),
                            curSymbol: curSymbol,
                            symbol: prc.symbol,
                            income: {}
                        }

                        if(!prcIncome.income[curSymbol]) {
                            prcIncome.income[curSymbol] = 0;
                        }

                        prc.orders.forEach(order => {
                            if(order.side === BUY && order.status === FILLED) {
                                prcIncome.income[curSymbol] -= Number(order.cummulativeQuoteQty);
                            } else if(order.side === SELL && order.status === FILLED) {
                                prcIncome.income[curSymbol] += Number(order.cummulativeQuoteQty);
                            }
                        });
                        arr.push(prcIncome);
                    }
                });
            });
            return arr;
        },
        botsIncome() {
            let arr = [];
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';

            this.statisticsList.forEach(bot => {
                let botIncome = {
                    botID: bot.botID,
                    title: bot.title,
                    income: {}
                };

                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus) {
                        let curSymbol = '';

                        for(let i = 0; i < this.symbolsA.length; i++) {
                            let p = prc.symbol.indexOf(this.symbolsA[i]);
                            if(p > 1) {
                                curSymbol = this.symbolsA[i];
                            }
                        }
                        if(!botIncome.income[curSymbol]) {
                            botIncome.income[curSymbol] = 0;
                        }

                        prc.orders.forEach(order => {
                            if(order.side === BUY && order.status === FILLED) {
                                botIncome.income[curSymbol] -= Number(order.cummulativeQuoteQty);
                            } else if(order.side === SELL && order.status === FILLED) {
                                botIncome.income[curSymbol] += Number(order.cummulativeQuoteQty);
                            }
                        });
                    }
                });
                
                arr.push(botIncome);
            });
            return arr;
        },
        dayIncome() {
            let income = {};
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';
            const oneDay = 86400000,
                curDay = Date.now(),
                prevDay = curDay - oneDay;
            
            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
                    if(!prc.finallyStatus) {
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
                            if(order.time - prevDay <= oneDay) {
                                if(order.side === BUY && order.status === FILLED) {
                                    income[curSymbol] -= Number(order.cummulativeQuoteQty);
                                } else if(order.side === SELL && order.status === FILLED) {
                                    income[curSymbol] += Number(order.cummulativeQuoteQty);
                                }
                            }
                        });
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
                    if(!prc.finallyStatus) {
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
                                income[curSymbol] -= Number(order.cummulativeQuoteQty);
                            } else if(order.side === SELL && order.status === FILLED) {
                                income[curSymbol] += Number(order.cummulativeQuoteQty);
                            }
                        });
                    }
                });
            });
            return income;
        }
    },
    methods: {
        getDate(date = Date.now()) {
                date = new Date(date);
                let hh = String(date.getHours()),
                    ss = String(date.getSeconds()),
                    DD = String(date.getDate()),
                    mm = String(date.getMinutes()),
                    MM = String(date.getMonth() + 1),
                    YYYY = date.getFullYear();

                hh = hh.length < 2 ? '0' + hh : hh;
                mm = mm.length < 2 ? '0' + mm : mm;
                ss = ss.length < 2 ? '0' + ss : ss;
                DD = DD.length < 2 ? '0' + DD : DD;
                MM = MM.length < 2 ? '0' + MM : MM;

                return `${hh}:${mm}:${ss} ${DD}.${MM}.${YYYY}`;
            }
    },
    created() {
    }
}
</script>

<style scoped>
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

</style>

