process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request');

function ping() {
    request({
        method: 'GET',
        url: 'https://35.242.244.82/api/ping',
        withCredentials: true,
        cert: false
    }, (error, body, response) => {
        if (error) {
            console.error(error);
        }

        console.log(body);
    });
}

module.exports = () => {
    return setInterval(ping, 10000);
}