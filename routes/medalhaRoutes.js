const express = require("express");
const router = express.Router();

const medalhaController = require("../controllers/medalhaController");

// /medalhas
router.get("/", medalhaController.listarMedalhas);

// /medalhas/conquistadas
router.get("/conquistadas", medalhaController.medalhasConquistadas);

module.exports = router;
