<template>
    <section class="tariff">
        <h1 class="tariff__title title--medium">Изменение тарифа</h1>
        <div class="tariff__container">
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 1</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 2</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 3</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
            <div class="tariff__item">
                <h1 class="tariff__item-title title--medium text-center">Тариф 4</h1>
                <ul class="tariff__list-capabilities">
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                    <li class="list-capabilities__item">Возможность</li>
                </ul>
                <button class="button text-center title--medium tariff__select-button">Выбрать</button>
            </div>
        </div>
    </section>
</template>

<style>
.list-capabilities__item::before{
    content: ' ';
    left: 0;
    display: block;
    position: absolute;
    width: 2.1rem;
    height: 1.8rem;
    background-image: url('~assets/svg/check.svg');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100%;
}
</style>

