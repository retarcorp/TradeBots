import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () =>
  new Vuex.Store({
    state: {
      isAuthorized: true,
      botsList: [
        {
          title: "!@#",
          state: "1",
          status: 0,
          pair: {
            from: "ETH",
            to: "BNB"
          },
          orders: [
            {
              pair: {
                from: "BTC",
                to: "ETH"
              },
              state: 0,
              amount: 0,
              price: 0,
              total: 0,
              dateInfo: {
                created: 1534157336853,
                closed: null
              },
              data: "new order is created"
            }
          ],
          currentOrder: {},
          botSettings: {
            traidingSignals: [],
            initialOrder: "123",
            safeOrder: {
              size: "123",
              amount: "123"
            },
            deviation: 1.23,
            martingale: {
              value: 1.01,
              active: "0"
            },
            maxOpenSafetyOrders: "",
            takeProffit: 1.23,
            stopLoss: 1.23,
            dailyVolumeBTC: null
          },
          botID: "1534154312886",
          volumeLimit: [
            {
              NAME: "ETH",
              VALUE: 0.01
            },
            {
              NAME: "BNB",
              VALUE: 1
            }
          ]
        }
      ]
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
        // this.$axios
        //   .$get("/bots/getBotsList")
        //   .then(res => {
        //     if (res.status === "ok") {
        //       commit("setBotsList", res.data);
        //     } else {
        //       console.log(res.message);
        //     }
        //   })
        //   .catch(e => console.log(e));
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