// =====================================================
//   KAUE – STUDY TRACKER  •  Login + Medalhas + Sessão
// =====================================================

// -------------------------------
// DEPENDÊNCIAS
// -------------------------------
require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./models");

const cookieParser = require("cookie-parser");
const session = require("express-session");

// Medalhas (seed)
const { inicializarMedalhasBase } = require("./services/medalhasService");

// Middlewares de autenticação
const { injectUser, ensureAuth } = require("./middlewares/authMiddleware");

// Rotas novas (login e cadastro)
const authRoutes = require("./routes/authRoutes");

// Rotas antigas
const diaRoutes = require("./routes/diaRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const estudoRoutes = require("./routes/estudoRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");
const estatisticasRoutes = require("./routes/estatisticasRoutes");
const revisaoRoutes = require("./routes/revisaoRoutes");
const metasRoutes = require("./routes/metasRoutes");
const medalhaRoutes = require("./routes/medalhaRoutes");

// Rota nova – PERFIL
const perfilRoutes = require("./routes/perfilRoutes");

// -------------------------------
// INICIAR APP
// -------------------------------
const app = express();

// -------------------------------
// CONFIG EXPRESS
// -------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// COOKIES + SESSÃO
// -------------------------------
app.use(cookieParser());

app.use(
  session({
    secret: "KAUE-SEGREDO-MASTER-2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 dias
    }
  })
);

// Disponibiliza dados do usuário p/ o EJS
app.use(injectUser);

// -------------------------------
// BANCO + SYNC + MEDALHAS
// -------------------------------
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Conexão com o banco OK!");

    await db.sequelize.sync();
    console.log("✅ Models sincronizados");

    await inicializarMedalhasBase();
    console.log("🏅 Medalhas base carregadas");
  } catch (error) {
    console.error("❌ Erro ao iniciar banco:", error.message);
  }
})();

// -------------------------------
// ROTAS ABERTAS (SEM LOGIN)
// -------------------------------
app.use("/", authRoutes); // /login, /cadastro, /logout

// -------------------------------
// HOME LOGADA
// -------------------------------
app.get("/", ensureAuth, (req, res) => {
  return res.redirect("/dias");
});

// -------------------------------
// ROTAS PROTEGIDAS
// -------------------------------
app.use("/dias", ensureAuth, diaRoutes);
app.use("/materias", ensureAuth, materiaRoutes);
app.use("/estudos", ensureAuth, estudoRoutes);
app.use("/simulados", ensureAuth, simuladoRoutes);
app.use("/estatisticas", ensureAuth, estatisticasRoutes);
app.use("/revisao", ensureAuth, revisaoRoutes);
app.use("/metas", ensureAuth, metasRoutes);
app.use("/medalhas", ensureAuth, medalhaRoutes);
app.use("/perfil", ensureAuth, perfilRoutes);

// -------------------------------
// SERVIDOR
// -------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`);
});
