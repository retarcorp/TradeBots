export default function ({ store, route, redirect }) {
	if(route.path === '/api/admin/signin' && ~document.cookie.indexOf('admin')) {
		redirect('/admin')
	}
	if(route.path === '/') {
		redirect('/Bots')
	}
	if(route.path === '/SignIn' || route.path === '/Registration' || route.path.toLowerCase() === '/admin/signin') {
	} else {
		if (route.path.toLowerCase() === '/admin/' || route.path.toLowerCase() === '/admin' || 
			route.path.toLowerCase() === '/admin/rates/' || route.path.toLowerCase() === '/admin/rates' || 
			route.path.toLowerCase() === '/admin/wallet/' || route.path.toLowerCase() === '/admin/wallet' || 
			route.path.toLowerCase() === '/admin/pages/' || route.path.toLowerCase() === '/admin/pages' ||
			route.path.toLowerCase() === '/admin/loggerviewer/' || route.path.toLowerCase() === '/admin/loggerviewer' ||
			route.path.toLowerCase() === '/admin/paymentsinfo/' || route.path.toLowerCase() === '/admin/paymentsinfo' 
		) {
			if(!((document.cookie.indexOf('admin') >= 0) && document.cookie.indexOf('true') && (document.cookie.indexOf('admin') < document.cookie.indexOf('true')))) {
				store.commit('setAuthorizedAdmin', false);
				redirect('/Admin/Signin');
			} else {
				console.log(route.path)
				store.commit('setAuthorizedAdmin', true);
			}
		} else {
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