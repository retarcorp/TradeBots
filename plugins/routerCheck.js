export default ({ app }) => {

    app.router.beforeEach((to, from,  next) => {
        if((~document.cookie.indexOf('user'))) {
            app.store.commit("setAuthorized", true);
        }
       console.log(to);
       if(to.path === '/SignIn' || to.path === '/Registration') {
           console.log('here');
           next()
       } else {
            if(!(~document.cookie.indexOf('user'))) {
                next('/SignIn')
            } else {
                next()
            }
        }
       
    });

}