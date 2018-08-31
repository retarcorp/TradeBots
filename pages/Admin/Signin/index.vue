<template>
    <form @submit.prevent="onSignIn" class="absolute-center auth-form">
        <h1 class="title title--big text-center auth-form__title">Вход в админ панель</h1>
        <input v-model="login" type="text" class="input auth-form__input" placeholder="Логин">
        <input v-model="password" type="password" class="input auth-form__input" placeholder="Пароль">
        <div class="d-flex">
            <button :class="{'button--disabled': !isFormValid}" :disabled="!isFormValid" type="submit" class="button button--success auth-form__button">Войти</button>
        </div>
    </form>
</template>

<script>
    export default {
        data() {
            return {
                login: '',
                password: ''
            }
        },
        computed: {
            isFormValid() {
                return this.login.length !== 0
                        && this.password.length !== 0
            }
        },
        methods: {
            onSignIn() {
                if(this.isFormValid) {
                    this.$axios
                        .$post('/admin/signin', {
                            login: this.login,
                            password: this.password
                        })
                        .then(res => {
                            if(res.status === 'ok') {
                                this.$router.push('/admin')
                            } else {
                                console.log(res.message);
                            }
                        })
                        .catch(e => console.log(e))
                }
            }
        }
    }
</script>