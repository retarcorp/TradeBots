<template>
    <div class="balance">
        <div class="binance__sub-title title--small">Для пополнения баланса перечислите средства на кошелек - <b>{{walletAddress}}</b></div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                
            }
        },
        computed: {
            walletAddress() {
                return this.$store.getters.getAddress;
            }
        }
    }
</script>

