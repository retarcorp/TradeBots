<template>
    <div class="container rates">
        <!-- <div class="modal-wrapper" v-if='editPopup'>
            <div class="modal-wrapper__content">
                <span class="close" @click='closePopup'>&times;</span>
                <p>Some text in the Modal..</p>
            </div>
        </div> -->
        <div class="modal-wrapper" v-if='deletePopup' @click='statusCheck'>
            <div class="modal-wrapper__content">
                <span class="close" @click='closePopup'>&times;</span>
                <p>Вы действительно желаете удалить данный тариф?</p>
                <input type="button" value="Удалить" @click='confirmDeleteTariff'>
                <input type="button" value="Отмена" @click='closePopup'>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <table class="table">
                    <tr class="table__tr">
                        <th class="table__th">Название тарифа</th>
                        <th class="table__th">Цена</th>
                        <th class="table__th">Макс. кол-во ботов</th>
                        <th class="table__th">Длительность использования</th>
                        <th class="table__th"></th>
                    </tr>
                    <tariff
                        v-for='(tariff, index) in tariffList' 
                        :key='index'
                        @checkStatus='checkStatus'
                        :tariff='tariff'>
                    </tariff>
                </table>
                <button 
                    @click.prevent="onAddTariff" 
                    class="button button--success rates__addTariff">Добавить тариф
                </button>
            </div>
        </div>
        <app-modal 
            :open="isModalOpen"
            :curTariff='currentTariff'
            :status='currentStatusModal' 
            @changeStatus='changeStatus'>
        </app-modal>
    </div>
</template>
<script>
import modal from '~/components/TariffSettings';
import tariffElement from '~/components/TariffElement';

    export default {
        components: {
            appModal: modal,
            tariff: tariffElement
        },
        layout: 'admin',
        data() {
            return {
                isModalOpen: false,
                deletePopup: false,
                editPopup: false,
                currentTariff: '',
                currentStatusModal: ''
            }
        },
        computed: {
            tariffList() {
                return this.$store.getters.getTariffList;
            }
        },
        methods: {
            onAddTariff() {
                this.currentStatusModal = 'add';
                this.isModalOpen = true;
                this.currentTariff = {
                    title: '',
                    price: '',
                    maxBotAmount: '',
                    termOfUse: ''
                }
            },
            changeStatus() {
                this.isModalOpen = false;
            },
            checkStatus(title, tariff) {
                this.currentTariff = tariff;
                if (title === 'edit')  {
                    this.isModalOpen = true;
                    this.currentStatusModal = 'edit';
                }
                else this.deletePopup = true;
            },
            closePopup() {
                this.editPopup = false;
                this.deletePopup = false;
            },
            confirmDeleteTariff() {
                this.$axios
                    .$post('/api/admin/removeTariff', this.currentTariff)
                    .then(res => {
                        this.deletePopup = false;
                        this.$store.dispatch('loadTariffList');
                    })
                    .catch(error => console.log(error))
            },
            statusCheck(event) {
                if( event.target.classList.contains('modal-wrapper') ) {
                    this.closePopup();
                }
            }
        },
        created() {
            this.$store.dispatch('loadTariffList');
        }
    }
</script>
<style>
.modal-wrapper {
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.modal-wrapper__content {
    background-color: #fefefe;
    margin: 15% auto; /* 15% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 80%; /* Could be more or less, depending on screen size */
}

/* The Close Button */
.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}
</style>
