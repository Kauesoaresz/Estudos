// routes/revisaoProgramadaRoutes.js

const express = require("express");
const router = express.Router();

const {
  listarRevisoesProgramadas,
  listarHistorico,
  marcarRevisaoFeita,
  adiarRevisao,
  ignorarRevisao,
  deletarRevisao
} = require("../controllers/revisaoProgramadaController");

// LISTA PRINCIPAL
router.get("/", listarRevisoesProgramadas);

// HISTÓRICO
router.get("/historico", listarHistorico);

// MARCAR COMO FEITA
router.post("/:id/fazer", marcarRevisaoFeita);

// ADIAR
router.post("/:id/adiar", adiarRevisao);

// IGNORAR
router.post("/:id/ignorar", ignorarRevisao);

// DELETAR (HISTÓRICO)
router.post("/:id/deletar", deletarRevisao);

module.exports = router;
