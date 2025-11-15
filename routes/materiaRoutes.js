// routes/materiaRoutes.js
//
// Rotas do módulo MATÉRIAS

const express = require("express");
const router = express.Router();

const materiaController = require("../controllers/materiaController");

// ---------------------
// LISTAR E CRIAR MATÉRIAS
// ---------------------

// Lista todas as matérias
// GET /materias
router.get("/", materiaController.listarMaterias);

// Cria nova matéria
// POST /materias
router.post("/", materiaController.criarMateria);

// ---------------------
// DETALHE DA MATÉRIA
// ---------------------

// Detalhes de uma matéria específica
// GET /materias/:id
router.get("/:id", materiaController.detalheMateria);

// ---------------------
// EDIÇÃO
// ---------------------

// Form de edição de matéria
// GET /materias/:id/editar
router.get("/:id/editar", materiaController.editarMateriaForm);

// Atualizar matéria
// POST /materias/:id/atualizar
router.post("/:id/atualizar", materiaController.atualizarMateria);

// ---------------------
// EXCLUSÃO
// ---------------------

// Excluir matéria
// POST /materias/:id/excluir
router.post("/:id/excluir", materiaController.excluirMateria);

module.exports = router;
