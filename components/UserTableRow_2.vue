<template>
	<div class="modal-wrapper" v-show='open'  @click='changeStatus'>
        <div class="modal">
            <form class="container-fluid">
                <h1 class="title title--big modal__title">{{user.name}} ({{user.userId}}, Email {{user.active ? "подтвержден" : "не подтвержден"}})</h1>
                <div class="row">
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Дата регистрации</label>
                            <!-- <input class="input" type="text" v-model='user.regDate' :disabled="disabledAllTime"> -->
							<div class="input_p">
                            	<p>{{getDate(user.regDate)}}</p>
							</div>
                        </div>
                        <div class="form-control">
                            <label class="label">Баланс кошелька (BTC)</label>
                            <input class="input" :class="{active: isEdit, editable__input: true}" type="text" v-model='user.walletBalance' :disabled="disabled">
							<!-- <div class="input_p">
								<p>{{user.walletBalance}}</p>
							</div> -->
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Количество ботов</label>
                            <!-- <input class="input" type="number" v-model='user.botsCount' :disabled="disabledAllTime"> -->
							<div class="input_p">
								<p>{{user.botsCount}}</p>
							</div>
                        </div>
                        <div class="form-control">
                            <label class="label">Макс. кол-во ботов</label>
                            <input class="input" :class="{active: isEdit, editable__input: true}" type="number" v-model='user.maxBotAmount' :disabled="disabled">
                        </div>
                        <div class="form-control">
                            <label class="label">Подтверждение эмайла</label>
                            <!-- <input class="input" :class="{active: isEdit, editable__input: true}" type="number" v-model='user.active' :disabled="disabled"> -->
                            <input class="input" :class="{active: isEdit, editable__input: true}" :disabled="disabled" type="checkbox" name="active" v-model="user.active">
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Купленные тарифы</label>
                            <!-- <input v-for="(tariff, i) in user.tariffs" :key="i" class="input" type="number" v-model='tariff.title' :disabled="disabledAllTime"> -->
							<div v-for="(tariff, i) in user.tariffs" :key="i" class="input_p">
								<p>{{tariff.title}}</p>
                                <datetimepicker class="next" :class="{active: isEdit, editable__input: true}" format="MM/DD/YYYY H:i:s" v-model="tariff.expirationDatePattern" placeholder="Select Date"></datetimepicker>
							</div>
                        </div>
                    </div>
                </div>
				<button v-show="!isEdit" class="button button--success" @click.prevent="activateEditor">Редактировать</button>
                <!-- <button class="button button--success" @click.prevent='onSaveTariff'>Редактировать</button> -->
				<button class="button button--success" v-show="isEdit" @click.prevent="editUser(userIndex)">Сохранить</button>
				<button class="button button--danger" v-show="isEdit" @click.prevent="deleteUser(userIndex)">Удалить</button>
                <button class="button button--danger" @click='refreshPage'>Обновить</button>
            </form>
        </div>
    </div>
</template>

<script>
import datetimepicker from 'vuejs-datetimepicker';
    export default {
        components: {
            datetimepicker
        },
		props: {
            open: {
                type: Boolean,
                required: true,
                default: false
            },
            user: {
                type: Object
            },
            userIndex: {
                type: Number
            },
            status: {
                type: String
            }
		},
        data() {
            return { 
                isEdit: false,
				disabled: true,
				disabledAllTime: true
            }
        },
        watch: {
            // 'user.tariffs': {
            //     handler: function (val) {
            //         val.forEach((el, i, arr)=> {
            //             arr[i].expirationDate = new Date(el.expirationDate).getTime()
            //         })
            //         console.log(val)
            //     },
            //     deep: true
            // }
        },
        methods: {
            refreshPage () {
                location.reload()
            },
			changeStatus(event) {
                if( event.target.classList.contains('modal-wrapper') ) {
                    this.$emit('changeStatus', false);
                    this.isEdit = false;
                    this.disabled = true;
                    this.$store.dispatch('setUsers');
                }
            },
            getDate(date = Date.now()) {
                date = new Date(date);
                let hh = String(date.getHours()),
                    ss = String(date.getSeconds()),
                    DD = String(date.getDate()),
                    mm = String(date.getMinutes()),
                    MM = String(date.getMonth() + 1),
                    YYYY = date.getFullYear();

                hh = hh.length < 2 ? '0' + hh : hh;
                mm = mm.length < 2 ? '0' + mm : mm;
                ss = ss.length < 2 ? '0' + ss : ss;
                DD = DD.length < 2 ? '0' + DD : DD;
                MM = MM.length < 2 ? '0' + MM : MM;

                return `${DD}/${MM}/${YYYY} ${hh}:${mm}:${ss}`;
            },
            saveUser() {
                this.isEdit = false;
                this.disabled = true;
            },
            editUser(userIndex) {
                this.$store.dispatch('editUser', userIndex);
                this.saveUser();
            },
            deleteUser(userIndex) {
				this.$emit('deleteUser', userIndex)	
                // if(userIndex >= 0) {
				// 	console.log(userIndex)
                //     this.tmpUserIndex = userIndex;
                //     this.$emit('getUserIndex', userIndex);
                //     this.$store.commit('setStatus', 'deleteUser');
                //     // if(this.clientAnswer === 'acceptDeleteUser') {
                //     //     this.$store.dispatch('deleteUser', userIndex);
                //     //     this.tmpUserIndex = null;
                //     // }
                // }
            },
            activateEditor() {
                this.isEdit = true;
                this.disabled = false;
            }
        },
        mounted() {
            // document.querySelector('.okButton').addEventListener('click', () => {
            //     let date = document.getElementById('tj-datetime-input').value;
            //     let initialDate = document.getElementById('hiddenExpDate').value;
            //     date = new Date(date).getTime();
            //     this.user.tariffs.forEach((el, i, arr) => {
            //         if (el.expirationDate == date) {

            //         }
            //     })
            // })
			// this.$store.dispatch('setUsers');
        }
        
    }
</script>
<style scope>
.form-control {
	padding: 1rem;
}
.form-control > p {
	padding: 0.5rem;
}
.form-control > input {
	padding: 0.5rem;
}

.next input + div {
    z-index: 564;
}

.input_p {
	border: none;
}

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
	width: 70vw;
    max-width: 80vw;
    padding: 2rem;
    background-color: #fefefe;
}

.modal__title {
    margin-bottom: 2.5rem;
}
.editable__input{
    border: 1px solid transparent;
    background-color: #fff;
    font-size: 1.6rem;
    pointer-events: none;
}
.editable__input.active{
    border: 1px solid #000;
    pointer-events: inherit;
}

</style>