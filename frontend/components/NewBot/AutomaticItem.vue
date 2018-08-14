<template>
    <div class="automatic-item">
        <div class="automatic-item__field signal"><slot></slot> {{ item.signal }}</div>
        <div class="automatic-item__field timefreim">{{ item.timeframe }}</div>
        <div class="automatic-item__field recomendation">{{ item.transactionTerm }}</div>
        <button 
            @click.prevent="onDeleteItem"
            class="automatic-item__delete-button">x</button>
    </div>
</template>

<script>
    export default {
        props: ['item'],
        methods: {
            onDeleteItem() {
                this.$emit('item-deleted')
            }
        }
    }
</script>

<style scoped>
.automatic-item {
    display: flex;
    justify-content: space-between;
}

.automatic-item__field {
    padding: 2rem
}

.automatic-item__delete-button {
    width: 3.8rem;
    height: 3.8rem;
}

.automatic-item__delete-button {
    background-color: red;
    border: none;
    color: #fff;
}
</style>

