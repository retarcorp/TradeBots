import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () =>
  new Vuex.Store({
    state: {
      isAuthorized: true,
      botsList: [],
      isLoading: true,
      status: 'ne_ok',
      message: ''
    },
    getters: {
      getAuthorizedStatus(state) {
        return state.isAuthorized;
      },
      getBotsList(state) {
        return state.botsList;
      },
      getBot(state) {
        return id => {
          return state.botsList.find(bot => bot.botID === id);
        };
      },
      getMessage(state) {
        return state.message;
      },
      getValueOfLoading(state) {
        return state.isLoading;
      },
      getStatus(state) {
        return state.status;
      }
    },
    mutations: {
      setAuthorized(state, payload) {
        state.isAuthorized = payload;
      },
      addBot(state, payload) {
        state.botsList.push(payload);
      },
      addNewBot(state, payload) {
        state.botsList.push(payload);
      },
      setBotsList(state, payload) {
        state.botsList = payload;
      },
      deleteBot(state, payload) {
        state.botsList = state.botsList.filter(bot => bot.botID !== payload);
      },
      getMessage(state, payload) {
        state.message = payload;
      },
      getValueOfLoading(state, payload) {               //for spinner
        state.isLoading = payload;
      },
      setStatus(state, payload) {
        state.status = payload;
        if( payload === 'ok' || payload === 'info') {
          setTimeout(function() { 
            state.status = '';
          }, 2000);
        }
      },
      clearMessage(state) {
        state.message = '';
      },
      clearStatus(state) {
        state.status = '';
      }
    },
    actions: {
      clearStatus({commit}) {
        commit('clearStatus');
      },
      setAuthorizedStatus({ commit }, payload) {
        commit("setAuthorized", payload);
      },
      addBot({ commit }, payload) {
        this.$axios
          .$post("/bots/add", payload)
          .then(res => {
            if (res.status === "ok") {
              commit("addBot", res.data);
            } else {
              console.log(res.message);
            }
          })
          .catch(e => console.log(e));
      },
      addNewBot({ commit }, payload) {
        commit("addNewBot", payload);
      },
      setBotsList({ commit }) {
        this.$axios
          .$get("/bots/getBotsList")
          .then(res => {
            if (res.status === "ok") {
              commit("setBotsList", res.data);
            } else {
              console.log(res.message);
            }
          })
          .catch(e => console.log(e));
      },
      deleteBot({ commit }, payload) {
        this.$axios
          .$delete("/bots/delete", {
            'botID': payload
          })
          .then(res => {
            if (res.status === "ok") {
              commit("deleteBot", res.data.botID);
            } else {
              console.log(res.message);
            }
          })
          .catch(e => console.log(e));
      }
    }
  });

export default store