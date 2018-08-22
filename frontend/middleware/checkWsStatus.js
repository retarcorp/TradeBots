export default function ({ store, route, redirect }) {
  if(route.path === '/signin' || route.path === '/signup') {
    console.log('here');
  } else {
    if(!(~document.cookie.indexOf('user'))) {
      redirect('/signin')
    } 
  }
  if( route.path === `/bots/${route.params.id}` && store.state.botsList.length === 0 ) {
    redirect('/bots');
  }
}