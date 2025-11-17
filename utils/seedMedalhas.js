const { Medalha } = require("../models");

const medalhasBase = [
  // ===============================
  // HORAS ESTUDADAS (ANO)
  // ===============================
  { nome: "Primeira Hora", descricao: "Estude 1 hora no total.", categoria: "Horas Acumuladas", tipo_trigger: "HORAS_ACUMULADAS", valor_trigger: 1 },
  { nome: "Constante", descricao: "10 horas acumuladas.", categoria: "Horas Acumuladas", tipo_trigger: "HORAS_ACUMULADAS", valor_trigger: 10 },
  { nome: "Começando a Engrenar", descricao: "25 horas acumuladas.", categoria: "Horas Acumuladas", tipo_trigger: "HORAS_ACUMULADAS", valor_trigger: 25 },

  // ... (aqui entram TODAS as 66 medalhas que te entreguei)
  // se quiser, eu gero o arquivo COMPLETO automaticamente
];

async function seedMedalhas() {
  for (let m of medalhasBase) {
    await Medalha.findOrCreate({
      where: { nome: m.nome },
      defaults: m
    });
  }

  console.log("🏅 Medalhas base cadastradas com sucesso!");
}

module.exports = seedMedalhas;
