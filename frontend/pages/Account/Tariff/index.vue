<template>
    <section class="tariff">
        <header class="panel__header">
            <h1>Изменение тарифа</h1>
        </header>
        <div class="tariff__container">
            <div class="tariff__item">
                <h1 class="tariff__name">Тариф 1</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="page__button button__select-tariff">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__name">Тариф 2</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="page__button button__select-tariff">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__name">Тариф 3</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="page__button button__select-tariff">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__name">Тариф 4</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="page__button button__select-tariff">Выбрать</button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.tariff__container{
    margin-top: 1.7rem;
    display: flex;
    flex-wrap: wrap;
}

.tariff__item{
    max-width: 24.4rem;
    width: 100%;
    border: 1px solid #C4C4C4;
    padding: 5rem 1.8rem 1.5rem;
    margin-top: 2.3rem;
    margin-right: 4.1rem;
}

.tariff__name{
    text-align: center;
    font-size: 2rem;
    font-weight: 500;
    margin-bottom: 3rem;
}

.list-capabilities__item{
    list-style-type: none;
    position: relative;
    font-size: 2rem;
    font-weight: 500;
    padding-left: 4rem;
}

.list-capabilities__item:not(:last-child){
    margin-bottom: 1.7rem;
}

.list-capabilities__item::before{
    content: ' ';
    left: 0;
    display: block;
    position: absolute;
    width: 2.1rem;
    height: 1.8rem;
    background-image: url('~/assets/svg/check.svg');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100%;
}

.button__select-tariff{
    /* width: 140px; */
    /* height: 45px; */
    display: block;
    background-color: #C4C4C4;
    font-size: 2rem;
    font-weight: 500;
    margin: 3.3rem auto 0;
    border: none;
    padding: 1rem 3rem;
    cursor: pointer;
}
</style>

