<template>
    <section>
        <div v-if="getStatus === 'confirmTariff'" class='confirm-block' @click="checkWindow">
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
        <h2>Приобретенные тарифы. (Максимальное кол-во ботов: {{maxBotAmount}})</h2>

        <table class="table">
            <tr class="table__tr">
                <th class="table__th">Название</th>
                <th class="table__th">Максимальное количество ботов</th>
                <th class="table__th">Дата истечения</th>
                <!-- <th class="table__th">Действующий</th> -->
            </tr>
            <tr v-for="tariff in tariffs" :key="tariff._id" class="table__tr">
                <td class="table__td">{{ tariff.title }}</td>
                <td class="table__td">{{ tariff.maxBotAmount }}</td>
                <td class="table__td">{{ /*tariff.isNextTariff ? '-' : */getDate(tariff.expirationDate) }}</td>
                <!-- <td class="table__td">{{ tariff.isNextTariff ? '-' : 'Текущий' }}</td> -->
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
            tId: '',
            statusAlert: {
                confirmTariff: 'Вы точно хотите приобрести этот тариф?',
            },
            rates: []
        }
    },
    computed: {
        clientAnswer() {
            return this.$store.getters.getClientAnswer;
        },
        getStatus() {
            return this.$store.getters.getStatus;
        },
        maxBotAmount() {
            return this.$store.getters.getMaxBotAmount;
        }
    },
    methods: {
        checkWindow(event) {
            if (event.target.getAttribute('class') === 'confirm-block') {
                this.$store.commit('clearStatus');
            }
        },
        onConfirm() {
            if( this.getStatus === 'confirmTariff') {
                this.$store.commit('setClientAnswer', 'accept');
                this.onSelectTarif();
            }
            this.onCancel();
            this.$store.commit('clearAnswer');
        },
        onCancel() {
            this.$store.commit('clearStatus');
        },
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
            if(id) {
                this.tId = id;
            } 
            this.$store.commit('setStatus', 'confirmTariff');
            if(this.clientAnswer === 'accept') {
                this.$axios.$post('/api/user/purchaseTariff', { id: this.tId })
                    .then(res => {
                        alert(res.message);
                        this.tId = '';
                        location.reload(); 
                    });
            }
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
</style>

