<template>
    <div class="full-height form-wrapper">
        <form @submit.prevent="onSignIn" class="absolute-center form">
            <h1 class="form__header">Вход</h1>
            <input v-model="email" type="email" class="form__input" placeholder="Email">
            <input v-model="password" type="password" class="form__input" placeholder="Пароль">
            <button type="submit" class="form__button">Войти</button>
            <!-- <span class="forgot-password">Забыли пароль?</span> -->
            <!-- <p class="not-have-account"><nuxt-link to="/registration">Регистрация</nuxt-link></p> -->
        </form>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                email: '',
                password: ''
            }
        },
        methods: {
            onSignIn() {
                this.$axios.$post('/signin', {
                    email: this.email,
                    password: this.password
                })
            }
        }
    }
</script>

<style>
@import '~/assets/css/components/form.css';
</style>
