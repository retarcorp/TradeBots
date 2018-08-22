export default function ({ route, redirect }) {
  if(route.path === '/signin' || route.path === '/signup') {
    console.log('here');
  } else {
    if(!(~document.cookie.indexOf('user'))) {
      redirect('/signin')
    } 
  }
}