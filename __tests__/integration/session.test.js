const request = require("supertest");
const nodemailer = require("nodemailer");

const truncate = require("../utils/truncate");

const app = require("../../src/app");
const factory = require("../factories");

jest.mock("nodemailer");

//objeto para monitorar a chamada da função do nodemailer mockado
const transport = {
  sendMail: jest.fn()
};

describe("Authentication", () => {
  beforeEach(async () => {
    await truncate();
  });

  beforeAll(() => {
    //seta o valor que devera ser substituido quando for chamado
    nodemailer.createTransport.mockReturnValue(transport);
  });

  it("should be able to authenticate with valid credentials", async () => {
    const user = await factory.create("User", {
      password: "123123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: user.email,
        password: "123123"
      });

    expect(response.status).toBe(200);
  });

  it("should not be able to authenticate with invalid credentials", async () => {
    const user = await factory.create("User", {
      password: "123123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: user.email,
        password: "0000"
      });

    expect(response.status).toBe(401);
  });

  it("should return jwt token when authenticated", async () => {
    const user = await factory.create("User", {
      password: "123123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: user.email,
        password: "123123"
      });

    expect(response.body).toHaveProperty("token");
  });

  it("should be able to access private routes when authenticated", async () => {
    const user = await factory.create("User");

    const response = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${user.generateToken()}`);

    expect(response.status).toBe(200);
  });

  it("should not be able to access private routes when not authenticated", async () => {
    const response = await request(app).get("/dashboard");

    expect(response.status).toBe(401);
  });

  it("should not be able to access private routes when invalid token", async () => {
    const response = await request(app)
      .get("/dashboard")
      .set("Authorization", "Bearer 123");

    expect(response.status).toBe(401);
  });

  it("should receive email notification when authenticated", async () => {
    const user = await factory.create("User");

    await request(app)
      .post("/sessions")
      .send({
        email: user.email,
        password: user.password
      });

    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    //acessa as propriedades que foram chamadas dentro do mock
    /** Exemplo de estrutura
     *  [ [ { from: 'Rafael <rafael@mail.com>',
            to: 'Lorine Dickens <Erna.Johns50@hotmail.com>',
            subject: 'Novo acesso em sua conta',
            text: 'Recebemos um novo acesso em sua conta!' } ] ]
     */
    expect(transport.sendMail.mock.calls[0][0].to).toBe(
      `${user.name} <${user.email}>`
    );
  });
});
