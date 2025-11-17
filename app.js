// app.js
// =====================================================
//        KAUE – ESTUDOS  •  Versão com Medalhas
// =====================================================

const express = require("express");
const path = require("path");
const db = require("./models");

// IMPORTA A NOVA FUNÇÃO CORRETA
const { inicializarMedalhasBase } = require("./services/medalhasService");

// Rotas
const diaRoutes = require("./routes/diaRoutes");
const materiaRoutes = require("./routes/materiaRoutes");
const estudoRoutes = require("./routes/estudoRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");
const estatisticasRoutes = require("./routes/estatisticasRoutes");
const revisaoRoutes = require("./routes/revisaoRoutes");
const metasRoutes = require("./routes/metasRoutes");
const medalhaRoutes = require("./routes/medalhaRoutes");

const app = express();

// =====================================================
// CONFIGURAÇÕES DO EXPRESS
// =====================================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// CONEXÃO COM BANCO + SYNC + INICIALIZAÇÃO DAS MEDALHAS
// =====================================================
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Conexão com o banco OK!");

    await db.sequelize.sync();
    console.log("✅ Models sincronizados");

    // === CHAMA O SEED NOVO DE 80 MEDALHAS ===
    await inicializarMedalhasBase();
    console.log("🏅 Medalhas base carregadas");

  } catch (error) {
    console.error("❌ Erro ao iniciar banco:", error.message);
  }
})();

// =====================================================
// ROTAS PRINCIPAIS
// =====================================================

app.use("/", diaRoutes);
app.use("/materias", materiaRoutes);
app.use("/estudos", estudoRoutes);
app.use("/simulados", simuladoRoutes);
app.use("/estatisticas", estatisticasRoutes);
app.use("/revisao", revisaoRoutes);
app.use(metasRoutes);
app.use(medalhaRoutes);

// =====================================================
// SERVIDOR
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Rodando em http://localhost:${PORT}`);
});
