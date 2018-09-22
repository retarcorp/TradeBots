<template>
    <section class="container">
        <div class="bots__order incomes">
            <div class="incomes__title title--medium">Доход за Сегодня</div>
            <div class="income-list" v-for="symbol in income.dayIncome" :key="symbol.name">
                <p>Пара: {{ income.allIncome[symbol.name].name }}: {{income.dayIncome[symbol.name].value}}</p>
            </div>
        </div>
        <div class="bots__order incomes__common">
            <div class="incomes__title title--medium">Доход за все время</div>
            <div class="income-list" v-for="symbol in income.allIncome" :key="symbol.name">
                <p>Пара: {{ income.allIncome[symbol.name].name }}: {{ income.allIncome[symbol.name].value }}</p>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    data() {
        return {
            income: {
                dayIncome: {},
                allIncome: {}
            }
        }
    },
    computed: {
        getIncome() {
            return this.$store.getters.getIncome;
        }
    },
    created() {
        this.$store.commit('setSpiner', true);
        this.$axios.$get('/api/income/get')
            .then(res => {
                if(res.status === 'ok') {
                    this.income = res.data.income;
                    this.$store.commit('setSpiner', false);
                    this.$store.commit('setIncome', this.income);
                    // this.$store.commit('setStatus', res.status);
                }
                else {
                    this.$store.commit('setStatus', 'error');
                    this.$store.commit('setMessage', res.message);
                }
            })
            .catch( error => console.log(error))
    }
}
</script>

<style scoped>
.income-list {
    width: 100%;
}
</style>

