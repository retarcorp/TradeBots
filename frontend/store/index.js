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
      },
      getBot(state) {
        return id => {
          return state.botsList.find(bot => bot.botID === id);
        };
      }
    },
    mutations: {
      setAuthorized(state, payload) {
        state.isAuthorized = payload;
      },
      addBot(state, payload) {
        state.botsList.pop();
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
      updateBot(state, payload) {
        const index = state.botsList.findIndex(bot => bot.botID === payload.botID);
        state.botsList[index] = payload;
      }
    },
    actions: {
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
          .$post("/bots/delete", {
            'botID': payload
          })
          .then(res => {
            if (res.status === "ok") {
              commit("deleteBot", res.data.botID);
              this.$router.push('/bots');
            } else {
              console.log(res.message);
            }
          })
          .catch(e => console.log(e));
      },
      updateBot({commit}, payload) {
        this.$axios
          .$post('/bots/update', payload)
          .then(res => {
            if(res.status === 'ok') {
              commit('updateBot', res.data)
            } else {
              console.log(res.message)
            }
          })
          .catch(e => console.log(e))
      }
    }
  });

export default store