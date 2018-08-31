<template>
    <form @submit.prevent="onSignUp" class="absolute-center auth-form">
        <h1 class="title title--big text-center auth-form__title">Регистрация</h1>
        <input v-model="email" type="email" class="input auth-form__input" placeholder="Email">
        <input v-model="password" type="password" class="input auth-form__input" placeholder="Пароль">
        <input v-model="confirmPassword" type="password" class="input auth-form__input" placeholder="Подтверждение пароля">
        <div class="d-flex">  
            <button 
                type="submit" 
                class="button button--success auth-form__button"
                :class="{'button--disabled': !isFormValid}"
                :disabled="!isFormValid">Регистрация</button>
        </div>
        <p class="form__question">Уже есть аккаунт? <nuxt-link to="/Vhod" class="link">Войти</nuxt-link></p>
    </form>
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
                this.$store.commit('setSpiner', true)
                if(this.isFormValid) {
                    this.$axios.$post('/signup',{
                        name: this.email,
                        password: this.password
                    })
                    .then(res => {
                        if(res.status === 'ok') {
                            this.$store.commit('setSpiner', false);
                            this.$router.push('/Vhod');
                        } else {
                            this.$store.commit('setStatus', 'error');
                            this.$store.commit('setMessage', res.message);
                            this.$store.commit('setSpiner', false);
                        }
                    })
                    .catch(e => {
                        this.$store.commit('setSpiner', false);
                    })
                }
            }
        }
    }
</script>

<style>
.forgot-password{
    font-size: 1.4rem;
    margin-left: 1.8rem;
    cursor: pointer;
}

.form__input {
    max-width: 100%;
    margin-bottom: 2rem;
    border: 1px solid
}
</style>

