module.exports = Templates = {
    getUserActivationHtml(regKey) {
        return `
            <h1>Для авторизации аккаунта пройдите по ссылке ниже</h1>
            <a href="https://35.242.244.82/api/user/activate?key=${regKey}">https://35.242.244.82/api/user/activate?key=${regKey}</a>
        `
    },
    getUserActivationHtmlConfirm() {
        return `
            <h1>Авторизация пройдена успешно!</h1>
        `
    }
}