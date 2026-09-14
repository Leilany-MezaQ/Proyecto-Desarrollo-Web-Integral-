const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const testUser = {
  name: "Usuario Rutina",
  email: `routine-${Date.now()}@hypertrack.com`,
  password: "clave12345",
};

let token;

beforeAll(async () => {
  const res = await request(app).post("/api/auth/register").send(testUser);
  token = res.body.token;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("Rutina (requiere autenticación)", () => {
  it("rechaza la petición sin token", async () => {
    const res = await request(app).get("/api/routine");
    expect(res.status).toBe(401);
  });

  it("crea un ejercicio en la rutina", async () => {
    const res = await request(app)
      .post("/api/routine")
      .set("Authorization", `Bearer ${token}`)
      .send({ day: "Lunes", muscle: "Pecho", name: "Press de banca" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Press de banca");
  });

  it("lista los ejercicios activos de la rutina", async () => {
    const res = await request(app)
      .get("/api/routine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
