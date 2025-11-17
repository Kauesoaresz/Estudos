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
 * valores possíveis: "comum", "raro", "epico", "lendario"
 */
function classificarRaridade(medalha) {
  const t = medalha.tipo_trigger;
  const v = medalha.valor_trigger;

  // HORAS ACUMULADAS – longo prazo
  if (t === "HORAS_ACUM") {
    if (v <= 200) return "comum";
    if (v <= 600) return "raro";
    if (v <= 1200) return "epico";
    return "lendario";
  }

  // QUESTÕES FEITAS
  if (t === "QUESTOES") {
    if (v <= 500) return "comum";
    if (v <= 3000) return "raro";
    if (v <= 10000) return "epico";
    return "lendario";
  }

  // ACERTOS
  if (t === "ACERTOS") {
    if (v <= 500) return "comum";
    if (v <= 2000) return "raro";
    if (v <= 10000) return "epico";
    return "lendario";
  }

  // DIAS SEGUIDOS
  if (t === "DIAS_SEGUIDOS") {
    if (v <= 14) return "comum";
    if (v <= 45) return "raro";
    if (v <= 90) return "epico";
    return "lendario";
  }

  // SIMULADOS
  if (t === "SIMULADOS_FEITOS") {
    if (v <= 5) return "comum";
    if (v <= 20) return "raro";
    if (v <= 70) return "epico";
    return "lendario";
  }

  // REVISÕES
  if (t === "REVISOES") {
    if (v <= 10) return "comum";
    if (v <= 40) return "raro";
    if (v <= 150) return "epico";
    return "lendario";
  }

  // METAS
  if (t === "META") {
    if (v <= 10) return "comum";
    if (v <= 50) return "raro";
    if (v <= 100) return "epico";
    return "lendario";
  }

  // HORAS EM UM DIA
  if (t === "HORAS_DIA") {
    if (v <= 3) return "comum";
    if (v <= 5) return "raro";
    if (v <= 8) return "epico";
    return "lendario";
  }

  // QUESTÕES EM UM DIA
  if (t === "QUESTOES_DIA") {
    if (v <= 40) return "comum";
    if (v <= 100) return "raro";
    if (v <= 150) return "epico";
    return "lendario";
  }

  // QUALQUER OUTRO TIPO / ESPECIAIS
  if (v <= 10) return "comum";
  if (v <= 100) return "raro";
  if (v <= 500) return "epico";
  return "lendario";
}

/**
 * Ícone por categoria de medalha
 */
function iconePorCategoria(categoria = "") {
  const c = categoria.toLowerCase();

  if (c.includes("horas acumuladas")) return "⏳";
  if (c.includes("horas semanais")) return "📅";
  if (c.includes("horas por dia")) return "⚡";

  if (c.includes("questões feitas")) return "❓";
  if (c.includes("produtividade")) return "🧠";

  if (c.includes("acertos")) return "🎯";
  if (c.includes("dias seguidos")) return "🔥";

  if (c.includes("simulados")) return "📘";
  if (c.includes("revisões")) return "♻️";

  if (c.includes("meta diária")) return "⭐";
  if (c.includes("hábitos")) return "🌙";

  // fallback
  return "🏅";
}

// ----------------------------------------
// LISTAR TODAS AS MEDALHAS COM PROGRESSO
// ----------------------------------------
exports.listarMedalhas = async (req, res) => {
  try {
    // Atualiza / registra novas medalhas antes de listar
    const novasMedalhas = await verificarMedalhas();

    const dias = await Dia.findAll();
    const estudos = await EstudoMateriaDia.findAll();
    const simulados = await Simulado.findAll();

    const medalhas = await Medalha.findAll({
      order: [["categoria", "ASC"], ["valor_trigger", "ASC"]],
      raw: true
    });

    const conquistadas = await MedalhaUsuario.findAll({
      attributes: ["medalha_id", "data_conquista"],
      raw: true
    });

    const conquistadasSet = new Set(conquistadas.map(m => m.medalha_id));

    // Totais gerais
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

    // Dias seguidos
    let sequencia = 0;
    let maiorSequencia = 0;

    const diasOrdenados = [...dias].sort((a, b) =>
      a.data.localeCompare(b.data)
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

    // Monta lista final com progresso + raridade + ícone
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
        progresso: Number.isFinite(progresso) ? progresso.toFixed(1) : "0.0",
        conquistada: conquistadasSet.has(m.id),
        data_conquista: conquistadasSet.has(m.id)
          ? conquistadas.find(x => x.medalha_id === m.id).data_conquista
          : null,
        raridade, // "comum" | "raro" | "epico" | "lendario"
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
      tituloPagina: "Medalhas • Kauê Estudos",
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

// ----------------------------------------
// LISTAR APENAS MEDALHAS CONQUISTADAS
// ----------------------------------------
exports.medalhasConquistadas = async (req, res) => {
  try {
    await verificarMedalhas();

    const conquistadasBrutas = await MedalhaUsuario.findAll({
      include: [{ model: Medalha, as: "medalha" }],
      order: [["data_conquista", "DESC"]]
    });

    // transforma em objetos planos + adiciona ícone
    const conquistadas = conquistadasBrutas.map(reg => {
      const plain = reg.get({ plain: true });
      const icone = iconePorCategoria(plain.medalha.categoria);

      return {
        ...plain,
        medalha: {
          ...plain.medalha,
          icone
        }
      };
    });

    res.render("medalhas_conquistadas", {
      tituloPagina: "Medalhas Conquistadas",
      conquistadas
    });
  } catch (error) {
    console.error("❌ Erro ao listar medalhas conquistadas:", error);
    return res
      .status(500)
      .send("Erro ao listar medalhas conquistadas.");
  }
};
