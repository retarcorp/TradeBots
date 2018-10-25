export default function ({ store, route, redirect }) {
	if(route.path === '/admin/api/signin' && ~document.cookie.indexOf('admin')) {
		redirect('/admin')
	}
	if(route.path === '/') {
		redirect('/Bots')
	}
	if(route.path === '/SignIn' || route.path === '/Registration' || route.path.toLowerCase() === '/admin/api/signin') {
	} else {
	if (route.path.toLowerCase() === '/admin' || route.path.toLowerCase() === '/admin/' || 
		route.path.toLowerCase() === '/admin/rates' || route.path.toLowerCase() === '/admin/rates/' || 
		route.path.toLowerCase() === '/admin/wallet/' || route.path.toLowerCase() === '/admin/wallet' || 
		route.path.toLowerCase() === '/admin/pages/' || route.path.toLowerCase() === '/admin/pages'
	) {
		if(!((document.cookie.indexOf('admin') >= 0) && document.cookie.indexOf('true') && (document.cookie.indexOf('admin') < document.cookie.indexOf('true')))) {
			store.commit('setAuthorizedAdmin', false);
			redirect('/admin/api/signin');
		} else {
			store.commit('setAuthorizedAdmin', true);
		}
	}
	else {
		if(!(~document.cookie.indexOf('user'))) {
			store.commit('setAuthorized', false)
			redirect('/SignIn')
		} else {
			store.commit("setAuthorized", true);
		}
	}
	}
	if( route.path === `/Bots/${route.params.id}` && store.state.botsList.length === 0 ) {
		redirect('/Bots');
	}
}