<template>
        <tbody>
            <tr  class="table__tr">
                <td class="table__th"><p> {{user.userId}}</p></td>
                <td class="table__th"><p>{{ user.name }}</p></td>
                <td class="table__th"><p> {{getDate(user.regDate) }}</p></td>
                <td class="table__th"><p> {{getDate(user.expirationDate) }}</p></td>
                <td class="table__th red">
                    <button v-show="!isEdit" @click.prevent="activateEditor">Просмотр</button>
                </td>
            </tr>
            <userRedactWindow
            :open="isEdit"
            :userIndex="userIndex"
            :user="user"
            @changeStatus='changeStatus'
            @deleteUser='deleteUser'
            ></userRedactWindow>
        </tbody>
        
</template>

<script>
    import userRedactWindow from '~/components/UserTableRow_2';
    export default {
        props: ['user', "userIndex"],
        components: {
            userRedactWindow
        },
        computed: {
            users() {
                return this.$store.getters.getUsers;
            }
        },
        data() {
            return {
                isEdit: false,
                disabled: true,
            }
        },
        created() {
            console.log(this.user);
        },
        methods: {
            changeStatus() {
                this.isEdit = false;
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
            },
            activateEditor() {
                this.isEdit = true;
                this.disabled = false;
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
                if(userIndex >= 0) {
                    this.tmpUserIndex = userIndex;
                    this.$emit('getUserIndex', userIndex);
                    this.$store.commit('setStatus', 'deleteUser');
                    // if(this.clientAnswer === 'acceptDeleteUser') {
                    //     this.$store.dispatch('deleteUser', userIndex);
                    //     this.tmpUserIndex = null;
                    // }
                }
            },
            signInAsUser(name){
                this.$axios
                    .$post('/api/admin/signinAsUser', {name: name});
            }
        },
        created() {
            // this.$store.dispatch('setUsers');
        }
        
    }
</script>
<style scope>
.editable__input{
    border: 1px solid transparent;
    background-color: #fff;
    font-size: 1.6rem;
}
.editable__input.active{
    border: 1px solid #000;
}
.table__th{
    font-size: 1.6rem;
    font-weight: bold;
}
.table__th input{
    padding: 2px 1px;
    font-weight: bold;
}
.table__th button:not(:last-child){
    width: 100px;
    margin-right: 10px;

}
.table__th button{
    cursor: pointer;
    border: none;
    background-color: #fff;
    font-size: 1.6rem;
    font-weight: bold;
    outline: none;
}

</style>