const express = require("express");
const router = express.Router();
const medalhaController = require("../controllers/medalhaController");

router.get("/medalhas", medalhaController.listarMedalhas);
router.get("/medalhas/conquistadas", medalhaController.medalhasConquistadas);

module.exports = router;
