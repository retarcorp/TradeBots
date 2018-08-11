<template>
    <header class="header">
        <div class="container">
            <div class="row">
                <div class="col-auto">
                    <nav class="nav">
                        <nuxt-link to="/bots" class="nav__link">Боты</nuxt-link>
                        <nuxt-link to="/b" class="nav__link">Статистика</nuxt-link>
                        <nuxt-link to="/b" class="nav__link">Доход</nuxt-link>
                        <nuxt-link to="/account" class="nav__link">Аккаунт</nuxt-link>
                    </nav>
                </div>
            </div>
        </div>
    </header>
</template>

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
</style>
