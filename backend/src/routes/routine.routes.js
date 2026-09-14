const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const {
  listActive,
  listArchived,
  create,
  archive,
  restore,
  remove,
} = require("../controllers/routineController");

const router = Router();
router.use(requireAuth);

router.get("/", listActive);
router.get("/archived", listArchived);

router.post(
  "/",
  [
    body("day").notEmpty().withMessage("El día es obligatorio."),
    body("muscle").notEmpty().withMessage("El músculo es obligatorio."),
    body("name").trim().notEmpty().withMessage("El nombre del ejercicio es obligatorio."),
  ],
  create
);

router.patch("/:id/archive", archive);
router.patch("/:id/restore", restore);
router.delete("/:id", remove);

module.exports = router;
