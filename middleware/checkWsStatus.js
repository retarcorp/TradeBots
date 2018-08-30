export default function ({ store, route, redirect }) {
  if(route.path === '/') {
    redirect('/Boty')
  }
  if(route.path === '/Vhod' || route.path === '/Registratsia') {
    console.log('here');
  } else {
    if(!(~document.cookie.indexOf('user'))) {
      store.commit('setAuthorized', false)
      redirect('/Vhod')
    } else {
      store.commit("setAuthorized", true);
    }
  }
  if( route.path === `/Boty/${route.params.id}` && store.state.botsList.length === 0 ) {
    redirect('/Boty');
  }
}