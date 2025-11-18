// routes/diaRoutes.js

const express = require("express");
const router = express.Router();

const diaController = require("../controllers/diaController");

// ---------------------
// CALENDÁRIO
// /dias/calendario
// ---------------------
router.get("/calendario/:ano?/:mes?", diaController.calendarioEstudos);

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
// HISTÓRICO
// ---------------------
router.get("/historico", diaController.listarDias);

// ---------------------
// DETALHES / EDITAR / EXCLUIR
// /dias/:id
// ---------------------
router.get("/:id", diaController.detalhesDia);
router.get("/:id/editar", diaController.editarDiaForm);
router.post("/:id/atualizar", diaController.atualizarDia);
router.post("/:id/excluir", diaController.excluirDia);


module.exports = router;
