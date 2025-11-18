// controllers/medalhaController.js
//
// Medalhas completamente adaptadas para MULTIUSUÁRIO
// Cada usuário tem suas próprias medalhas, progresso e histórico.
//

const {
  Medalha,
  MedalhaUsuario,
  Dia,
  EstudoMateriaDia,
  Simulado
} = require("../models");

const { verificarMedalhas } = require("../services/medalhasService");

/**
 * Classifica raridade de uma medalha
 */
function classificarRaridade(medalha) {
  const t = medalha.tipo_trigger;
  const v = medalha.valor_trigger;

  if (t === "HORAS_ACUM") {
    if (v <= 200) return "comum";
    if (v <= 600) return "raro";
    if (v <= 1200) return "epico";
    return "lendario";
  }

  if (t === "QUESTOES") {
    if (v <= 500) return "comum";
    if (v <= 3000) return "raro";
    if (v <= 10000) return "epico";
    return "lendario";
  }

  if (t === "ACERTOS") {
    if (v <= 500) return "comum";
    if (v <= 2000) return "raro";
    if (v <= 10000) return "epico";
    return "lendario";
  }

  if (t === "DIAS_SEGUIDOS") {
    if (v <= 14) return "comum";
    if (v <= 45) return "raro";
    if (v <= 90) return "epico";
    return "lendario";
  }

  if (t === "SIMULADOS_FEITOS") {
    if (v <= 5) return "comum";
    if (v <= 20) return "raro";
    if (v <= 70) return "epico";
    return "lendario";
  }

  if (t === "REVISOES") {
    if (v <= 10) return "comum";
    if (v <= 40) return "raro";
    if (v <= 150) return "epico";
    return "lendario";
  }

  if (t === "META") {
    if (v <= 10) return "comum";
    if (v <= 50) return "raro";
    if (v <= 100) return "epico";
    return "lendario";
  }

  if (t === "HORAS_DIA") {
    if (v <= 3) return "comum";
    if (v <= 5) return "raro";
    if (v <= 8) return "epico";
    return "lendario";
  }

  if (t === "QUESTOES_DIA") {
    if (v <= 40) return "comum";
    if (v <= 100) return "raro";
    if (v <= 150) return "epico";
    return "lendario";
  }

  if (v <= 10) return "comum";
  if (v <= 100) return "raro";
  if (v <= 500) return "epico";
  return "lendario";
}

/**
 * Ícones por categoria
 */
function iconePorCategoria(categoria = "") {
  const c = categoria.toLowerCase();

  if (c.includes("horas")) return "⏳";
  if (c.includes("quest")) return "❓";
  if (c.includes("acerto")) return "🎯";
  if (c.includes("dias")) return "🔥";
  if (c.includes("simulado")) return "📘";
  if (c.includes("revis")) return "♻️";
  if (c.includes("meta")) return "⭐";
  if (c.includes("sono")) return "🌙";

  return "🏅";
}

// ======================================================================
// LISTAR MEDALHAS + PROGRESSO (MULTIUSUÁRIO)
// ======================================================================
exports.listarMedalhas = async (req, res) => {
  try {
    const userId = req.session.usuario.id;

    // Verifica novas medalhas PARA ESTE USUÁRIO
    const novasMedalhas = await verificarMedalhas(userId);

    // Todos os dados apenas do usuário logado
    const dias = await Dia.findAll({ where: { usuario_id: userId } });
    const estudos = await EstudoMateriaDia.findAll({ where: { usuario_id: userId } });
    const simulados = await Simulado.findAll({ where: { usuario_id: userId } });

    // As medalhas base (são iguais para todos)
    const medalhas = await Medalha.findAll({
      order: [["categoria", "ASC"], ["valor_trigger", "ASC"]],
      raw: true
    });

    // Medalhas conquistadas do usuário
    const conquistadas = await MedalhaUsuario.findAll({
      where: { usuario_id: userId },
      attributes: ["medalha_id", "data_conquista"],
      raw: true
    });

    const conquistadasSet = new Set(conquistadas.map(m => m.medalha_id));

    // Totais do usuário
    const totalHoras = dias.reduce(
      (acc, d) => acc + (d.horas_estudo_liquidas || 0),
      0
    );

    const totalQuestoes = dias.reduce(
      (acc, d) => acc + (d.questoes_feitas_total || 0),
      0
    );

    const totalAcertos = dias.reduce(
      (acc, d) => acc + (d.questoes_acertos_total || 0),
      0
    );

    const totalSimulados = simulados.length;

    // Calcular maior sequência de dias estudando
    let sequencia = 0;
    let maiorSequencia = 0;

    const diasOrdenados = [...dias].sort((a, b) =>
      String(a.data).localeCompare(String(b.data))
    );

    for (const d of diasOrdenados) {
      const h = d.horas_estudo_liquidas || 0;
      const q = d.questoes_feitas_total || 0;

      if (h > 0 || q > 0) {
        sequencia++;
        maiorSequencia = Math.max(maiorSequencia, sequencia);
      } else {
        sequencia = 0;
      }
    }

    const ultimoDia = diasOrdenados[diasOrdenados.length - 1];

    // Construir progresso de cada medalha
    const listaFinal = medalhas.map(m => {
      let atual = 0;

      switch (m.tipo_trigger) {
        case "HORAS_ACUM":
          atual = totalHoras;
          break;
        case "QUESTOES":
          atual = totalQuestoes;
          break;
        case "ACERTOS":
          atual = totalAcertos;
          break;
        case "SIMULADOS_FEITOS":
          atual = totalSimulados;
          break;
        case "DIAS_SEGUIDOS":
          atual = maiorSequencia;
          break;
        case "HORAS_DIA":
          atual = ultimoDia?.horas_estudo_liquidas || 0;
          break;
        case "QUESTOES_DIA":
          atual = ultimoDia?.questoes_feitas_total || 0;
          break;
        case "SONO":
          atual = ultimoDia?.horas_sono_total || 0;
          break;
        case "ENERGIA":
          atual = ultimoDia?.nivel_energia || 0;
          break;
        case "FOCO":
          atual = ultimoDia?.nivel_foco || 0;
          break;
        case "META":
          atual = ultimoDia?.status_meta === "CONCLUIDA" ? 1 : 0;
          break;
      }

      const progresso = Math.min((atual / m.valor_trigger) * 100, 100);
      const faltam =
        atual >= m.valor_trigger ? 0 : m.valor_trigger - atual;

      const raridade = classificarRaridade(m);
      const icone = iconePorCategoria(m.categoria);

      return {
        ...m,
        atual,
        faltam,
        progresso: progresso.toFixed(1),
        conquistada: conquistadasSet.has(m.id),
        data_conquista: conquistadasSet.has(m.id)
          ? conquistadas.find(x => x.medalha_id === m.id).data_conquista
          : null,
        raridade,
        icone
      };
    });

    const totalMedalhas = listaFinal.length;
    const totalConquistadas = listaFinal.filter(m => m.conquistada).length;
    const progressoGeral =
      totalMedalhas === 0
        ? 0
        : Math.round((totalConquistadas / totalMedalhas) * 100);

    res.render("medalhas", {
      tituloPagina: "Medalhas • Kauê Study Tracker",
      medalhas: listaFinal,
      totalMedalhas,
      totalConquistadas,
      progressoGeral,
      novasMedalhas
    });
  } catch (error) {
    console.error("❌ Erro ao listar medalhas:", error);
    return res.status(500).send("Erro ao listar medalhas.");
  }
};

// ======================================================================
// LISTAR MEDALHAS CONQUISTADAS (MULTIUSUÁRIO)
// ======================================================================
exports.medalhasConquistadas = async (req, res) => {
  try {
    const userId = req.session.usuario.id;

    await verificarMedalhas(userId);

    const conquistadasBrutas = await MedalhaUsuario.findAll({
      where: { usuario_id: userId },
      include: [{ model: Medalha, as: "medalha" }],
      order: [["data_conquista", "DESC"]]
    });

    const conquistadas = conquistadasBrutas.map(reg => {
      const plain = reg.get({ plain: true });
      plain.medalha.icone = iconePorCategoria(plain.medalha.categoria);
      return plain;
    });

    res.render("medalhas_conquistadas", {
      tituloPagina: "Medalhas Conquistadas",
      conquistadas
    });
  } catch (error) {
    console.error("❌ Erro ao listar medalhas conquistadas:", error);
    return res.status(500).send("Erro ao listar medalhas conquistadas.");
  }
};
