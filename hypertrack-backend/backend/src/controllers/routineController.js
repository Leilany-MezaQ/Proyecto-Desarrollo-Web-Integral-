const { validationResult } = require("express-validator");
const prisma = require("../lib/prisma");

async function listActive(req, res, next) {
  try {
    const entries = await prisma.routineEntry.findMany({
      where: { userId: req.userId, archived: false },
      orderBy: { createdAt: "asc" },
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

async function listArchived(req, res, next) {
  try {
    const entries = await prisma.routineEntry.findMany({
      where: { userId: req.userId, archived: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(entries);
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
    const { day, muscle, name } = req.body;
    const entry = await prisma.routineEntry.create({
      data: { day, muscle, name, userId: req.userId },
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

function setArchived(archived) {
  return async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const entry = await prisma.routineEntry.updateMany({
        where: { id, userId: req.userId },
        data: { archived },
      });
      if (entry.count === 0) return res.status(404).json({ error: "Registro no encontrado." });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await prisma.routineEntry.deleteMany({
      where: { id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: "Registro no encontrado." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listActive,
  listArchived,
  create,
  archive: setArchived(true),
  restore: setArchived(false),
  remove,
};
