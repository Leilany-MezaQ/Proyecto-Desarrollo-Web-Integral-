const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const testUser = {
  name: "Usuario de Prueba",
  email: `test-${Date.now()}@hypertrack.com`,
  password: "clave12345",
};

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("Autenticación", () => {
  it("registra un usuario nuevo y devuelve un token", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("rechaza el registro duplicado con el mismo correo", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).toBe(409);
  });

  it("inicia sesión con credenciales correctas", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("rechaza login con contraseña incorrecta", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "incorrecta",
    });
    expect(res.status).toBe(401);
  });

  it("rechaza registro con correo inválido", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "X",
      email: "no-es-un-correo",
      password: "clave12345",
    });
    expect(res.status).toBe(400);
  });
});
