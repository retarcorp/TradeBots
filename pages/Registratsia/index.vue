<template>
    <form @submit.prevent="onSignUp" class="absolute-center auth-form relative-wrapper">
        <h1 class="title title--big text-center auth-form__title">Регистрация</h1>
        <input 
            v-model="email" 
            type="email" 
            class="input auth-form__input" 
            placeholder="Email"
        >
        <input 
            v-model="password" 
            type="password" 
            class="input auth-form__input" 
            placeholder="Пароль"
            name='password'
            @blur='closeInfoPopup'
        >
        <input 
            v-model="confirmPassword" 
            type="password" 
            class="input auth-form__input" 
            placeholder="Подтверждение пароля"
            name='password'
            
        >
        <div class="d-flex">
            <button
                type="submit"
                class="button button--success auth-form__button"
                :class="{'button--disabled': !isFormValid}"
                :disabled="!isFormValid">Регистрация</button>
                <button 
                    type='button'
                    class="button auth-form__button"
                    @mouseup="onClosePassword"
                    @mousedown='onViewPassword'>Показать пароль
                </button>
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
                confirmPassword: '',
                statusInfo: false
            }
        },
        computed: {
            isRightPassword() {
                return this.password.length >= 6 
                    && this.password.length <= 20
                    && this.email.length !== 0
                    && this.password.toUpperCase() !== this.password
                    && this.password.toLowerCase() !== this.password
                    && this.password.match(/[0-9]/) !== null
                    ? true
                    : false;
            },
            isFormValid() {
                return this.password === this.confirmPassword
                    && this.isRightPassword;
            }
        },
        methods: {
            onSignUp() {
                this.$store.commit('setSpiner', true);
                if(this.isFormValid) {
                    this.$axios.$post('/signup',{
                        name: this.email,
                        password: this.password
                    })
                    .then(res => {
                        console.log(res.status)
                        if(res.status !== 'error') {
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
            },
            onViewPassword() {
                Array.from(document.querySelectorAll('input[type="password"]')).forEach(elem => {
                    elem.setAttribute('type','text');
                })
            },
            onClosePassword() {
                Array.from(document.querySelectorAll('input[type="text"]')).forEach(elem => {
                    elem.setAttribute('type','password');
                })
            },
            // infoPopup() {
            //     // this.statusInfo = false;
            // },
            // closeApp() {
            //     this.statusInfo = false;
            // },
            closeInfoPopup() {
                if( !this.isRightPassword ) {
                    this.$store.commit('setStatus', 'info');
                    this.$store.commit('setMessage', 'Пароль должен содержать от 6 до 20 символов, включая минимум одну заглавную букву, прописную и цифру.');
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
}
.info-popup {
    text-align: justify;
    font-size: 1.6rem;
    margin-top: 2rem;
    display: flex;
    justify-content: space-between;
    font-family: 'Roboto', sans-serif;
    border: 1px solid #E3E3E3;
    position: absolute;
    top: 230px;
    left: 7px;
    margin-left: 1rem;
    width: 221px;
    background-color: white;
    z-index: 9999;
}

.info-popup p {
    padding: 0.5rem;
    font-size: 1.8rem
}
</style>
