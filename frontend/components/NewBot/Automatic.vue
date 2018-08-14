<template>
    <div class="automatic">
        <div class="newBot__settings">
            <div class="form__control newBot__settings-control">
                <label class="label">Название бота:</label>
                <input v-model="title" type="text" class="input">
            </div>
            <div class="form__control newBot__settings-control">
                <label class="label">Базовая пара:</label>
                <select v-model="pair" type="text" class="input">
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            <div class="form__control newBot__settings-control">
                <label class="label">Дневной объём (BTC):</label>
                <input v-model="dailyVolumeBTC" type="text" class="input">
            </div>
        </div>
        <div class="newBot__conditions">
            <div class="newBot__conditions-title">Условия для начала сделки:</div>
            <div class="newBot__conditions-wrapper">
                <select
                    v-model="automaticItem.signal"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Стратегия</option>
                    <option 
                        v-for="signal in signals" 
                        :key="signal.id" 
                        :value="signal.id"
                        >{{ signal.name }}</option>
                </select>
                <select
                    v-model="automaticItem.timeframe"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Таймфрейм</option>
                    <option 
                        v-for="tr in timefraims" 
                        :key="tr.id" 
                        :value="tr.id"
                        >{{ tr.name }}</option>
                </select>
                <select
                    v-model="automaticItem.transactionTerm"
                    class="newBot__conditions-select">
                    <option value="default" disabled selected>Рекомендация</option>
                    <option
                        v-for="rec in transactionTerms"
                        :key="rec.id"
                        :value="rec.id"
                        >{{ rec.name }}</option>
                </select>
                <button
                    @click.prevent="addItem" 
                    class="button button--success newBot__conditions-select"
                    :class="{'button--disabled' : isFormValid}"
                    :disabled="isFormValid">Добавить условие</button>
            </div>
        </div>
        <div class="newBot__list">
            <automatic-item
                v-for="(item,i) in automaticItems"
                :key="item.id"
                :item="item"
                @item-deleted="onDeleteItem(i)">{{ i+1 }}</automatic-item>
        </div>
        <div class="text-right">
            <button
                @click.prevent="addAutomaticBot"
                :disabled="automaticItems.length === 0" 
                class="button button--success"
                :class="{'button--disabled': automaticItems.length === 0}"
                >Добавить</button>
        </div>
    </div>
</template>

<script>
import AutomaticItem from '~/components/NewBot/AutomaticItem';
export default {
    name: 'bot-automatic',
    components: {
        AutomaticItem
    },
    data() {
        return {
            title: '',
            dailyVolumeBTC: '',
            pair: '',
            automaticItem: {
                signal: 'default',
                timefreim: 'default',
                transactionTerm: 'default'
            },
            automaticItems: [],
            signals: [
                { id: 'Tradingview', name: 'Tradingview'}
            ],
            timefraims: [
                { id:"1M", name: '1M' },
                { id:"3M", name: '3M' },
                { id:"5M", name: '5M' },
                { id:"15M", name: '15' },
                { id:"30M", name: '30' },
                { id:"1H", name: '1H' },
                { id:"2H", name: '2H' },
                { id:"4H", name: '4H' },
                { id:"6H", name: '6H' },
                { id:"12H", name: '12' },
                { id:"1D", name: '1D' },
                { id:"1W", name: '1W' }
            ],
            transactionTerms: [
                { id: 'BUY', name: 'Buy'},
                { id: 'STRONG_BUY', name: 'Strong Buy'}
            ]
        }
    },
    computed: {
        isFormValid() {
            return Object.keys(this.automaticItem)
                .find(field => this.automaticItem[field] === 'default')
        }
    },
    methods: {
        addItem() {
            this.automaticItems.push(this.automaticItem)
            this.automaticItem = {
                signal: 'default',
                timeframe: 'default',
                transactionTerms: 'default'
            }
        },
        onDeleteItem(i) {
            this.automaticItems.splice(i, 1)
        },
        addAutomaticBot() {
            const automaticBot = {
                'title': this.title,
                'pair': this.pair,
                'dailyVolumeBTC': this.dailyVolumeBTC,
                'tradingsSignals': this.automaticItems
            }
            this.$store.dispatch('addBot', automaticBot)
        }
    }
}
</script>

<style scoped>
.newBot__settings {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
}

.newBot__settings-control {
    max-width: 22.1rem;
    width: 100%;
}

.newBot__settings-control:not(:last-child) {
    margin-right: 1.8rem;
}

.form__input {
    border: 1px solid #DCDCDC
}

.newBot__settings {
    margin-bottom: 2rem
}

.newBot__conditions {
    margin-bottom: 2rem
}

.newBot__conditions-title {
    font-size: 1.8rem;
    line-height: 1.8rem;
    color: inherit;
    margin-bottom: 1.1rem;
}

.newBot__conditions-wrapper {
    display: flex;
    flex-wrap: wrap;
}

.newBot__conditions-select {
    display: block;
    max-width: 16rem;
    width: 100%;
    padding: 1rem 2rem;
    margin-bottom: .5rem;
}

.newBot__conditions-select:not(:last-child) {
    margin-right: 2rem
}

.form__button--success {
    color: #fff
}

.disabled {
    opacity: .5;
}
</style>

