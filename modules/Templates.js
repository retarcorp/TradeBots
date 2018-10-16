module.exports = Templates = {
    getUserActivationHtml(regKey) {
        return `
            <h1>That is your activation link below</h1>
            <a href="https://35.242.244.82/user/activate?key=${regKey}">https://35.242.244.82/user/activate?key=${regKey}</a>
        `
    }
}