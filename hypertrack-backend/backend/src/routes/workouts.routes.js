const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { list, create, bulkCreate, remove, removeAll } = require("../controllers/workoutController");

const router = Router();
router.use(requireAuth);

router.get("/", list);

router.post(
  "/",
  [
    body("date").isISO8601().withMessage("Fecha inválida."),
    body("sets").isArray({ min: 1 }).withMessage("Debe incluir al menos un set."),
  ],
  create
);

router.post("/bulk", bulkCreate);
router.delete("/all/clear", removeAll);
router.delete("/:id", remove);

module.exports = router;
