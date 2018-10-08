module.exports = Templates = {
    getUserActivationHtml(regKey) {
        return `
            <h1>That is your activation link below</h1>
            <a href="http://localhost:8072/user/activate?key=${regKey}">http://localhost:8072/user/activate?key=${regKey}</a>
        `
    }
}