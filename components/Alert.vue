<template>
    <div class='alertInfo'>
        <div v-if="getStatus === 'ok'" class='alertInfo__text alertInfo__text--success'>
            <p>Выполнено успешно!</p>
        </div>
        <div v-else-if="getStatus === 'error'" class='alertInfo__text alertInfo__text--error'>
            <p>{{getMessage||'system error'}} </p>
            <span class="close" @click='closeApp'>&times;</span>
        </div>
        <div v-else-if="getStatus === 'info'" class='alertInfo__text alertInfo__text--primary'>
            <p>Информация получена.</p>
        </div>
    </div> 
</template>

<script>
    export default {
        computed: {
            getMessage() {
                return this.$store.getters.getMessage;
            },
            getStatus() {
                return this.$store.getters.getStatus;
            },
        },
        methods: {
            closeApp() {
                this.$store.commit('clearStatus');
            }
        }
    }
</script>

<style scoped>

.alertInfo {
    position: fixed; 
    z-index: 999;
    margin-top: 52.6px; 
    left: 50%;
    top: 0;
    width: 100%;
    transform: translateX(-50%);
    max-width: 1140px;
    overflow: auto;
    font-family: inherit;
}

.alertInfo__text{
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 2.4rem;
    padding: 1rem;
    color: #fff;
}

.alertInfo__text--error {
    background-color: #ff5252;
}

.alertInfo__text--success {
    background-color: #4caf50
}

.alertInfo__text--primary {
    background-color: #2196f3;
}

.close {
    color: #fff;
    font-size: 2.8rem;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: #000;
    text-decoration: none;
    cursor: pointer;
}

</style>

