import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () =>
  new Vuex.Store({
    state: {
      isAuthorized: true,
      botsList: [],
      isActive: false
    },
    getters: {
      getSpinerStatus(state) {
        return state.isActive
      },
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
      setSpiner(state, payload) {
        state.isActive = payload
      },
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
      updateBot(state, payload) {
        const index = state.botsList.findIndex(bot => bot.botID === payload.botID);
        state.botsList[index] = payload
      }
    },
    actions: {
      setAuthorizedStatus({ commit }, payload) {
        commit("setAuthorized", payload);
      },
      addBot({ commit }, payload) {
        commit('setSpiner', true);
        this.$axios
          .$post("/bots/add", payload)
          .then(res => {
            if (res.status === "ok") {
              commit("addBot", res.data);
              this.$router.push("/bots");
              commit('setSpiner', false);
              
            } else {
              console.log(res.message);
              commit('setSpiner', false);
            }
          })
          .catch(e => console.log(e));
      },
      addNewBot({ commit }, payload) {
        commit("addNewBot", payload);
      },
      setBotsList({ commit }) {
        commit('setSpiner', true);
        this.$axios
          .$get("/bots/getBotsList")
          .then(res => {
            if (res.status === "ok") {
              commit("setBotsList", res.data);
              commit('setSpiner', false);
            } else {
              console.log(res.message);
              commit('setSpiner', false);
            }
          })
          .catch(e => console.log(e));
      },
      deleteBot({ commit }, payload) {
        commit('setSpiner', true);
        this.$axios
          .$post("/bots/delete", {
            botID: payload
          })
          .then(res => {
            if (res.status === "ok") {
              commit("deleteBot", res.data.botID);
              this.$router.push('/bots')
              commit('setSpiner', false);
            } else {
              console.log(res.message);
              commit('setSpiner', false);
            }
          })
          .catch(e => console.log(e));
      },
      updateBot({ commit }, payload) {
        commit('setSpiner', true);
        this.$axios
          .$post("/bots/update", payload)
          .then(res => {
            if (res.status === "ok") {
              commit("updateBot", res.data);
              commit('setSpiner', false);
            } else {
              console.log(e);
              commit('setSpiner', false);
            }
          })
          .catch(e => console.log(e));
      }
    }
  });

export default store