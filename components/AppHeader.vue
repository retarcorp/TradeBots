<template>
    <header class="header">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <nav class="nav">
                        <div v-if="isAuth" class="nav__left">
                            <nuxt-link to="/Boty" class="nav__link">Боты</nuxt-link>
                            <nuxt-link to="/Statistika" class="nav__link">Статистика</nuxt-link>
                            <nuxt-link to="/Dohod" class="nav__link">Доход</nuxt-link>
                            <nuxt-link to="/Akaunt" class="nav__link">Аккаунт</nuxt-link>
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
                this.$router.push('/Vhod')
            },
            onSignOut() {
                this.$store.commit('setSpiner', true);
                this.$axios.$get('/signout')
                    .then(res => {
                        if(res.status === 'ok') {
                            this.$router.push('/Registratsia')
                            this.$store.commit('setSpiner', false);
                            this.$store.dispatch('setAuthorizedStatus', false)
                        } else {
                            alert(res.message)
                            this.$store.commit('setSpiner', false);
                        }
                    })
                    .catch(e => console.log(e))
            }
        }
    }
</script>

<style>
.header {
    max-height: 7rem;
    height: 100%;
    background-color: #EFEFEF;
    padding: 2rem 0;
    margin-bottom: 2rem;
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    z-index: 9999;
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

.nav__right {
    margin-left: auto
}
</style>
