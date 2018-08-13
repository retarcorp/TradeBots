<template>
    <div class="container account">
        <div class="row">
            <div class="col-12 col-md-6 col-lg-4 border-right">
                <div class="account__menu">
                    <div class="account__menu-item">
                        Баланс: 0.124 BTC
                        <nuxt-link to="/account/balance" class="account__menu-link">Пополнить</nuxt-link>
                    </div>
                
                
                    <div class="account__menu-item">
                        Тариф: Оптимум
                        <nuxt-link to="/account/tariff" class="account__menu-link">Изменить</nuxt-link>
                    </div>
                
                    <div class="account__menu-item">
                        Аккаунт Binance: не задано
                        <nuxt-link to="/account/binance" class="account__menu-link">Задать</nuxt-link>
                    </div>
                </div>
                <nuxt-link to="/account/settings" tag="button" class="account__button">Изменить пароль</nuxt-link>
            </div>
            <div class="col-12 col-md-6 col-lg-8">
                <nuxt-child />
            </div>
        </div>
    </div>
</template>

<style>
.account__menu-item {
    font-size: 2rem;
    line-height: 2.3rem;
    font-weight: 700;
}

.account__menu-item:not(:last-child) {
    margin-bottom: 1.4rem
}

.account__menu-link {
    display: inline-block;
    margin-left: .7rem;
    font-size: 1.4rem;
    line-height: 1.6rem;
    text-decoration: underline;
    color: inherit;
}

.account__button {
    display: block;
    margin-top: 7.4rem;
    padding: 2rem 5rem;
    font-size: 1.8rem;
    line-height: 2.1rem;
    color: #000;
    background-color: var(--bg-color-primary);
    border: none;
    cursor: pointer;
    font-weight: 700;
    margin-bottom: 4rem;
}
</style>

