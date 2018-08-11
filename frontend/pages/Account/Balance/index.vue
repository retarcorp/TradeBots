<template>
    <section class="balance">
        <header class="panel__header">
            <h1>Пополнение баланса</h1>
            <p class="panel__header-help">
                    Для пополнения баланса, перечислите нужную суму на кошелек:
                    <span class="code-purse">8AwyYdyrG8yesfNjFKEQETaNu9nPWtwsj</span>
            </p>
        </header>
        <div class="balance__history">
            <h1>История</h1>
            <table class="page__table">
                <tr class="table__tr">
                    <td class="table__td date">22.03.2018 12.35</td>
                    <td class="table__td operation">Пополнение баланса</td>
                    <td class="table__td score refill">+0.00065906 (<span>BTC</span>)</td>
                </tr>
                <tr class="table__tr">
                    <td class="table__td date">22.03.2018 12.35</td>
                    <td class="table__td operation">Списание за тариф "Оптимум"</td>
                    <td class="table__td score debit">-0.00065906 (<span>BTC</span>)</td>
                </tr>
                <tr class="table__tr">
                    <td class="table__td date">22.03.2018 12.35</td>
                    <td class="table__td operation">Пополнение баланса</td>
                    <td class="table__td score refill">+0.00065906 (<span>BTC</span>)</td>
                </tr>
                <tr class="table__tr">
                    <td class="table__td date">22.03.2018 12.35</td>
                    <td class="table__td operation">Списание за тариф "Оптимум"</td>
                    <td class="table__td score debit">-0.00065906 (<span>BTC</span>)</td>
                </tr>
                <tr class="table__tr">
                    <td class="table__td date">22.03.2018 12.35</td>
                    <td class="table__td operation">Пополнение баланса</td>
                    <td class="table__td score refill">+0.00065906 (<span>BTC</span>)</td>
                </tr>
                <tr class="table__tr">
                    <td class="table__td date">22.03.2018 12.35</td>
                    <td class="table__td operation">Списание за тариф "Оптимум"</td>
                    <td class="table__td score debit">-0.00065906 (<span>BTC</span>)</td>
                </tr>
            </table>
        </div>
    </section>
</template>

<style scoped>
.page__table{
    width: 100%;
    margin: 1rem auto;
    border-collapse: collapse;
}
.table__tr{
    display: flex;
    border-bottom: 1px solid #E3E3E3;
}
.table__tr:last-child{
    border-bottom: none;
}
.table__td,
.table__th{
    flex: 1;
    font-size: 1.4rem;
    font-weight: 500;
    padding: 2rem 0;
    text-align: start;
    display: flex;
    align-items: center;
}

/*    */


/* TABS BAR */

.tabs__bar{
    border-bottom: 1px solid #CECECE;
}

.tabs__item{
    display: inline-block;
    padding: 1.3rem 1.4rem;
    font-size: 1.4rem;
    position: relative;
    cursor: pointer;
}

.tabs__content{
    padding: 0 1.4rem;
}
</style>

