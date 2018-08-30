module.exports = {
  mode: "spa",
  /*
  ** Headers of the page
  */
  head: {
    title: "tradebots",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "tradebots project" }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: "#3B8070" },

  /* 
  ** Global css files
  */
  css: [
    "~/assets/css/main.css"
  ],

  /* Plugins */
  plugins: [
    { ssr: false, src: '~plugins/wsSetup' },
    // { ssr: false, src: '~plugins/routerCheck' }
  ],

  /*
  ** Modules 
  */

  modules: [
    ["@nuxtjs/axios"]
  ],
  axios: {
    baseURL: "/",
    credentials: true,
    withCredentials: true
  },
  router: {
    middleware: 'checkWsStatus'
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** Run ESLint on save
    */
    extend(config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: "pre",
          test: /\.(js|vue)$/,
          loader: "eslint-loader",
          exclude: /(node_modules)/
        });
      }
    }
  },

  transition: {
    name: "page",
    mode: "out-in"
  }

  // ,serverMiddleware: [
  //   {
  //     path: '/*',
  //     handler: '~index.js',
  //   }
  // ]
};

