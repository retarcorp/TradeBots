<template>
    <div class="settings">
        <div class="settings__title title--medium">Изменение пароля</div>
        <div class="settings__form">
            <form>
                <div class="form-control">
                    <div class="label">Текущий</div>
                    <input class="input" type="password">
                </div>
                <div class="form-control">
                    <div class="label">Новый пароль</div>
                    <input class="input" type="password">
                </div>
                <div class="form-control">
                    <div class="label">Подтверждение нового пароля</div>
                    <input class="input" type="password">
                </div>
                <div class="form__actions">
                    <button class=" button button--success">Сохранить</button>
                    <button class=" button button--danger">Удалить</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
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
