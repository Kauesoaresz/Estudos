// controllers/authController.js

const bcrypt = require("bcryptjs");
const { Usuario } = require("../models");

// GET /cadastro
async function mostrarCadastro(req, res) {
  if (req.session.usuario) {
    return res.redirect("/");
  }

  res.render("cadastro", {
    tituloPagina: "Criar conta",
    erro: null,
    valores: {
      nome: "",
      email: ""
    }
  });
}

// POST /cadastro
async function cadastrar(req, res) {
  try {
    const { nome, email, senha, confirmar_senha } = req.body;

    if (!nome || !email || !senha || !confirmar_senha) {
      return res.render("cadastro", {
        tituloPagina: "Criar conta",
        erro: "Preencha todos os campos.",
        valores: { nome, email }
      });
    }

    if (senha !== confirmar_senha) {
      return res.render("cadastro", {
        tituloPagina: "Criar conta",
        erro: "As senhas não conferem.",
        valores: { nome, email }
      });
    }

    const usuarioExiste = await Usuario.findOne({ where: { email } });
    if (usuarioExiste) {
      return res.render("cadastro", {
        tituloPagina: "Criar conta",
        erro: "Já existe uma conta com esse e-mail.",
        valores: { nome, email }
      });
    }

    const hash = await bcrypt.hash(senha, 10);

    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash: hash
    });

    // 🔥 SESSÃO COMPLETA
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto: null
    };

    return res.redirect("/");
  } catch (error) {
    console.error("❌ Erro ao cadastrar usuário:", error);
    return res.status(500).send("Erro ao cadastrar usuário.");
  }
}

// GET /login
async function mostrarLogin(req, res) {
  if (req.session.usuario) {
    return res.redirect("/");
  }

  res.render("login", {
    tituloPagina: "Entrar",
    erro: null,
    valores: {
      email: ""
    }
  });
}

// POST /login
async function logar(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.render("login", {
        tituloPagina: "Entrar",
        erro: "Preencha e-mail e senha.",
        valores: { email }
      });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.render("login", {
        tituloPagina: "Entrar",
        erro: "E-mail ou senha inválidos.",
        valores: { email }
      });
    }

    const confere = await bcrypt.compare(senha, usuario.senha_hash);

    if (!confere) {
      return res.render("login", {
        tituloPagina: "Entrar",
        erro: "E-mail ou senha inválidos.",
        valores: { email }
      });
    }

    // 🔥 SESSÃO COMPLETA
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto: null
    };

    return res.redirect("/");
  } catch (error) {
    console.error("❌ Erro ao fazer login:", error);
    return res.status(500).send("Erro ao fazer login.");
  }
}

// GET /logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
}

module.exports = {
  mostrarCadastro,
  cadastrar,
  mostrarLogin,
  logar,
  logout
};
