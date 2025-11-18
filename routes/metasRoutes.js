const express = require("express");
const router = express.Router();

const metasController = require("../controllers/metasController");

// /metas
router.get("/", metasController.painelMetas);

module.exports = router;
