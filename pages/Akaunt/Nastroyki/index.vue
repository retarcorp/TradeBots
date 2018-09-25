<template>
<div>
    <div v-if="getStatus === 'newPass'" class='confirm-block' @click="checkWindow">
        <div class='confirm-block__content'>
            <p>{{ statusAlert[getStatus] }}</p>
            <div class='confirm-block__buttons-box'>
                <button
                    class='button button--success'
                    @click='onConfirm'>Да
                </button>
                <button
                    class='button'
                    @click='onCancel'>Нет
                </button>
            </div>
        </div>
    </div>
    <div class="settings">
        <div class="settings__title title--medium">Изменение пароля</div>
        <div class="settings__form">
            <form>
                <div class="form-control">
                    <div class="label">Текущий</div>
                    <input v-model="currentPass" class="input" type="password">
                </div>
                <div class="form-control">
                    <div class="label">Новый пароль</div>
                    <input v-model="newPass" class="input" type="password">
                </div>
                <div class="form-control">
                    <div class="label">Подтверждение нового пароля</div>
                    <input v-model="confirmedNewPass" class="input" type="password">
                </div>
                <div class="form__actions">
                    <button @click.prevent="safePass" :class="{'button--disabled': !isFormValid}" :disabled="!isFormValid" class=" button button--success">Сохранить</button>
                    <!-- <button class=" button button--danger">Удалить</button> -->
                </div>
            </form>
        </div>
    </div>
</div>
</template>

<script>
export default {
    data() {
        return {
            currentPass: '',
            newPass: '',
            confirmedNewPass: '',
            statusAlert: {
                newPass: 'Вы точно хотите изменить пароль?'
            }
        }
    },
    computed: {
        getStatus() {
            return this.$store.getters.getStatus;
        },
        clientAnswer() {
            return this.$store.getters.getClientAnswer;
        },
        isFormValid() {
            return this.currentPass !== '' &&
                this.newPass !== '' &&
                this.confirmedNewPass !== '' &&
                this.newPass == this.confirmedNewPass
        }
    },
    methods: {
        safePass() {
            let newPass = {
                currentPass: this.currentPass,
                newPass: this.newPass,
                confirmedNewPass: this.confirmedNewPass
            }
            this.$store.commit('setStatus', 'newPass');
            if(this.clientAnswer === 'acceptNewPass') {
                this.$store.dispatch('setNewPassword', newPass);
                this.currentPass = '';
                this.newPass = '';
                this.confirmedNewPass = '';
            }
        },
        onCancel() {
            this.$store.commit('clearStatus');
        },
        checkWindow(event) {
            if (event.target.getAttribute('class') === 'confirm-block') {
                this.$store.commit('clearStatus');
            }
        },
        onConfirm() {
            if( this.getStatus === 'newPass') {
                this.$store.commit('setClientAnswer', 'acceptNewPass');
                this.safePass();
            }
            this.onCancel();
            this.$store.commit('clearAnswer');
        }
    }
}
</script>


<style scoped>
.settings__title {
    font-size: 2rem;
    font-weight: 700;
    line-height: 2.3rem;
    color: inherit;
    margin-bottom: 3.5rem;
}
.settings {
    max-width: 31.7rem;
    width: 100%
}
.form__input {
    max-width: 31.7rem;
}

.form__actions {
    display: flex
}

.form__button:not(:last-child) {
    margin-right: 2rem;
}

.confirm-block {
    display: block;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
}

.confirm-block__content {
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 60%;
}

.confirm-block__content p {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.confirm-block__buttons-box {
    display: flex;
    justify-content: center;
}

.button:not(:last-child) {
    margin-right: 25px;
}

.confirm-block__buttons-box button{
    height: 3rem;
    width: 10rem;
}
</style>
