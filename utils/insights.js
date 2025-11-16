// ======================================================
// KST - INSIGHTS AUTOMÁTICOS DO DIA
// ======================================================

function generateInsights(dia, ultimosDias) {
  const insights = [];

  const horasHoje = dia.horas_estudo || 0;
  const sonoHoje = dia.horas_sono || 0;
  const humorHoje = dia.humor || "ok";
  const celularHoje = dia.tempo_celular || 0;

  // MÉDIA DAS ÚLTIMAS SEMANAS
  const total = ultimosDias.reduce((soma, d) => soma + (d.horas_estudo || 0), 0);
  const media = ultimosDias.length > 0 ? total / ultimosDias.length : 0;

  // ======================================================
  // INSIGHT 1 – ESTUDOU MAIS OU MENOS QUE A MÉDIA
  // ======================================================
  if (horasHoje > media + 1) {
    insights.push("Você estudou acima da sua média recente — excelente ritmo.");
  } else if (horasHoje < media - 1) {
    insights.push("Você estudou menos que a sua média recente. Tente recuperar amanhã.");
  }

  // ======================================================
  // INSIGHT 2 – SONO
  // ======================================================
  if (sonoHoje < 6) {
    insights.push("Seu sono foi baixo hoje — isso geralmente reduz seu rendimento.");
  } else if (sonoHoje >= 7.5) {
    insights.push("Você dormiu bem hoje — isso tende a melhorar sua produtividade.");
  }

  // ======================================================
  // INSIGHT 3 – HUMOR
  // ======================================================
  if (humorHoje === "bom" && horasHoje > media) {
    insights.push("Seu humor está alinhado com um bom desempenho hoje — aproveite essa fase.");
  } else if (humorHoje === "ruim") {
    insights.push("Seu humor hoje não estava bom — tente entender o que impactou seu rendimento.");
  }

  // ======================================================
  // INSIGHT 4 – CELULAR
  // ======================================================
  if (celularHoje >= 3) {
    insights.push("Você passou muito tempo no celular hoje — isso pode ter prejudicado seus estudos.");
  } else if (celularHoje <= 1) {
    insights.push("Excelente controle do celular hoje — isso te ajudou a focar mais.");
  }

  // ======================================================
  // Retorna no máximo 3 insights.
  // ======================================================
  return insights.slice(0, 3);
}

module.exports = { generateInsights };
