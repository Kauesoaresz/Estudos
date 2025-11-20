// routes/routineRoutes.js

const express = require("express");
const router = express.Router();
const routineController = require("../controllers/routineController");

// LISTA GERAL (Página principal da rotina)
router.get("/", routineController.index);

// CRIAR
router.get("/novo", routineController.showCreateForm);
router.post("/novo", routineController.create);

// EDITAR
router.get("/:id/editar", routineController.showEditForm);
router.post("/:id/editar", routineController.update);

// EXCLUIR
router.post("/:id/excluir", routineController.destroy);

// DUPLICAR (modo antigo — 1 dia por vez)
router.post("/:id/duplicar", routineController.duplicate);

// DUPLICAR MÚLTIPLOS (NOVO — vários dias ao mesmo tempo)
router.post("/:id/duplicar-multiplos", routineController.duplicateMultiple);

module.exports = router;
