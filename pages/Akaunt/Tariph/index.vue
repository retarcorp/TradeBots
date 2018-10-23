<template>
    <section>
        <h2>Приобретенные тарифы. (Максимальное кол-во ботов: {{maxBotAmount}})</h2>

        <table class="table">
            <tr class="table__tr">
                <th class="table__th">Название</th>
                <th class="table__th">Максимальное количество ботов</th>
                <th class="table__th">Дата истечения</th>
            </tr>
            <tr v-for="tariff in tariffs" :key="tariff._id" class="table__tr">
                <td class="table__td">{{ tariff.title }}</td>
                <td class="table__td">{{ tariff.maxBotAmount }}</td>
                <td class="table__td">{{ getDate(tariff.expirationDate) }}</td>
            </tr>
        </table>
        <h2>Тарифы на выбор</h2>

        <table class="table">
            <tr class="table__tr">
                <th class="table__th">Название</th>
                <th class="table__th">Цена ($)</th>
                <th class="table__th">Количество дней</th>
                <th class="table__th">Максимальное количество ботов</th>
                <th class="table__th"></th>
            </tr>
            <tr v-for="rate in rates" :key="rate._id" class="table__tr">
                <td class="table__td">{{ rate.title }}</td>
                <td class="table__td">{{ rate.price }}</td>
                <td class="table__td">{{ rate.termOfUse }}</td>
                <td class="table__td">{{ rate.maxBotAmount }}</td>
                <td class="table__td"><button @click="onSelectTarif(rate.tariffId)" class="button button--primary">Выбрать</button></td>
            </tr>
        </table>
    </section>
</template>

<script>
export default {
    props: ['tariffs'],
    data () {
        return {
            rates: []
        }
    },
    computed: {
        maxBotAmount() {
            return this.$store.getters.getMaxBotAmount;
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
        },
        onSelectTarif (id) {
            this.$axios.$post('/api/user/purchaseTariff', { id })
                .then(res => {
                    alert(res.message);
                    location.reload();
                });
        },
        getRates () {
            this.$axios.$get('/api/admin/getTariffList')
                .then(res => this.rates = res.data)
        }
    },
    created () {
        this.getRates()
    }
}
</script>

<style>
.list-capabilities__item::before{
    content: ' ';
    left: 0;
    display: block;
    position: absolute;
    width: 2.1rem;
    height: 1.8rem;
    background-image: url('~assets/svg/check.svg');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100%;
}
</style>

