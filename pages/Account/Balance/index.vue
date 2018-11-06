<template>
    <div class="balance">
        <div class="binance__sub-title title--small">Для пополнения баланса перечислите средства на кошелек - {{walletAddress}}</div>
        <div class="binance__sub-title title--small">(коммисия 0.0002 BTC, минимальная сумма без учета коммисии - {{fee}} BTC)</div>

        <div>

            <div v-for="(payment, i) in payments" :key="i" class="tabs">

                <div class="tabs__item">{{ getDate(payment.time) }}</div>
                <div class="tabs__item">{{ getBTCAmount(payment.amount) }} BTC</div>

            </div>


        </div>
    
    </div>
</template>

<script>
    export default {
        data() {
            return {
                satoshi: 0.00000001,
                fee: 0.0003
            }
        },
        computed: {
            walletAddress() {
                return this.$store.getters.getAddress;
            },
            payments() {
                return this.$store.getters.getUserPayments;
            }
        },
        methods: {
            getBTCAmountWithFee(amount = this.fee) {
                return (amount * this.satoshi - this.fee).toFixed(6);
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
            }
        }
    }
</script>

