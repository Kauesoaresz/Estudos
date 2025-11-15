// routes/simuladoRoutes.js
//
// Rotas do módulo SIMULADOS

const express = require("express");
const router = express.Router();

const simuladoController = require("../controllers/simuladoController");

// ---------------------
// FORM: NOVO SIMULADO
// ---------------------
// GET /simulados/novo
router.get("/novo", simuladoController.novoSimuladoForm);

// ---------------------
// CRIAR SIMULADO
// ---------------------
// POST /simulados
router.post("/", simuladoController.criarSimulado);

// ---------------------
// LISTAR SIMULADOS
// ---------------------
// GET /simulados
router.get("/", simuladoController.listarSimulados);

// ---------------------
// DETALHE SIMULADO
// ---------------------
// GET /simulados/:id
router.get("/:id", simuladoController.detalheSimulado);

// ---------------------
// EDITAR SIMULADO
// ---------------------
// GET /simulados/:id/editar
router.get("/:id/editar", simuladoController.editarSimuladoForm);

// POST /simulados/:id/atualizar
router.post("/:id/atualizar", simuladoController.atualizarSimulado);

// ---------------------
// EXCLUIR SIMULADO
// ---------------------
// POST /simulados/:id/excluir
router.post("/:id/excluir", simuladoController.excluirSimulado);

module.exports = router;
