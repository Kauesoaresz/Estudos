const { Medalha, MedalhaUsuario, Dia, EstudoMateriaDia, Simulado } = require("../models");

async function verificarMedalhas() {
  let medalhasConquistadas = [];

  // -------------------------
  // 1. HORAS ACUMULADAS NO ANO
  // -------------------------
  const dias = await Dia.findAll();
  const totalHoras = dias.reduce((acc, d) => acc + Number(d.horas_estudo_liquidas || 0), 0);

  const medalhasHoras = await Medalha.findAll({
    where: { tipo_trigger: "HORAS_ACUMULADAS" }
  });

  for (let m of medalhasHoras) {
    if (totalHoras >= m.valor_trigger) {
      const [conquista, created] = await MedalhaUsuario.findOrCreate({
        where: { medalha_id: m.id }
      });
      if (created) medalhasConquistadas.push(m);
    }
  }

  return medalhasConquistadas;
}

module.exports = verificarMedalhas;
