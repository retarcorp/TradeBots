<template>
    <div class="settings">
        <div class="settings__title">Изменение пароля</div>
        <div class="form__wrapper">
            <form>
                <div class="form__control">
                    <div class="form__label">Текущий</div>
                    <input class="form__input" type="password">
                </div>
                <div class="form__control">
                    <div class="form__label">Новый пароль</div>
                    <input class="form__input" type="password">
                </div>
                <div class="form__control">
                    <div class="form__label">Подтверждение нового пароля</div>
                    <input class="form__input" type="password">
                </div>
                <div class="form__actions">
                    <button class=" form__button form__button--success">Сохранить</button>
                    <button class=" form__button form__button--danger">Удалить</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
@import '~/assets/css/variables.css';
@import '~/assets/css/components/form.css';
.settings__title {
    font-size: 2rem;
    font-weight: 700;
    line-height: 2.3rem;
    color: inherit;
    margin-bottom: 3.5rem;
}
.settings {
    max-width: 31.7rem;
    width: 100%
}
.form__input {
    max-width: 31.7rem;
}

.form__actions {
    display: flex
}

.form__button:not(:last-child) {
    margin-right: 2rem;
}
</style>
