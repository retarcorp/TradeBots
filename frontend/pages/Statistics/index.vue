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
            <li 
            @click="currentTab = 'rejected'" 
            class="tabs__item"
            :style="currentTab === 'rejected' ? 'backgroundColor: #eee' : ''"
            >Ошибки</li>
        </ul>
        <div class="tabs__content">
            <table v-show="currentTab === 'opened'" class="table">
                <tr class="table__tr">
                    <th class="table__th date">Дата</th>
                    <th class="table__th pair-head">Пара</th>
                    <th class="table__th price-head">Цена</th>
                    <th class="table__th quantity-head">Количество</th>
                    <th class="table__th total-head">Всего</th>
                </tr>
                <tr 
                    v-for="order in openedOrders" 
                    :key="order.id" 
                    class="table__tr">
                    <td class="table__td date">{{ order.date }}</td>
                    <td class="table__td pair">{{ order.pair.from }}/{{ order.pair.to }}</td>
                    <td class="table__td price">{{ order.type !== 'MARKET' ? order.price : order.fills[0].price }}</td>
                    <td class="table__td quantity">{{ order.origQty }}</td>
                    <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                </tr>
            </table>
            <table v-show="currentTab === 'closed'" class="table">
                <tr class="table__tr">
                    <th class="table__th date">Дата</th>
                    <th class="table__th pair-head">Пара</th>
                    <th class="table__th price-head">Цена</th>
                    <th class="table__th quantity-head">Количество</th>
                    <th class="table__th total-head">Всего</th>
                </tr>
                <tr 
                    v-for="order in closedOrders" 
                    :key="order.id" 
                    class="table__tr">
                    <td class="table__td date">{{ order.date }}</td>
                    <td class="table__td pair">{{ order.pair.from }}/{{ order.pair.to }}</td>
                    <td class="table__td price">{{ order.type !== 'MARKET' ? order.price : order.fills[0].price }}</td>
                    <td class="table__td quantity">{{ order.origQty }}</td>
                    <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                </tr>
            </table>
            <table v-show="currentTab === 'rejected'" class="table">
                <tr class="table__tr">
                    <th class="table__th date">Дата</th>
                    <th class="table__th pair-head">Пара</th>
                    <th class="table__th price-head">Цена</th>
                    <th class="table__th quantity-head">Количество</th>
                    <th class="table__th total-head">Всего</th>
                </tr>
                <tr 
                    v-for="order in rejectedOrders" 
                    :key="order.id" 
                    class="table__tr">
                    <td class="table__td date">{{ order.date }}</td>
                    <td class="table__td pair">{{ order.pair.from }}/{{ order.pair.to }}</td>
                    <td class="table__td price">{{ order.type !== 'MARKET' ? order.price : order.fills[0].price }}</td>
                    <td class="table__td quantity">{{ order.origQty }}</td>
                    <td class="table__td total">{{ order.cummulativeQuoteQty }}</td>
                </tr>
            </table>
        </div>
    </section>
</template>

<script>
export default {
    data() {
        return {
            orders: [],
            currentTab: 'opened'
        }
    },
    computed: {
        openedOrders() {
            return this.orders.filter(ord => ord.status === 'NEW' || ord.status === 'PARTIALLY_FILLED')
        },
        closedOrders() {
            return this.orders.filter(ord => ord.status === 'FILLED' || ord.status === 'CANCELED')
        },
        rejectedOrders() {
            return this.orders.filter(ord => ord.status === 'PENDING_CANCEL' || ord.status === 'REJECTED' || ord.status === 'EXPIRED')
        }
    },
    created() {
        this.$axios.$get('/statistics')
            .then(res => {
                if(res.status === 'ok') {
                    this.orders = res.data.data
                }
            })
    }
}
</script>
