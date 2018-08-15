<template>
    <form @submit.prevent="onSignIn" class="absolute-center auth-form">
        <h1 class="title title--big text-center auth-form__title">Вход в админ панель</h1>
        <input v-model="email" type="email" class="input auth-form__input" placeholder="Email">
        <input v-model="password" type="password" class="input auth-form__input" placeholder="Пароль">
        <div class="d-flex">
            <button :class="{'button--disabled': !isFormValid}" :disabled="!isFormValid" type="submit" class="button button--success auth-form__button">Войти</button>
        </div>
        <div class="d-flex">
            <span class="auth-form__forgot-password">Забыли пароль?</span>
            <p class="auth-form__not-have-account"><nuxt-link to="/signup" class="link">Регистрация</nuxt-link></p>
        </div>
    </form>
</template>
