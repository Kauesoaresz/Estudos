const express = require("express");
const router = express.Router();
const AnotacaoController = require("../controllers/AnotacaoController");

// LISTAR
router.get("/", AnotacaoController.listar);

// ADICIONAR
router.get("/nova", AnotacaoController.formAdicionar);
router.post("/nova", AnotacaoController.salvar);

// EDITAR
router.get("/editar/:id", AnotacaoController.formEditar);
router.post("/editar/:id", AnotacaoController.atualizar);

// EXCLUIR
router.get("/excluir/:id", AnotacaoController.excluir);

module.exports = router;
