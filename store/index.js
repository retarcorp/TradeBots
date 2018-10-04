import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = () =>
	new Vuex.Store({
	state: {
		email: '',
		income: {},
		isСonfigurationProcess: false,
		isAuthorized: false,
		isAuthorizedAdmin: false,
		botsList: [],
		isActive: false,
		status: '',
		freeze: '',
		message: '',
		statisticsList: [],
		clientAnswer: false,
		pairs: {},
		minNotionals: {
		USDT: 10,
		BTC: 0.001,
		ETH: 0.01,
		BNB: 1
		},
		lotSize: {},
		binanceAPIStatus: false,
		binanceAPI: {},
		users: []
	},
	getters: {
		getUser(state, payload) {
			return (index) => {
				return index >= 0 ? state.users[index] : {};
			}
		},
		getUsers(state) {
			return state.users;
		},
		getEmail(state) {
			return state.email;	
		},
		getIncome(state) {
			return state.income;	
		},
		getSpinerStatus(state) {
			return state.isActive
		},
		getAdminAuthorizedStatus(state) {
			return state.isAuthorizedAdmin;
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
		},
		getMinNotional(state) {
			return symbol => {
				return state.minNotionals[symbol]
			}
		},
		getBinanceAPIStatus(state) {
			return state.binanceAPIStatus;
		},
		getBinanceAPI(state) {
			return state.binanceAPI;
		}
	},
	mutations: {
		setAuthorizedAdmin(state, payload) {
			state.isAuthorizedAdmin = payload;
		},
		setEmail(state, payload) {
			state.email = payload;
		},
		setСonfigurationProcess(state, payload) {
			state.isСonfigurationProcess = payload;
		},
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
			if(!state.isСonfigurationProcess) {
				state.botsList = payload;
			}
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
		setIncome(state, payload) {
			state.income = payload;
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
		setClientAnswer(state, payload) {
			state.clientAnswer = payload;
		},
		clearAnswer(state) {
			state.clientAnswer = '';
		},
		setSymbolsList(state, payload) {
			state.pairs = payload
		},
		setLotSizes(state, payload) {
			state.lotSizes = payload
		},
		setMinNotionals(state, payload) {
			state.minNotionals = payload
		},
		setBinanceAPIStatus(state, payload) {
			// if(Object(state.binanceAPI).keys().every(elem => state.binanceAPI[elem] === '')) {
			if(!state.binanceAPI.name) {
				state.binanceAPIStatus = false;
			} else {
				state.binanceAPIStatus = payload;
			}
		},
		setBinanceAPI(state, payload) {
			state.binanceAPI = payload;
		},
		deleteBinanceAPI(state) {
			state.binanceAPI = {};
		},
		setUsers(state, payload) {
			payload = payload.filter(elem => !elem.admin);
			state.users = payload;
		},
		deleteUser(state, payload) {
			state.users.splice(payload, 1);
		},
		editUser(state, payload) {
			// state.users.
		}
	},
	actions: {
		editUser({ commit, getters }, payload){
			let user =  getters.getUser(payload);

			this.$axios
				.$post('/api/admin/changeUserData', user)
				.then( res => {
					console.log(res);
					// if(res.status === 'ok') 
					// commit('editUser', res.data);
					commit('setStatus', res.status);
					commit('setMessage', res.message);
				})
		},
		deleteUser({ commit, getters }, payload) {
			let user = getters.getUser(payload);
			this.$axios
				.$post('/api/admin/deleteUser', user)
				.then(res => {
					if(res.status === 'ok') commit('deleteUser', payload);
					commit('setStatus', res.status);
					commit('setMessage', res.message);
				})
		},
		setUsers({ commit }, payload) {
			this.$axios
				.$get('/api/admin/getUsersList')
				.then(res => {
					if(res.status === 'ok') {
						commit('setUsers', res.data.usersList);
					}
					else {
						console.log(res)
					}
				})
				.catch(e => console.log(e));
		},
		adminSignout({ commit, dispatch }, payload) {
			this.$axios.$get('/api/admin/signout')
				.then(res => {
					if(res.status === 'ok') {
						this.$router.push('/admin/signin');
						commit('setSpiner', false);
						dispatch('setAuthorizedAdmin', false);
					} else {
						// alert(res.message)
						commit('setSpiner', false);
					}
				})
				.catch(e => console.log(e))
		},
		adminSignin({ commit }, payload) {
			this.$axios
				.$post('/api/admin/signin', payload)
				.then(res => {
					if(res.status === 'ok') {
						this.$router.push('/admin')
					} else {
						commit('setStatus', res.status);
						commit('setMessage', res.message);
						console.log(res.message);
					}
				})
				.catch(e => console.log(e))
		},
		setNewPassword({ commit }, payload) {
			this.$axios
				.post('/api/account/setNewPassword', payload)
				.then(res => {
					commit('setStatus', res.data.status);
					commit('setMessage', res.data.message);
				})
				.catch(e => consoe.log(e));
		},
		setEmail({ commit }, payload) {
			this.$axios
				.get('/api/account/getEmail')
				.then(res => {
					if(res.data.status === 'ok') {
						commit('setEmail', res.data.data.email);
					}
				})
				.catch(e => console.log(e));
		},
		deleteBinanceAPI({ commit }, payload) {
			this.$axios
				.$delete('/account/api')
				.then(res => {
					if(res.status === 'ok') {
						commit('deleteBinanceAPI');
						commit('setBinanceAPIStatus', false);
					}
				})
				.catch(e => console.log(e))
		},
		firstGetBinanceAPI({ commit, getters }, payload) {
			this.$axios
				.$get('/account/api')
				.then(res => {
					if(res.status === 'ok') {
						commit('setBinanceAPI', res.data);
						commit('setBinanceAPIStatus', true);
						if(!getters.getBinanceAPIStatus) {
							commit('setStatus', 'info');
							commit('setMessage', 'Бинанс ключи не заданы!');
						}
					} else {
						console.log(e);
					}
				})
				.catch(e => console.log(e))
		},
		setBinanceAPI({ commit }, payload) {
			this.$axios
				.$post('/account/api', payload)
				.then(res => {
					if(res.status === 'ok') {
						commit('setBinanceAPIStatus', true);
						commit('setSpiner', false);
					} else {
						commit('setBinanceAPIStatus', false);
						commit('setSpiner', false)
					}
				})
				.catch(e => {
					commit('setSpiner', false)
				})
		},
		getMinNotionals({ commit }, payload) {
			this.$axios
			.$get(`/api/symbol/getMinNotionals`)
			.then(res => {
				if(res.status === 'ok') {
				commit('setMinNotionals', res.minNotionals)
				}
			})
			.catch(err => {
				console.log(err)
			})
		},
		getLotSizes({ commit }, payload) {
			this.$axios
				.$get(`/api/symbol/getLotSizes`)
				.then(res => {
				if(res.status === 'ok') {
					commit('setLotSizes', res.lotSizes)
				}
				})
				.catch(err => {
				console.log(err)
				})
		},
		getSymbolsList({ commit }) {
			commit('setSpiner', true)
			this.$axios
				.$get('/api/symbol/list')
				.then(res => {
				if(res.status === 'ok') {
					commit('setSymbolsList', res.data)
				}
				else console.error(res)
				})
				.catch(err => {
				console.error(err)
				})
		},
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
						// if(res.data.find(bot => bot.status === true)) {
						// console.log('im here')
						setTimeout(() => {
							dispatch('setBotsList')
						}, 5000);
						// }
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
