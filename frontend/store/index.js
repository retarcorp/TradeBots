import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () => new Vuex.Store({
    state: {
        isAuthorized: true
    },
    getters: {
        getAuthorizedStatus(state) {
            return state.isAuthorized
        }
    },
    mutations: {
        setAuthorized(state, payload) {
            state.isAuthorized = payload
        }
    },
    actions: {
        setAuthorizedStatus({commit}, payload) {
            commit("setAuthorized", payload);
        }
    }
})

export default store