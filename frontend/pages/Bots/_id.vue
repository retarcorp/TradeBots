<template>
    <div>
        <section class="bots__right-settings bot__manual">
            <div class="settings__header">
                <h1 class="bots__name">BTC</h1>
                <span class="settings__type">(Ручной)</span>
                <div class="bots__buttons-status">
                    <button class="page__button button__freeze">Заморозить</button>
                    <label class="checkbox">
                        <input type="checkbox" class="button__status">
                        <div class="checkbox__text"></div>
                    </label>
                </div>
            </div>

            <div class="settings__content">

                <!-- <div class="page__field">
                    <label class="page__label" for="counter_bots">Количесво торгующих ботов:</label>
                    <input id="counter_bots" type="text" class="page__input settings__input">
                </div> -->
                <div class="settings__description">
                    <p class="settings__item">Количество тогруемых ботов: <span>7</span></p>
                    <p class="settings__item">Дневной объем (BTC): <span>123</span></p>
                    <p class="settings__item">Основная пара: <span>ВТС</span></p>
                    <p class="settings__item">Котируемая пара: <span>ETH</span></p>
                    <p class="settings__item">Начальные ордер: <span>7</span></p>
                    <p class="settings__item">Страховочный ордер: <span>123</span></p>
                    <p class="settings__item">Отклонение от начального ордера: <span>10%</span></p>
                    <p class="settings__item">Кол-во страховочных ордеров: <span>32</span></p>
                    <p class="settings__item">Тейк профит: <span>25%</span></p>
                    <p class="settings__item">Мартингейл: <span>Вкл</span></p>
                    <p class="settings__item">Увеличение страховочного ордера: <span>1.75</span></p>
                </div>
                <div class="bots__button">
                    <button class="form__button button__change-settings">Изменить настройки</button>
                    <button class="form__button button__remove-bot">Удалить бота</button>
                </div>
            </div>

            <div class="bots__order">
                <ul class="tabs__bar">
                    <li @click.prevent="isActive = true" class="tabs__item">Выставленные ордера</li>
                    <li @click.prevent="isActive = false" class="tabs__item">Выполненные</li>
                </ul>
                <div class="tabs__content">
                    <table v-show="isActive" class="page__table">
                        <tr class="table__tr">
                            <th class="table__th pair-head">Пара</th>
                            <th class="table__th price-head">Цена</th>
                            <th class="table__th quantity-head">Количество</th>
                            <th class="table__th total-head">Всего</th>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                    </table>
                    <table v-show="!isActive" class="page__table">
                        <tr class="table__tr">
                            <th class="table__th pair-head">Другая Пара</th>
                            <th class="table__th price-head">Другая Цена</th>
                            <th class="table__th quantity-head">Другое Количество</th>
                            <th class="table__th total-head">Другое Всего</th>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                        <tr class="table__tr">
                            <td class="table__td pair">BTC/ETH</td>
                            <td class="table__td price">0.00065906 (ETH)</td>
                            <td class="table__td quantity">34 (BTC)</td>
                            <td class="table__td total">0.02240804 (BTC)</td>
                        </tr>
                    </table>
                    <div class="order__buttons">
                        <button class="form__button page__button button__cancel-sell">Отменить и продать</button>
                        <button class="form__button page__button button__cancel">Отменить сделку</button>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                isActive: true
            }
        }
    }
</script>

<style scoped>

/* TABLE SETTING */

.page__table{
    width: 100%;
    margin: 10px auto;
    border-collapse: collapse;
}
.table__tr{
    display: flex;
    border-bottom: 1px solid #E3E3E3;
}
.table__tr:last-child{
    border-bottom: none;
}
.table__td,
.table__th{
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    padding: 20px 0;
    text-align: start;
    display: flex;
    align-items: center;
}

/*    */


/* TABS BAR */

.tabs__bar{
    border-bottom: 1px solid #CECECE;
}

.tabs__item{
    display: inline-block;
    padding: 13px 14px;
    font-size: 14px;
    position: relative;
    cursor: pointer;
}

.tabs__content{
    padding: 0 14px;
}

.bots__right-settings{
    width: 100%;
    border: 1px solid #EFEFEF;
    padding: 2rem;
}

.settings__header{
    display: flex;
    align-items: center;
}

.bots__name{
    font-size: 2.5rem;
    font-weight: 500;
}

.settings__type{
    color: #B4B4B4;
    font-size: 1.6rem;
    margin-left: 1rem;
}

.button__freeze{
    background: none;
    text-decoration: underline;
    font-weight: 500;
    font-size: 1.3rem;
    margin-right: 1.5rem;
}

.bots__buttons-status{
    display: flex;
    align-items: center;
    margin: 0 0 0 auto;
}

.settings__description{
    display: flex;
    flex-wrap: wrap;
}
.settings__item{
    width: 50%;
    margin-bottom: 2rem;
}
.settings__content,
.transactions__terms{
    margin-top: 1rem;
}

/* .transactions__terms .settings__input{
    width: 164px;
} */

.transactions__terms .settings__input:not(:first-of-type){
    margin-left: 2rem;
}

.transactions__terms .page__field{
    flex-direction: row;
    flex-wrap: wrap;
}
.transactions__terms .page__label{
    width: 100%;
}
.transactions__terms .table__td{
    padding: 2rem 1.5rem;
}
.transactions__terms .table__tr:last-child{
    border-bottom: 1px solid #E3E3E3;
}
.terms__recommendation{
    flex: 2;
}

.button__change-settings,
.button__remove-bot{
    background-color: #72C770;
}

.button__remove-bot{
    background-color:#D74C4C;
    margin-left: 2rem;
}

.bots__button{
    display: flex;
    justify-content: flex-end;
}

/* .pair,
.pair-head,
.quantity-head,
.quantity{
    flex: 0.7;
} */
.order__buttons{

}
.button__cancel-sell,
.button__cancel{
    background-color: #DCDCDC;
    color: #000

}

.button__cancel{
    margin-left: 1.5rem;
}

.settings__item,
.settings__item span{
    font-size: 1.5rem;
}
.settings__item{
    font-weight: 500;
}

.header__title{
    font-size: 2.5rem;
    font-weight: 500;

}
.add__header{
    border-bottom: 1px solid #DCDCDC;
    padding-bottom: 1.3rem;
    margin-bottom: 1rem;
}
</style>

