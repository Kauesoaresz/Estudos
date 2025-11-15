// routes/diaRoutes.js
//
// Rotas do módulo DIA (home, registro diário, histórico, detalhes, edição, exclusão)

const express = require("express");
const router = express.Router();

const diaController = require("../controllers/diaController");

// ---------------------
// HOME / DASHBOARD
// ---------------------
router.get("/", diaController.home);

// ---------------------
// REGISTRO DIÁRIO
// ---------------------
router.get("/dia/novo", diaController.novoDiaForm);
router.post("/dia", diaController.criarDia);

// ---------------------
// HISTÓRICO DE DIAS
// ---------------------
router.get("/dias", diaController.listarDias);

// ---------------------
// DETALHE, EDIÇÃO E EXCLUSÃO
// ---------------------
router.get("/dias/:id", diaController.detalhesDia);
router.get("/dias/:id/editar", diaController.editarDiaForm);
router.post("/dias/:id/atualizar", diaController.atualizarDia);
router.post("/dias/:id/excluir", diaController.excluirDia);

module.exports = router;
