// routes/revisaoRoutes.js
//
// Rotas do módulo de REVISÃO

const express = require("express");
const router = express.Router();

const revisaoController = require("../controllers/revisaoController");

// Dashboard geral de revisão
// GET /revisao
router.get("/", revisaoController.dashboardRevisao);

// Tela detalhada de revisão por matéria
// GET /revisao/materia/:id
router.get("/materia/:id", revisaoController.detalheMateriaRevisao);

// Registrar uma sessão de revisão
// POST /revisao/registrar
router.post("/registrar", revisaoController.registrarRevisao);

module.exports = router;
