<template>
    <div class="binance">
        <div class="binance__title">Настройка доступа для Binance</div>
        <div class="binance__description">Для начала работы привяжете ваш аккаунт Binance</div>
        <div class="binance__form">
            <form class="binance__form">
                <div class="form__control">
                    <label class="form__label">Название</label>
                    <input type="text" class="form__input">
                </div>
                <div class="form__control">
                    <label class="form__label">Api Key</label>
                    <input type="text" class="form__input">
                </div>
                <div class="form__control">
                    <label class="form__label">Api Secret</label>
                    <input type="text" class="form__input">
                </div>
                <div class="form__actions">
                    <button class="form__button form__button--success">Сохранить</button>
                    <button class="form__button form__button--danger">Удалить</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
@import '~/assets/css/components/form.css';
@import '~/assets/css/variables.css';
.binance__title {
    margin-bottom: 1.3rem;
}

.binance__description {
    margin-bottom: 3rem;
}

.binance__form {
    max-width: 38.3rem;
}

.form__input {
    max-width: 31.8rem;
    padding: .9rem 1.8rem;
}

.form__actions {
    display: flex
}

.form__button {
    max-width: 16.4rem;
} 

.form__button--success {
    margin-right: 1.2rem
}
</style>

