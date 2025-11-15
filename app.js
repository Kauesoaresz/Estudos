// app.js
//
// Versão LIMPA — sem notificações

const express = require("express");
const path = require("path");
const db = require("./models");

// Rotas
const diaRoutes = require("./routes/diaRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const estudoRoutes = require("./routes/estudoRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");
const estatisticasRoutes = require("./routes/estatisticasRoutes");
const revisaoRoutes = require("./routes/revisaoRoutes");

const app = express();

// ---------------------
// CONFIGURAÇÕES
// ---------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// ---------------------
// TESTE BANCO
// ---------------------
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Conexão com o banco ok!");

    await db.sequelize.sync();
    console.log("✅ Models sincronizados");
  } catch (error) {
    console.error("❌ Erro banco:", error.message);
  }
})();

// ---------------------
// ROTAS
// ---------------------
app.use("/", diaRoutes);
app.use("/materias", materiaRoutes);
app.use("/estudos", estudoRoutes);
app.use("/simulados", simuladoRoutes);
app.use("/estatisticas", estatisticasRoutes);
app.use("/revisao", revisaoRoutes);

// ---------------------
// SERVIDOR
// ---------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`);
});
