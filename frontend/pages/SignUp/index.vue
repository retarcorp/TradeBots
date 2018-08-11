<template>
    <div class="full-height form-wrapper">
        <form @submit.prevent="onSignUp" class="absolute-center form">
            <h1 class="form__header">Регистрация</h1>
            <input v-model="email" type="email" class="form__input" placeholder="Email">
            <input v-model="password" type="password" class="form__input" placeholder="Пароль">
            <input v-model="confirmPassword" type="password" class="form__input" placeholder="Подтверждение пароля">
            <button type="submit" class="form__button">Регистрация</button>
            <p class="form__question">Уже есть аккаунт? <nuxt-link to="/signin">Войти</nuxt-link></p>
        </form>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                email: '',
                password: '',
                confirmPassword: ''
            }
        },
        computed: {
            isFormValid() {
                return this.password === this.confirmPassword
                        && this.password.length !== 0
                        && this.email.length !== 0
            }
        },
        methods: {
            onSignUp() {
                if(this.isFormValid) {
                    this.$axios.$get('/test')
                }
            }
        }
    }
</script>

<style>
@import '~/assets/css/components/form.css';
@import '~/assets/css/variables.css';

.forgot-password{
    font-size: 1.4rem;
    margin-left: 1.8rem;
    cursor: pointer;
}
</style>

