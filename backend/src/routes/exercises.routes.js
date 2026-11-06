const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { suggestions } = require("../controllers/exerciseController");

const router = Router();
router.use(requireAuth);

router.get("/suggestions", suggestions);

module.exports = router;
