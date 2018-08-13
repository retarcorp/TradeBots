<template>
    <form @submit.prevent="onSignIn" class="absolute-center auth-form">
        <h1 class="title title--big text-center auth-form__title">Вход</h1>
        <input v-model="email" type="email" class="input auth-form__input" placeholder="Email">
        <input v-model="password" type="password" class="input auth-form__input" placeholder="Пароль">
        <button type="submit" class="button button--success auth-form__button">Войти</button>
        <span class="auth-form__forgot-password">Забыли пароль?</span>
        <p class="auth-form__not-have-account"><nuxt-link to="/signup" class="link">Регистрация</nuxt-link></p>
    </form>
</template>

<script>
    export default {
        data() {
            return {
                email: '',
                password: '',
            }
        },
        methods: {
            onSignIn() {
                this.$axios.$post('/signin', {
                    email: this.email,
                    password: this.password
                })
                .then(res => {
                    if(res.status === 'ok') {
                        this.$store.dispatch('setAuthorizedStatus', true)
                        this.$router.push('/bots')
                    } else {
                        console.log(res.message)
                    }
                })
                .catch(e => console.log(e))
            }
        }
    }
</script>