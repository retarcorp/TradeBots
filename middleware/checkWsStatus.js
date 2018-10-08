export default function ({ store, route, redirect }) {
  console.log(route.path)
  if(route.path === '/') {
    redirect('/Boty')
  }
  if(route.path === '/Vhod' || route.path === '/Registratsia' || route.path.toLowerCase() === '/admin/signin') {
    console.log('here');
  } else {
    if (route.path.toLowerCase() === '/admin' || route.path.toLowerCase() === '/admin/rates') {
      if(!((document.cookie.indexOf('admin') >= 0) && document.cookie.indexOf('true') && (document.cookie.indexOf('admin') < document.cookie.indexOf('true')))) {
        store.commit('setAuthorizedAdmin', false);
        redirect('/admin/signin');
      } else {
        store.commit('setAuthorizedAdmin', true);
      }
    }
    else {
      if(!(~document.cookie.indexOf('user'))) {
        store.commit('setAuthorized', false)
        redirect('/Vhod')
      } else {
        store.commit("setAuthorized", true);
      }
    }
  }
  if( route.path === `/Boty/${route.params.id}` && store.state.botsList.length === 0 ) {
    redirect('/Boty');
  }
}