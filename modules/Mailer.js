const nodemailer = require('nodemailer');

const Mailer = {
    init() {
        this.smtp = nodemailer.createTransport({
            service: 'gmail.com'
            ,secure: true
            ,auth: {
                user: 'trade.bots.info@gmail.com',
                pass: '?bXRk#TqZN7#k%1'
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