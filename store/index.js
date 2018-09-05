import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () =>
  new Vuex.Store({
    state: {
      isAuthorized: false,
      botsList: [],
      isActive: false,
      status: '',
      freeze: '',
      message: '',
      statisticsList: [],
      clientAnswer: false
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
      },
      getMessage(state) {
        return state.message;
      },
      getStatus(state) {
        return state.status;
      },
      getStatisticsList(state) {
        return state.statisticsList;
      },
      getClientAnswer(state) {
        return state.clientAnswer;
      }
    },
    mutations: {
      setBot(state, payload) {
        const index = state.botsList.findIndex(bot => bot.botID === payload.botID)
        state.botsList[index] = payload;
      },
      setSpiner(state, payload) {
        state.isActive = payload
      },
      setBotFreeze(state, payload) {
        state.freeze = payload
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
      },
      setMessage(state, payload) {
        state.message = payload;
      },
      setStatus(state, payload) {
        state.status = payload;
        if( payload === 'ok' || payload === 'info') {
          setTimeout(function() { 
            state.status = '';
          }, 1000);
        }
      },
      setStatisticsList(state, payload) {
        state.statisticsList = payload;
      },
      clearMessage(state) {
        state.message = '';
      },
      clearStatus(state) {
        state.status = '';
      },
      setClientAnswer(state) {
        state.clientAnswer = true;
      },
      clearAnswer(state) {
        state.clientAnswer = false;
      }
    },
    actions: {
      setAuthorizedStatus({ commit }, payload) {
        commit("setAuthorized", payload);
      },
      addBot({ commit, dispatch }, payload) {
        commit('setSpiner', true);
        this.$axios
          .$post("/bots/add", payload)
          .then(res => {
            if (res.status === "ok") {
              commit("addBot", res.data);
              this.$router.push("/Boty");
              commit('setStatus', 'ok');
              commit('setSpiner', false);
            } else {
              dispatch('lounchBadMutations');
            }
          })
          .catch(e => console.log(e));
      },
      addNewBot({ commit }, payload) {
        commit("addNewBot", payload);
      },
      setBotsList({ commit, dispatch }) {
        commit('setSpiner', true);
        this.$axios
          .$get("/bots/getBotsList")
          .then(res => {
            if (res.status === "ok") {
              commit("setBotsList", res.data);
              commit('setSpiner', false);
              if(res.data.find(bot => bot.status === '1')) {
                // console.log('im here')
                setTimeout(() => {
                  dispatch('setBotsList')
                }, 5000);
              }
            } else if(res.status === 'info') {
              commit('setMessage', res.message);
              commit('setStatus', 'info');
            } else {
              dispatch('lounchBadMutations');
            }
          })
          .catch(e => console.log(e));
      },
      deleteBot({ commit, dispatch }, payload) {
        commit('setSpiner', true);
        this.$axios
          .$post("/bots/delete", {
            botID: payload
          })
          .then(res => {
            if (res.status === "ok") {
              this.$router.push('/Boty')
              commit("deleteBot", res.data.botID);
              commit('setStatus', 'ok');
              commit('setSpiner', false);
            } else {
              dispatch('lounchBadMutations');
            }
          })
          .catch(e => console.log(e));
      },
      updateBot({ commit, dispatch }, payload) {
        commit('setSpiner', true);
        this.$axios
          .$post("/bots/update", payload)
          .then(res => {
            if (res.status === "ok") {
              dispatch('lounchGoodMutations', res.data);
            } else {
              dispatch('lounchBadMutations');
            }
          })
          .catch(e => console.log(e));
      },
      lounchGoodMutations({commit}, payload) {
        commit("updateBot", payload);
        commit('setStatus', 'ok');
        commit('setSpiner', false);
      },
      lounchBadMutations({commit}) {
        commit('setSpiner', false);
        commit('setStatus', 'error');
        commit('setMessage', res.message);
      }
    }
  });

export default store