// routes/estudoRoutes.js
//
// Rotas do módulo ESTUDOS POR MATÉRIA

const express = require("express");
const router = express.Router();

const estudoController = require("../controllers/estudoController");

// ---------------------
// FORM: NOVO ESTUDO
// ---------------------
// GET /estudos/novo
router.get("/novo", estudoController.novoEstudoForm);

// ---------------------
// CRIAR ESTUDO
// ---------------------
// POST /estudos
router.post("/", estudoController.criarEstudo);

// ---------------------
// LISTAR ESTUDOS
// ---------------------
// GET /estudos
router.get("/", estudoController.listarEstudos);

// ---------------------
// DETALHE DE UM ESTUDO
// ---------------------
// GET /estudos/:id
router.get("/:id", estudoController.detalheEstudo);

// ---------------------
// EDITAR ESTUDO
// ---------------------
// GET /estudos/:id/editar
router.get("/:id/editar", estudoController.editarEstudoForm);

// POST /estudos/:id/atualizar
router.post("/:id/atualizar", estudoController.atualizarEstudo);

// ---------------------
// EXCLUIR ESTUDO
// ---------------------
// POST /estudos/:id/excluir
router.post("/:id/excluir", estudoController.excluirEstudo);

module.exports = router;
