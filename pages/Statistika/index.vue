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
                    <th class="table__th side">Тип</th>
                    <th class="table__th price-head">Цена</th>
                    <th class="table__th quantity-head">Количество</th>
                    <th class="table__th total-head">Всего</th>
                    <th class="table__th status-head">Статус</th>
                </tr>
                <tbody class='overflow'>
                    <tr 
                        v-for="order in openedOrders" 
                        :key="order.id" 
                        class="table__tr">
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
            <table v-show="currentTab === 'closed'" class="table">
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
                        v-for="order in closedOrders" 
                        :key="order.id" 
                        class="table__tr">
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
            <table v-show="currentTab === 'rejected'" class="table">
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
                        v-for="order in rejectedOrders" 
                        :key="order.id" 
                        class="table__tr">
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
    filters: {
        date(value) {
            let date = new Date(value);
            return ((date.getMonth() < 9) ? '0' : '') + (date.getMonth() + 1) + '-' +
      ((date.getDate() < 10) ? '0' : '') + date.getDate() + ' ' + ((date.getHours() <= 9) ? '0' : '') + date.getHours() + ':' + ((date.getMinutes() <= 9) ? '0' : '') + date.getMinutes() + ':' + ((date.getSeconds() <= 9) ? '0' : '') + date.getSeconds()
        }
    },
    computed: {
        openedOrders() {
            return this.sortedOrders.filter(ord => ord.status === 'NEW' || ord.status === 'PARTIALLY_FILLED')
        },
        closedOrders() {
            return this.sortedOrders.filter(ord => ord.status === 'FILLED' || ord.status === 'CANCELED')
        },
        rejectedOrders() {
            return this.sortedOrders.filter(ord => ord.status === 'PENDING_CANCEL' || ord.status === 'REJECTED' || ord.status === 'EXPIRED')
        },
        sortedOrders() {
            let orders = Object.assign([], this.orders);
            return orders.sort( (a, b) => b.time - a.time)
        }
    },
    created() {
        this.$store.commit('setSpiner', true);
        this.$axios.$get('/statistics')
            .then(res => {
                if(res.status === 'ok') {
                    this.orders = res.data;
                    this.$store.commit('setStatus', 'ok');
                    this.$store.commit('setSpiner', false);
                } else {
                    this.$store.commit('setStatus', 'error');
                    this.$store.commit('setMessage', res.message);
                }
            })
            .catch( error => console.log(error))
    }
}
</script>

<style scoped>

.overflow {
    display: block;
    max-height: 75vh;
    overflow-y: auto;
}

</style>
