process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request');
const { server_url } = require('../../config/config');
const url = server_url.url;
console.log(url)

function ping() {
    request({
        method: 'GET',
        url: url + '/api/ping',
        withCredentials: true,
        cert: false
    }, (error, request, body) => {
        if (error) {
            console.error(error);
        }

        console.log(body);
    });
}

module.exports = () => {
    return setInterval(ping, 10000);
}