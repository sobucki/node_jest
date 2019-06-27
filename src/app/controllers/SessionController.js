const { User } = require("../models");

const Mail = require("../services/MailService");

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await Mail.send({
      from: "Rafael <rafael@mail.com>",
      to: `${user.name} <${user.email}>`,
      subject: "Novo acesso em sua conta",
      text: "Recebemos um novo acesso em sua conta!"
    });

    return res.json({
      token: await user.generateToken()
    });
  }
}

module.exports = new SessionController();
