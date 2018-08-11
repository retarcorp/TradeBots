<template>
    <div>
        <div class="bots__settings manual-settings">
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="bot__name">Название бота:</label>
                <input id="bot__name" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="main__pair">Основная пара:</label>
                <select id="main__pair" type="text" class="form__input settings__input">
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="quotable__pair">Котируемая пара:</label>
                <select id="quotable__pair" type="text" class="form__input settings__input">
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="start__order">Начальный ордер:</label>
                <input id="start__order" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="save__order">Страховочный ордер:</label>
                <input id="save__order" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="count__save-order">Кол-во страховочных ордеров:</label>
                <input id="count__save-order" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="count__bots">Макс открытых СО:</label>
                <input id="count__max-save-order" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control" style="margin-top: 9px;">
                <label class="form__label label__double-row" for="deviation">Отклонение от начального ордера %</label>
                <input id="deviation" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="stop__loss">Стоп лосс %</label>
                <input id="stop__loss" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label" for="take__profit">Тейк профит %</label>
                <input id="take__profit" type="text" class="form__input settings__input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label">Мартингейл</label>
                <div class="checkbox__container">
                    <label class="martingeil__mode">
                        <input id="martingale-on" class="radio__point" type="radio" name="bot__mode" checked>
                        Вкл
                    </label>
                    <label class="martingeil__mode">
                        <input id="martingale-off" class="radio__point" type="radio" name="bot__mode">
                        Выкл
                    </label>
                </div>
            </div>
            <div class="form__control newBot__settings-control">
                <label class="form__label label__double-row" for="save__order-up">Увеличение страховочного ордера: </label>
                <span class="range__value">{{ range }}</span>
                <input v-model="range" id="save__order-up" type="range" min="1.01" max="2" step="0.01" class="page__input settings__input-range">
            </div>
        </div>
        <div class="text-right">
            <button class="form__button">Добавить</button>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'bot-manual',
        data() {
            return {
                range: 1.01
            }
        }
    }
</script>

<style scoped>
@import '~/assets/css/components/form.css';
@import '~/assets/css/variables.css';
@import '~/assets/css/utils.css';
.bots__settings {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    margin-bottom: 5rem;
}

.newBot__settings {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
}

.newBot__settings-control {
    max-width: 22.1rem;
    width: 100%;
}

.newBot__settings-control:not(:last-child) {
    margin-right: 1.23rem;
}

.form__input {
    border: 1px solid #DCDCDC
}

.newBot__settings {
    margin-bottom: 2rem
}

input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    border-radius: .8rem;
    height: 1px;
    background-color: #E9E9E9;
    border: 1px solid #DCDCDC;
}

input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    background-color: #C4C4C4;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    cursor: pointer;
}

/* Firefox */
input[type=range]::-moz-range-track {
    -webkit-appearance: none;
    width: 100%;
    border-radius: .8rem;
    height: 1px;
    background-color: #E9E9E9;
    border: 1px solid #DCDCDC;
}

input[type='range']::-moz-range-thumb {
    -webkit-appearance: none;
    background-color: #C4C4C4;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    cursor: pointer;
}

/* IE */

input[type="range"]::-ms-fill-lower,
input[type="range"]::-ms-fill-upper {
    background: transparent;
}
input[type=range]::-ms-track {
    -webkit-appearance: none;
    width: 100%;
    border-radius: .8rem;
    height: 1px;
    background-color: #E9E9E9;
    border: 1px solid #DCDCDC;
}

input[type='range']::-ms-thumb {
    -webkit-appearance: none;
    background-color: #C4C4C4;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    cursor: pointer;
}

.page__field{
    display: inline-flex;
    flex-direction: column;
}

.page__field:not(:last-child){
    margin-right: 1.5rem;
}

.page__label,
.page__label span{
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1.1rem;
}

.checkbox__container {
    display: flex;
    flex-direction: column;
    min-height: 4.5rem;
}
</style>

