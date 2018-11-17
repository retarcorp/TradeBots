<template>
    <header class="header header-admin">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <nav class="nav">
                        <div  class="nav__left">
                            <h1 class="title--big header-admin__title">Панель управления</h1>
                            <nuxt-link exact to="/admin" class="nav__link">Пользователи</nuxt-link>
                            <nuxt-link exact to="/admin/rates" class="nav__link">Тарифы</nuxt-link>
                            <nuxt-link exact to="/admin/pages" class="nav__link">Страницы</nuxt-link>
                            <nuxt-link exact to="/admin/loggerviewer" class="nav__link">Logger</nuxt-link>
                            <nuxt-link exact to="/admin/paymentsinfo" class="nav__link">Payments</nuxt-link>
                            <!-- <nuxt-link exact to="/admin/wallet" class="nav__link">BTC-Кошелёк</nuxt-link> -->
                        </div>
                        <div class="nav__right">
                            <button 
                                v-if="isAuth" 
                                @click.prevent="onSignOut" 
                                class="nav__link btn__signout">Выйти</button>
                            <!-- <button 
                                v-else
                                @click.prevent="onSignIn"
                                class="nav__link btn__signout">Войти</button> -->
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
                return this.$store.getters.getAdminAuthorizedStatus;
            }
        },
        methods: {
            onSignIn() {
                this.$router.push('/SignIn')
            },
            onSignOut() {
                this.$store.commit('setSpiner', true);
                this.$store.dispatch('adminSignout');
            }
        },
        created() {
            this.$store.dispatch('setUsers');
        }
    }
</script>

<style>

</style>
