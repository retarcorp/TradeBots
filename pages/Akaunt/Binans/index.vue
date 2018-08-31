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
                        <button v-if="!isSaved" @click.prevent="onSettingsSave" class="button button--success">Сохранить</button>
                        <button v-else @click.prevent="isSaved = false" class="button button--success">Изменить</button>
                        <button @click.prevent="onSettingsDelete" class="button button--danger">Удалить</button>

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
                binance: {
                    name: '',
                    key: '',
                    secret: ''
                },
                isSaved: true
            }
        },
        methods: {
            onSettingsSave() {
                this.$store.commit('setSpiner', true)
                this.$axios
                    .$post('/account/api', this.binance)
                    .then(res => {
                        if(res.status === 'ok') {
                            this.isSaved = true;
                            this.$store.commit('setSpiner', false)
                        } else {
                            this.isSaved = false;
                            this.$store.commit('setSpiner', false)
                        }
                    })
                    .catch(e => {
                        this.$store.commit('setSpiner', false)
                    })
            },
            onSettingsDelete() {
                this.isActive = true;
                this.$axios
                    .$delete('/account/api')
                    .then(res => {
                        if(res.status === 'ok') {
                            this.binance = {
                                name: '',
                                key: '',
                                secret: ''
                            }
                            this.isSaved = true;
                            this.isActive = false;
                        } else {
                            console.log(e)
                        }
                    })
                    .catch(e => console.log(e))
            }
        },
        created() {
            this.$axios
                .$get('/account/api')
                .then(res => {
                    if(res.status === 'ok') {
                        this.binance = res.data;
                    } else {
                        console.log(e);
                    }
                })
                .catch(e => console.log(e))
        }
    }
</script>

