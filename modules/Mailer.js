const nodemailer = require('nodemailer');

const Mailer = {
    init() {
        this.smtp = nodemailer.createTransport({
            service: 'mail.ru'
            ,secure: true
            ,auth: {
                user: 'potato_1234@mail.ru',
                pass: '123456q'
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