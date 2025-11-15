// app.js
//
// Versão limpa e organizada do Kauê Study Tracker
// com arquitetura MVC: controllers + routes + utils

const express = require("express");
const path = require("path");
const db = require("./models"); // sequelize + models

// Rotas
const diaRoutes = require("./routes/diaRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const estudoRoutes = require("./routes/estudoRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");
const estatisticasRoutes = require("./routes/estatisticasRoutes");
const revisaoRoutes = require("./routes/revisaoRoutes"); // 👈 NOVO

const app = express();

// ---------------------
// CONFIGURAÇÕES DO EXPRESS
// ---------------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// ---------------------
// TESTA CONEXÃO COM O BANCO
// ---------------------

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Conexão com o banco estabelecida com sucesso.");

    await db.sequelize.sync();
    console.log("✅ Models sincronizados com o banco.");
  } catch (error) {
    console.error("❌ Erro ao conectar ou sincronizar com o banco:", error.message);
  }
})();

// ---------------------
// ROTAS
// ---------------------

// DIA (inclui home na rota "/")
app.use("/", diaRoutes);

// MATÉRIAS
app.use("/materias", materiaRoutes);

// ESTUDOS POR MATÉRIA
app.use("/estudos", estudoRoutes);

// SIMULADOS
app.use("/simulados", simuladoRoutes);

// ESTATÍSTICAS
app.use("/estatisticas", estatisticasRoutes);

// REVISÃO (NOVO MÓDULO)
app.use("/revisao", revisaoRoutes);

// ---------------------
// SUBIR SERVIDOR
// ---------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Kauê Study Tracker rodando em http://localhost:${PORT}`);
});
