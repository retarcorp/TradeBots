<template>
    <div class="modal-wrapper" v-if='open' @click='changeStatus'>
        <div class="modal">
            <form class="container-fluid">
                <h1 class="title title--big modal__title">title</h1>
                <div class="row">
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Название</label>
                            <input class="input" type="text" v-model='curTariff.title'>
                        </div>
                        <div class="form-control">
                            <label class="label">Цена</label>
                            <input class="input" type="text" v-model='curTariff.price'>
                        </div>
                        <div class="form-control">
                            <label class="label">Макс. кол-во ботов</label>
                            <input class="input" type="text" v-model='curTariff.maxBotAmount'>
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Длительность использования</label>
                            <input class="input" type="number" v-model='curTariff.termOfUse'>
                        </div>
                    </div>
                </div>
                <button class="button button--success" @click.prevent='onSaveTariff'>Сохранить</button>
            </form>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            open: {
                type: Boolean,
                required: true,
                default: false
            },
            curTariff: {
                type: Object
            },
            status: {
                type: String
            }
        },
        data() {
            return {
                tarif_name: '',
                tarif_price: '',
                bots_maxCount: '',
                termOfUse: ''
            }
        },
        methods: {
            changeStatus(event) {
                if( event.target.classList.contains('modal-wrapper') ) {
                    this.$emit('changeStatus', false);
                    this.tarif_name = '';
                    this.tarif_price = '';
                    this.bots_maxCount = '';
                    this.termOfUse = '';
                }
            },
            onSaveTariff() {
                if( this.status === 'add' ) {
                    console.log(this.curTariff.title)
                    this.$axios.post('/api/admin/setTariff', {
                        title: this.curTariff.title,
                        price: this.curTariff.price,
                        maxBotAmount: this.curTariff.maxBotAmount,
                        termOfUse: this.curTariff.termOfUse
                    })
                        .then(res => {
                            if( res.status === 200) {
                                this.$store.dispatch('loadTariffList');
                                this.$emit('changeStatus', false);
                                this.tarif_name = '';
                                this.tarif_price = '';
                                this.bots_maxCount = '';
                                this.termOfUse = '';
                            } else {
                                console.log(res.status);
                            }
                        })
                        .catch(error => console.log(error))
                } else {
                    this.$axios.post('/api/admin/editTariff', {
                        title: this.curTariff.title,
                        price: this.curTariff.price,
                        maxBotAmount: this.curTariff.maxBotAmount,
                        termOfUse: this.curTariff.termOfUse,
                        tariffId: this.curTariff.tariffId
                    })
                        .then(res => {
                            if( res.status === 200) {
                                this.$store.dispatch('loadTariffList');
                                this.$emit('changeStatus', false);
                                this.tarif_name = '';
                                this.tarif_price = '';
                                this.bots_maxCount = '';
                                this.termOfUse = '';
                            } else {
                                console.log(res.status);
                            }
                        })
                        .catch(error => console.log(error))
                }
            }
        }
    }
</script>

<style>
.modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background-color: rgba(0,0,0,0.4);
    overflow: auto;
}
.modal {
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    max-width: 545px;
    padding: 2rem;
    background-color: #fefefe;
}

.modal__title {
    margin-bottom: 2.5rem;
}
</style>
