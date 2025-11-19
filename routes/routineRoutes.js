// routes/routineRoutes.js

const express = require("express");
const router = express.Router();
const routineController = require("../controllers/routineController");

// LISTA GERAL
router.get("/", routineController.index);

// CRIAR
router.get("/novo", routineController.showCreateForm);
router.post("/novo", routineController.create);

// EDITAR
router.get("/:id/editar", routineController.showEditForm);
router.post("/:id/editar", routineController.update);

// EXCLUIR
router.post("/:id/excluir", routineController.destroy);

// DUPLICAR
router.post("/:id/duplicar", routineController.duplicate);

module.exports = router;
