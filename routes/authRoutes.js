// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Cadastro
router.get("/cadastro", authController.mostrarCadastro);
router.post("/cadastro", authController.cadastrar);

// Login
router.get("/login", authController.mostrarLogin);
router.post("/login", authController.logar);

// Recuperar senha
router.get("/recuperar-senha", authController.mostrarRecuperarSenha);
router.post("/recuperar-senha", authController.recuperarSenha);

// Logout
router.get("/logout", authController.logout);

module.exports = router;
