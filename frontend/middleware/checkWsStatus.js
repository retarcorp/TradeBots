export default function ({ store, route, redirect }) {
  if(route.path === '/signin' || route.path === '/signup') {
    console.log('here');
  } else {
    if(!(~document.cookie.indexOf('user'))) {
      store.commit('setAuthorized', false)
      redirect('/signin')
    } else {
      store.commit("setAuthorized", true);
    }
  }
}