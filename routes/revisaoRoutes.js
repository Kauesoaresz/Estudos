const express = require("express");
const router = express.Router();

const {
  dashboardRevisao,
  detalheMateriaRevisao,
  registrarRevisao,
  carregarRevisaoParaEdicao,
  atualizarRevisao,
  excluirRevisao,
  getRevisaoAPI
} = require("../controllers/revisaoController");

// ==============================
// ROTAS FIXAS PRIMEIRO
// ==============================

// Dashboard
router.get("/", dashboardRevisao);

// Página da matéria
router.get("/materia/:id", detalheMateriaRevisao);

// API para popup de edição
router.get("/api/revisao/:id", getRevisaoAPI);

// Registrar nova revisão
router.post("/registrar", registrarRevisao);

// ==============================
// ROTAS DINÂMICAS DEPOIS
// ==============================

// Editar revisão
router.get("/:id/editar", carregarRevisaoParaEdicao);

// Atualizar revisão
router.post("/:id/atualizar", atualizarRevisao);

// Excluir revisão
router.post("/:id/excluir", excluirRevisao);

module.exports = router;
