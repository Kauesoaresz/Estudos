// routes/metasRoutes.js

const express = require("express");
const router = express.Router();

const metasController = require("../controllers/metasController");

// GET /metas?ano=2026
router.get("/metas", metasController.painelMetas);

module.exports = router;
