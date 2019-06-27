const nodemailer = require("nodemailer");
const mailConfig = require("../../config/mail");

class MailService {
  async send(message) {
    const transport = nodemailer.createTransport(mailConfig);

    return transport.sendMail(message);
  }
}

module.exports = new MailService();
