const { Router } = require("express");
const { body } = require("express-validator");
const { register, login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
    body("email").isEmail().withMessage("Correo inválido."),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Correo inválido."),
    body("password").notEmpty().withMessage("La contraseña es obligatoria."),
  ],
  login
);

router.get("/me", requireAuth, me);

module.exports = router;
