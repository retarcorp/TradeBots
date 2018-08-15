import Store from '~/store'
const store = Store();

window.onNuxtReady(() => {
    store.commit("wsInit")
})

