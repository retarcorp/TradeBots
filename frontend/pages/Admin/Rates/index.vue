<template>
    <div class="container rates">
        <div class="row">
            <div class="col">
                <table class="table">
                    <tr class="table__tr">
                        <th class="table__th">Название тарифа</th>
                        <th class="table__th">Цена</th>
                        <th class="table__th">Возможности</th>
                        <th class="table__th">Макс. кол-во ботов</th>
                        <th class="table__th">Действие</th>
                        <th class="table__th"></th>
                    </tr>
                    <tr class="table__tr">
                        <td class="table__th"></td>
                        <td class="table__th"></td>
                        <td class="table__th"></td>
                        <td class="table__th"></td>
                        <td class="table__th">Редактировать</td>
                        <td class="table__th">Удалить</td>
                    </tr>
                </table>
                <button @click.prevent="onAddTariff" class="button button--success rates__addTariff">Добавить тариф</button>
            </div>
        </div>
        <app-modal :open="isModalOpen"></app-modal>
    </div>
</template>
<script>
import modal from '~/components/TariffSettings';
    export default {
        components: {
            appModal: modal
        },
        layout: 'admin',
        data() {
            return {
                isModalOpen: true
            }
        },
        methods: {
            onAddTariff() {

            }
        }
    }
</script>
