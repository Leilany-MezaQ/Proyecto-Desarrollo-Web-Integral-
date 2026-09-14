const { validationResult } = require("express-validator");
const prisma = require("../lib/prisma");

async function list(req, res, next) {
  try {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: req.userId },
      include: { sets: true },
      orderBy: { date: "desc" },
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Datos inválidos.", details: errors.array() });
  }

  try {
    const { date, sets } = req.body;

    const session = await prisma.workoutSession.create({
      data: {
        date: new Date(date),
        userId: req.userId,
        sets: {
          create: sets.map((s, i) => ({
            exerciseName: s.exerciseName,
            muscle: s.muscle,
            weight: Number(s.weight),
            reps: Number(s.reps),
            setNumber: s.setNumber ?? i + 1,
          })),
        },
      },
      include: { sets: true },
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

// Importación masiva (usada por Ajustes > Importar Excel)
async function bulkCreate(req, res, next) {
  try {
    const { sessions } = req.body;
    if (!Array.isArray(sessions)) {
      return res.status(400).json({ error: "Se esperaba un arreglo de sesiones." });
    }

    const created = await prisma.$transaction(
      sessions.map((s) =>
        prisma.workoutSession.create({
          data: {
            date: new Date(s.date),
            userId: req.userId,
            sets: {
              create: (s.sets || []).map((set, i) => ({
                exerciseName: set.exerciseName,
                muscle: set.muscle,
                weight: Number(set.weight),
                reps: Number(set.reps),
                setNumber: set.setNumber ?? i + 1,
              })),
            },
          },
        })
      )
    );

    res.status(201).json({ imported: created.length });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await prisma.workoutSession.deleteMany({
      where: { id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: "Sesión no encontrada." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function removeAll(req, res, next) {
  try {
    await prisma.workoutSession.deleteMany({ where: { userId: req.userId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, bulkCreate, remove, removeAll };
