const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../models");
const { ensureAuth } = require("../middlewares/authMiddleware");

// CONFIG DO UPLOAD
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nome = "user_" + req.session.usuario.id + ext;
    cb(null, nome);
  }
});

const upload = multer({ storage });

// PERFIL – GET
router.get("/", ensureAuth, (req, res) => {
  res.render("perfil", {
    tituloPagina: "Meu Perfil",
    usuario: req.session.usuario
  });
});

// PERFIL – POST FOTO
router.post("/foto", ensureAuth, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect("/perfil");
    }

    // salva apenas o nome do arquivo
    const nomeArquivo = req.file.filename;

    // salva no banco asssim:
    await db.Usuario.update(
      { foto: nomeArquivo },
      { where: { id: req.session.usuario.id } }
    );

    // atualiza sessão
    req.session.usuario.foto = nomeArquivo;

    return res.redirect("/perfil");

  } catch (err) {
    console.error("Erro ao trocar foto:", err);
    return res.redirect("/perfil");
  }
});

module.exports = router;
