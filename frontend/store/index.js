import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () =>
  new Vuex.Store({
    state: {
      isAuthorized: true,
      botsList: []
    },
    getters: {
      getAuthorizedStatus(state) {
        return state.isAuthorized;
      },
      getBotsList(state) {
        return state.botsList;
      }
    },
    mutations: {
      setAuthorized(state, payload) {
        state.isAuthorized = payload;
      },
      addBot(state, payload) {
        state.botsList.push(payload);
      },
      setBotsList(state, payload) {
        state.botsList = payload
      }
    },
    actions: {
      setAuthorizedStatus({ commit }, payload) {
        commit("setAuthorized", payload);
      },
      addBot({ commit }, payload) {
        this.$axios.$post('/bots/add', payload)
          .then(res => {
            if(res.status === 'ok') {
              commit("addBot", res.data);
            } else {
              console.log(res.message)
            }
          })
          .catch(e => console.log(e))
      },
      setBotsList({commit}, payload) {
        commit('setBotsList', payload)
      }
    }
  });

export default store