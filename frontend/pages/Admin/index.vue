<template>
    <div class="container">
        <div class="row">
            <div class="col">
                <table class="table">
                    <tr class="table__tr">
                        <th class="table__th">Дата регистрации</th>
                        <th class="table__th">Email</th>
                        <th class="table__th">Тариф</th>
                        <th class="table__th">Баланс</th>
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
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        layout: 'admin'
    }
</script>