<template>
    <header class="header header-admin">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <nav class="nav">
                        <div  class="nav__left">
                            <h1 class="title--big header-admin__title">Панель управления</h1>
                            <nuxt-link exact to="/admin/" class="nav__link">Пользователи</nuxt-link>
                            <nuxt-link exact to="/admin/rates" class="nav__link">Тарифы</nuxt-link>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    </header>
</template>

<script>
    export default {
    }
</script>

<style>

</style>
