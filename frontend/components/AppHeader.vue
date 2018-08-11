<template>
    <header class="header">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <nav class="nav">
                        <div class="nav__left">
                            <nuxt-link exact to="/bots" class="nav__link">Боты</nuxt-link>
                            <nuxt-link exact to="/statistics" class="nav__link">Статистика</nuxt-link>
                            <nuxt-link exact to="/incomes" class="nav__link">Доход</nuxt-link>
                            <nuxt-link exact to="/account" class="nav__link">Аккаунт</nuxt-link>
                        </div>
                        <div class="nav__right">
                            <button 
                                v-if="isAuth" 
                                @click.prevent="onSignOut" 
                                class="nav__link btn__signout">Выйти</button>
                            <button 
                                v-else
                                @click.prevent="onSignIn"
                                class="nav__link btn__signout">Войти</button>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    </header>
</template>

<script>
    export default {
        computed: {
            isAuth() {
                return this.$store.getters.getAuthorizedStatus
            }
        },
        methods: {
            onSignIn() {
                this.$router.push('/signin')
            },
            onSignOut() {
                this.$axios.$get('/signout')
                    .then(res => {
                        if(res.status === 'ok') {
                            this.$router.push('/signin')
                            this.$store.dispatch('setAuthorizedStatus', false)
                        } else {
                            alert(res.message)
                        }
                    })
                    .catch(e => console.log(e))
            }
        }
    }
</script>

<style>
@import '~/assets/css/variables.css';
.header {
    max-height: 7rem;
    height: 100%;
    background-color: #EFEFEF;
    padding: 2rem 0;
    margin-bottom: 2rem;
}

.nav {
    display: flex;
    width: 100%;
    justify-content: space-between
}

.nav__left {
    display: flex;
    flex-wrap: wrap;
}

.nav__link {
    display: block;
    font-size: 1.8rem;
    line-height: 2.1rem;
    font-weight: 700;
    color: inherit;
    text-decoration: none
}

.nav__link:not(:last-child) {
    margin-right: 2rem
}

.nuxt-link-active {
    color: #2B68E0;
}

.btn__signout {
    outline: none;
    font-size: inherit;
    display: block;
    background-color: transparent;
    border: none;
    cursor: pointer;
}
</style>
