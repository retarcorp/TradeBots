<template>
    <!-- <section class="tariff">
        <h1 class="tariff__title title--medium">Изменение тарифа</h1>
        <div class="tariff__container">
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 1</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 2</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 3</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 4</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
        </div>
    </section> -->
    <section>
        <h2>Выбранные тарифы</h2>

        <table class="table">
            <tr class="table__tr">
                <th class="table__th">Название</th>
                <th class="table__th">Цена</th>
                <th class="table__th">Максимальное количество ботов</th>
            </tr>
            <tr v-for="tariff in tariffs" :key="tariff._id" class="table__tr">
                <td class="table__td">{{ tariff.title }}</td>
                <td class="table__td">{{ tariff.price }}</td>
                <td class="table__td">{{ tariff.maxBotAmount }}</td>
            </tr>
        </table>
        <h2>Тарифы на выбор</h2>

        <table class="table">
            <tr class="table__tr">
                <th class="table__th">Название</th>
                <th class="table__th">Цена</th>
                <th class="table__th">Максимальное количество ботов</th>
                <th class="table__th"></th>
            </tr>
            <tr v-for="rate in rates" :key="rate._id" class="table__tr">
                <td class="table__td">{{ rate.title }}</td>
                <td class="table__td">{{ rate.price }}</td>
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
    methods: {
        onSelectTarif (id) {
            this.$axios.$post('/api/user/purchaseTariff', { id })
                .then(res => alert(res.message))
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

