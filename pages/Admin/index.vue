<template>
    <div class="container">
        <div v-if="getStatus === 'deleteUser'" class='confirm-block' @click="checkWindow">
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
        <div class="row">
            <div class="col">
                <table class="table">
                    <thead>
                        <tr class="table__tr">
                            <th class="table__th">ID</th>
                            <th class="table__th">Email</th>
                            <th class="table__th">Дата регистрации</th>
                            <th class="table__th">Истечение тарифа</th>
                            <th class="table__th"></th>
                        </tr>
                    </thead>

                    <userTableRow 
                        v-for="(user, i) in users" 
                        :key="i" 
                        :user="user" 
                        :userIndex="i"
                        @getUserIndex='getIndex'>
                    </userTableRow>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import userTableRow from '~/components/UserTableRow.vue';
import UserTableRowVue from '../../components/UserTableRow.vue';
    export default {
        layout: 'admin',
        components: {
            userTableRow
        },
        computed: {
            getStatus() {
                return this.$store.getters.getStatus;
            },
            clientAnswer() {
                return this.$store.getters.getClientAnswer;
            },
            users() {
                return this.$store.getters.getUsers;
            }
        },
        data() {
            return {
                tmpUserIndex: null,
                statusAlert: {
                    deleteUser: 'Вы уверены, что хотите удалить этого пользователя?'
                },
                isActive: false
            }
        },
        methods: {
            onCancel() {
                this.$store.commit('clearStatus');
                this.tmpUserIndex = null;
            },
            checkWindow(event) {
                if (event.target.getAttribute('class') === 'confirm-block') {
                    this.$store.commit('clearStatus');
                }
            },
            onConfirm() {
                if( this.getStatus === 'deleteUser') {
                    this.$store.commit('setClientAnswer', 'acceptDeleteUser');
                    if(this.clientAnswer === 'acceptDeleteUser') {
                        this.$store.dispatch('deleteUser', this.tmpUserIndex);
                        this.tmpUserIndex = null;
                    }
                }
                this.onCancel();
                this.$store.commit('clearAnswer');
            },
            getIndex(index) {
                this.tmpUserIndex = index;
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

                return `${hh}:${mm}:${ss} ${DD}.${MM}.${YYYY}`;
            }
        },
        created() {
            this.$store.dispatch('setUsers');
        }
    }
</script>

<style scoped>
.yellow {
    color: darkorange;
}

.red {
    color: crimson;
}
.confirm-block {
    display: block;
    position: fixed;
    z-index: 9999999;
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
