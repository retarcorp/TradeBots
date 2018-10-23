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

        <p class="bots-income-title">Доход по ботам:</p>

        <div class="bot-income-box">
            <div v-for="botIncome in botsIncome" :key="botIncome.botID" class="bot-income">
                <p>Бот - {{ botIncome.title }} ({{ botIncome.botID }})</p>
                <div class="income-list" v-for="(value, key) in botIncome.income" :key="key">
                    <p class="title--medium">{{ key }}: {{value}}</p>
                </div>
            </div>
        </div>



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
                });
            });
            return income;
        },
        allIncome() {
            let income = {};
            const BUY = 'BUY', SELL = 'SELL', FILLED = 'FILLED';
            
            this.statisticsList.forEach(bot => {
                bot.processes.forEach(prc => {
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
                });
            });
            return income;
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
</style>

