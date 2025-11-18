const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../middlewares/authMiddleware");

router.get("/", ensureAuth, (req, res) => {
  return res.render("perfil", {
    tituloPagina: "Meu Perfil",
    usuario: req.session.usuario // <-- ENVIA O USUÁRIO PARA O EJS
  });
});

module.exports = router;
