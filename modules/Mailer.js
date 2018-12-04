const nodemailer = require('nodemailer');
const { mailer } = require('../config/config');

const Mailer = {
    init() {
        this.smtp = nodemailer.createTransport({
            service: mailer.service
            ,secure: true
            ,auth: {
                user: mailer.user,
                pass: mailer.pass
            }
        });

        return this;
    }

    ,send(options) {
        this.smtp.sendMail(options, (err, info) => {
            if (err) {
                console.log(err);
                return;
            }

            console.log("Email sent: " + info);
        });
    }
}

module.exports = Mailer;