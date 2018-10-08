<template>
    <tr class="table__tr">
        <td class="table__th">{{tariff.title}}</td>
        <td class="table__th">{{tariff.price}}</td>
        <td class="table__th">{{tariff.maxBotAmount}}</td>
        <td class="table__th">{{tariff.termOfUse}}</td>
        <td class="table__th cursor" @click.prevent='editTariff(tariff)'>Редактировать</td>
        <td class="table__th cursor" @click.prevent='deleteTariff(tariff)'>Удалить</td>
    </tr>
</template>
<script>
    export default {
        name: 'tariffElement',
        props: ['tariff'],
        data() {
            return {

            }
        },
        methods: {
            editTariff(tariff) {
                this.$emit('checkStatus','edit', tariff);
            },
            deleteTariff(tariff) {
                this.$emit('checkStatus','delete', tariff);
            }
        }
    }
</script>
<style>
.cursor {
    cursor: pointer;
}
</style>

