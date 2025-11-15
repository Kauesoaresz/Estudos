// routes/estatisticasRoutes.js
//
// Rotas do módulo de ESTATÍSTICAS
// - Por matéria
// - De simulados
// - Dos dias

const express = require("express");
const router = express.Router();

const estatisticasController = require("../controllers/estatisticasController");

// -----------------------------
// ESTATÍSTICAS POR MATÉRIA
// -----------------------------
// GET /estatisticas/materias?periodo=7d|30d|todos
router.get(
  "/materias",
  estatisticasController.estatisticasMaterias
);

// -----------------------------
// ESTATÍSTICAS DE SIMULADOS
// -----------------------------
// GET /estatisticas/simulados?periodo=7d|30d|todos
router.get(
  "/simulados",
  estatisticasController.estatisticasSimulados
);

// -----------------------------
// ESTATÍSTICAS DOS DIAS
// -----------------------------
// GET /estatisticas/dias?periodo=7d|30d|todos
router.get(
  "/dias",
  estatisticasController.estatisticasDias
);

module.exports = router;
