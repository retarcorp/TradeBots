<template>
    <div class="binance">
        <div class="binanse__title title--medium">Настройка доступа для Binance</div>
        <div class="binance__sub-title title--small">Для начала работы привяжете ваш аккаунт Binance</div>
        <div class="binance__form">
            <form class="binance__form">
                <div class="form-control">
                    <label class="label">Название</label>
                    <input v-if="!isSaved" v-model="binance.name" type="text" class="input">
                    <div v-else>{{ binance.name }}</div>
                </div>
                <div class="form-control">
                    <label class="label">Api Key</label>
                    <input v-if="!isSaved" v-model="binance.key" type="text" class="input">
                    <div v-else>{{ binance.key }}</div>
                </div>
                <div class="form-control">
                    <label class="label">Api Secret</label>
                    <input v-if="!isSaved" v-model="binance.secret" type="text" class="input">
                    <div v-else>{{ binance.secret ? '***' : '' }}</div>
                </div>
                <div class="form__actions">
                    <div class="d-flex">
                        <button v-if="!isSaved"
                                @click.prevent="onSettingsSave" 
                                :class="{'button--disabled': !isFormValid}" 
                                :disabled="!isFormValid" 
                                class="button button--success">Сохранить</button>
                        <button v-else @click.prevent="isSaved = false" 
                                class="button button--success">Изменить</button>
                        <button @click.prevent="onSettingsDelete" 
                            class="button button--danger">Удалить</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                isSaved: true
            }
        },
        computed: {
            binance() {
                return this.$store.getters.getBinanceAPI;
            },
            isFormValid() {
                console.log(this.binance)
                return this.binance.name && this.binance.key && this.binance.secret; /* && this.binance.key.indexOf('*') === -1 && (this.binance.secret.indexOf('*') === -1 || this.binance.secret.indexOf('***') === 0);*/
            }
        },
        methods: {
            onSettingsSave() {
                // this.$store.commit('setSpiner', true);
                this.$store.dispatch('setBinanceAPI', this.binance);
                this.$router.push('/Account');
            },
            onSettingsDelete() {
                this.$store.dispatch('deleteBinanceAPI');
                this.binance = {};
                this.isSaved = true;
                this.$router.push('/Account');
            }
        }
    }
</script>

