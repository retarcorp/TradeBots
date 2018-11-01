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

        <vue-recaptcha 
            ref="recaptcha" 
            @verify="onCaptchaVerified"
            data-callback="onCaptchaVerified"
            class="g-recaptcha" 
            data-sitekey="6Le_9HcUAAAAADuYPBK5e7NQzw1V3_IH29iOQivV">
        </vue-recaptcha>

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
        <p class="form__question">Уже есть аккаунт? <nuxt-link to="/SignIn" class="link">Войти</nuxt-link></p>
    </form>
</template>

<script>
    export default {
        data() {
            return {
                email: '',
                password: '',
                confirmPassword: '',
                captchaToken: ''
            }
        },
        components: {
            'vue-recaptcha': null
        },
        mounted: function() {
            // if (window.grecaptcha) {
            //     window.grecaptcha.render('g-recaptcha-placeholder');
            // } 
        },
        computed: {
            isRightPassword() {
                let regexp = /[а-яё]/gi;
                return this.password.length >= 6 
                    && this.password.length <= 20
                    && this.email.length !== 0
                    && this.password.toUpperCase() !== this.password
                    && this.password.toLowerCase() !== this.password
                    && this.password.match(/[0-9]/) !== null
                    && !regexp.test(this.password)
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
                // this.$store.commit('setSpiner', true);
                // console.log(this.$refs.recaptcha.value);
                if (!((this.captchaToken = window.grecaptcha.getResponse(0)).length)) {
                    //@TODO Add handler
                    
                    return null; 
                }
                
                if(this.isFormValid) {
                    this.$axios.$post('/api/signup',{
                        name: this.email,
                        password: this.password,
                        'g-recaptcha-response': this.captchaToken
                    })
                    .then(res => {
                        console.log(res);

                        if(res.status === 'ok') {
                            this.$router.push('/SignIn');
                            this.$store.commit('setStatus', 'ok');
                            this.$store.commit('setMessage', "Регистрация прошла успешно, на почту было выслано письмо с сылкой на активацию аккаунта!");
                        
                        
                        } else if(res.status === 'error') {
                            this.$store.commit('setStatus', 'error');
                            this.$store.commit('setMessage', res.message);
                        }
                    })
                    .catch(e => {
                        // this.$store.commit('setSpiner', false);
                    })
                }
            },
            onCaptchaVerified(captcha){
                console.log(captcha);
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
            closeInfoPopup() {
                if( !this.isRightPassword ) {
                    this.$store.commit('setStatus', 'info');
                    this.$store.commit('setMessage', 'Пароль должен содержать от 6 до 20 символов, включая минимум одну заглавную букву, прописную и цифру и не содержать русские символы.');
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
</style>
