const { server_url } = require('../config/config');
const url = server_url.url;
module.exports = Templates = {
    getUserActivationHtml(regKey) {
        return `
            <h1>Для авторизации аккаунта пройдите по ссылке ниже</h1>
            <a href="${url}/api/user/activate?key=${regKey}">${url}/api/user/activate?key=${regKey}</a>
        `
    },
    getUserActivationHtmlConfirm() {
        return `
            <h1>Авторизация пройдена успешно!</h1>
        `
    }
}