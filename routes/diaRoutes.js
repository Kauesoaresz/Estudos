// routes/diaRoutes.js

const express = require("express");
const router = express.Router();

const diaController = require("../controllers/diaController");

// ---------------------
// HOME / DASHBOARD
// /dias/
// ---------------------
router.get("/", diaController.home);

// ---------------------
// REGISTRO DE NOVO DIA
// /dias/novo
// ---------------------
router.get("/novo", diaController.novoDiaForm);
router.post("/", diaController.criarDia);

// ---------------------
// HISTÓRICO DE DIAS
// /dias/historico
// ---------------------
router.get("/historico", diaController.listarDias);

// ---------------------
// DETALHE / EDIÇÃO / EXCLUSÃO
// /dias/:id
// ---------------------
router.get("/:id", diaController.detalhesDia);
router.get("/:id/editar", diaController.editarDiaForm);
router.post("/:id/atualizar", diaController.atualizarDia);
router.post("/:id/excluir", diaController.excluirDia);

// ---------------------
// RECORDES
// /dias/recordes
// ---------------------
router.get("/recordes/pessoais", diaController.recordesPessoais);

// ---------------------
// CALENDÁRIO
// /dias/calendario
// ---------------------
router.get("/calendario/:ano?/:mes?", diaController.calendarioEstudos);

module.exports = router;
