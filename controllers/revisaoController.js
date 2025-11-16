const { Materia, EstudoMateriaDia, Dia } = require("../models");
const {
  toISODate,
  diffDiasFromHoje,
  formatarDDMMYYYY
} = require("../utils/datas");


// =====================================================================
// DASHBOARD DE REVISÃO
// =====================================================================
async function dashboardRevisao(req, res) {
  try {
    const estudosBrutos = await EstudoMateriaDia.findAll({
      include: [
        { model: Materia, as: "materia", attributes: ["id", "nome"] },
        { model: Dia, as: "dia", attributes: ["data"] }
      ]
    });

    const estudos = estudosBrutos.map(e => e.get({ plain: true }));
    const mapa = new Map();

    // ==============================
    // AGRUPAMENTO POR MATÉRIA
    // ==============================
    estudos.forEach(est => {
      const mat = est.materia;
      if (!mat) return;

      if (!mapa.has(mat.id)) {
        mapa.set(mat.id, {
          materiaId: mat.id,
          materiaNome: mat.nome,
          ultimoEstudoISO: null,
          totalQuestoes: 0,
          totalCertas: 0,
          totalMarcadasRevisao: 0
        });
      }

      const item = mapa.get(mat.id);

      if (est.dia?.data) {
        const iso = toISODate(est.dia.data);
        if (!item.ultimoEstudoISO || iso > item.ultimoEstudoISO) {
          item.ultimoEstudoISO = iso;
        }
      }

      if (est.questoes_feitas != null)
        item.totalQuestoes += Number(est.questoes_feitas);

      if (est.questoes_certas != null)
        item.totalCertas += Number(est.questoes_certas);

      if (est.questoes_marcadas_revisao != null)
        item.totalMarcadasRevisao += Number(est.questoes_marcadas_revisao);
    });

    // ==============================
    // CÁLCULO FINAL
    // ==============================
    const materiasRevisao = Array.from(mapa.values()).map(m => {
      const diasSemVer = m.ultimoEstudoISO
        ? Math.max(diffDiasFromHoje(m.ultimoEstudoISO), 0)
        : 0;

      const taxaAcerto =
        m.totalQuestoes > 0
          ? Math.round((m.totalCertas / m.totalQuestoes) * 100)
          : null;

      let prioridadeScore = 0;
      let prioridadeClass = "baixa";
      let prioridadeLabel = "Prioridade baixa";

      // CASO ESPECIAL: redação ou matérias sem questões
      if (taxaAcerto === null) {
        if (diasSemVer >= 7) {
          prioridadeClass = "alta";
          prioridadeLabel = "Prioridade alta";
        } else if (diasSemVer >= 3) {
          prioridadeClass = "media";
          prioridadeLabel = "Prioridade média";
        }
      } else {
        const dificuldade = 100 - taxaAcerto;  
        const diasPeso = Math.min(diasSemVer, 60);
        const marcadasPeso = Math.min(m.totalMarcadasRevisao, 50);

        prioridadeScore =
          diasPeso * 0.5 +
          dificuldade * 0.3 +
          marcadasPeso * 0.2;

        prioridadeScore = Number(prioridadeScore.toFixed(1));

        if (prioridadeScore >= 40) {
          prioridadeClass = "alta";
          prioridadeLabel = "Prioridade alta";
        } else if (prioridadeScore >= 20) {
          prioridadeClass = "media";
          prioridadeLabel = "Prioridade média";
        }
      }

      return {
        materiaId: m.materiaId,
        materiaNome: m.materiaNome,
        ultimoEstudoISO: m.ultimoEstudoISO,
        ultimoEstudoLabel: m.ultimoEstudoISO
          ? formatarDDMMYYYY(m.ultimoEstudoISO)
          : "—",
        diasSemVer,
        taxaAcerto,
        totalQuestoes: m.totalQuestoes,
        totalCertas: m.totalCertas,
        totalMarcadasRevisao: m.totalMarcadasRevisao,
        prioridadeScore,
        prioridadeClass,
        prioridadeLabel
      };
    });

    // ORDENAÇÃO
    materiasRevisao.sort((a, b) => b.prioridadeScore - a.prioridadeScore);

    const sugestoesHoje = materiasRevisao.slice(0, 5);

    res.render("revisao_dashboard", {
      tituloPagina: "Revisão – Kauê Study Tracker",
      materiasRevisao,
      sugestoesHoje
    });

  } catch (error) {
    console.error("❌ Erro no dashboard:", error);
    return res.status(500).send("Erro ao carregar painel de revisão.");
  }
}



// =====================================================================
// DETALHE DA MATÉRIA
// =====================================================================
async function detalheMateriaRevisao(req, res) {
  try {
    const id = req.params.id;

    const materia = await Materia.findByPk(id, { raw: true });
    if (!materia)
      return res.status(404).send("Matéria não encontrada.");

    const estudosBrutos = await EstudoMateriaDia.findAll({
      where: { materia_id: id },
      include: [{ model: Dia, as: "dia", attributes: ["data"] }],
      order: [["id", "DESC"]]
    });

    const estudosDetalhados = estudosBrutos.map(e => {
      const est = e.get({ plain: true });
      const iso = est.dia?.data ? toISODate(est.dia.data) : null;

      let taxaAcerto = null;
      if (est.questoes_feitas > 0)
        taxaAcerto = Math.round(
          (est.questoes_certas / est.questoes_feitas) * 100
        );

      return {
        id: est.id,
        dataLabel: iso ? formatarDDMMYYYY(iso) : "—",
        tipo: est.tipo_estudo?.includes("REVIS") ? "REVISÃO" : "ESTUDO",
        minutos_estudados: est.minutos_estudados,
        topicos_estudados: est.topicos_estudados,
        questoes_feitas: est.questoes_feitas,
        questoes_certas: est.questoes_certas,
        questoes_marcadas_revisao: est.questoes_marcadas_revisao,
        taxaAcerto
      };
    });

    let totalMinutos = 0;
    let totalQuestoes = 0;
    let totalCertas = 0;
    let totalMarcadas = 0;

    estudosDetalhados.forEach(e => {
      totalMinutos += Number(e.minutos_estudados || 0);
      totalQuestoes += Number(e.questoes_feitas || 0);
      totalCertas += Number(e.questoes_certas || 0);
      totalMarcadas += Number(e.questoes_marcadas_revisao || 0);
    });

    const taxaAcertoGeral =
      totalQuestoes > 0
        ? Math.round((totalCertas / totalQuestoes) * 100)
        : null;

    const sucesso = req.query.sucesso === "1";

    res.render("revisao_materia", {
      tituloPagina: `Revisão – ${materia.nome}`,
      materia,
      estudosDetalhados,
      resumo: {
        totalMinutos,
        totalQuestoes,
        totalCertas,
        totalMarcadas,
        horasTotais: totalMinutos / 60,
        taxaAcertoGeral
      },
      sucesso
    });

  } catch (error) {
    console.error("❌ Erro detalhe revisão:", error);
    return res.status(500).send("Erro ao carregar revisão da matéria.");
  }
}



// =====================================================================
// REGISTRAR REVISÃO (compatível com ENUM do banco)
// =====================================================================
async function registrarRevisao(req, res) {
  try {
    const {
      data,
      materia_id,
      minutos_estudados,
      tipo_revisao,
      topicos_revisados,
      questoes_feitas,
      questoes_certas
    } = req.body;

    if (!materia_id || !data)
      return res.redirect(`/revisao/materia/${materia_id}?erro=1`);

    let dia = await Dia.findOne({ where: { data } });
    if (!dia) dia = await Dia.create({ data });

    // ============================
    // MAPEAMENTO PARA O ENUM
    // ============================
    let tipoFinal = "REVISAO"; // padrão

    // tipo_revisao pode ser string ou array
    let origem = tipo_revisao;

    if (Array.isArray(origem)) {
      const joined = origem.map(String).join(" ").toLowerCase();
      if (joined.includes("novo")) {
        tipoFinal = "CONTEUDO_NOVO";
      } else if (joined.includes("erro")) {
        tipoFinal = "REVISAO_ERRO";
      } else {
        tipoFinal = "REVISAO";
      }
    } else if (origem) {
      const t = String(origem).toLowerCase();
      if (t.includes("novo")) {
        tipoFinal = "CONTEUDO_NOVO";
      } else if (t.includes("erro")) {
        tipoFinal = "REVISAO_ERRO";
      } else {
        tipoFinal = "REVISAO";
      }
    }

    await EstudoMateriaDia.create({
      dia_id: dia.id,
      materia_id: Number(materia_id),
      minutos_estudados: minutos_estudados ? Number(minutos_estudados) : null,
      tipo_estudo: tipoFinal,
      topicos_estudados: topicos_revisados || null,
      questoes_feitas: questoes_feitas ? Number(questoes_feitas) : null,
      questoes_certas: questoes_certas ? Number(questoes_certas) : null,
      questoes_marcadas_revisao: null
    });

    return res.redirect(`/revisao/materia/${materia_id}?sucesso=1`);

  } catch (error) {
    console.error("❌ Erro ao registrar revisão:", error.message, error);
    return res.status(500).send("Erro ao registrar revisão.");
  }
}



// =====================================================================
// CARREGAR A REVISÃO PARA EDIÇÃO
// =====================================================================
async function carregarRevisaoParaEdicao(req, res) {
  try {
    const id = req.params.id;

    const revisao = await EstudoMateriaDia.findByPk(id, {
      include: [{ model: Dia, as: "dia", attributes: ["data"] }]
    });

    if (!revisao) return res.status(404).send("Revisão não encontrada.");

    const materia = await Materia.findByPk(revisao.materia_id, { raw: true });

    res.render("revisao_editar", {
      tituloPagina: "Editar revisão",
      revisao: revisao.get({ plain: true }),
      materia
    });

  } catch (error) {
    console.error("❌ Erro ao carregar edição:", error);
    res.status(500).send("Erro ao carregar revisão para edição.");
  }
}



// =====================================================================
// ATUALIZAR REVISÃO (compatível com ENUM do banco)
// =====================================================================
async function atualizarRevisao(req, res) {
  try {
    const id = req.params.id;

    const {
      data,
      minutos_estudados,
      topicos_revisados,
      questoes_feitas,
      questoes_certas,
      tipo_revisao
    } = req.body;

    const revisao = await EstudoMateriaDia.findByPk(id);
    if (!revisao) return res.status(404).send("Revisão não encontrada.");

    // Tipo compatível com ENUM
    let tipoFinal = revisao.tipo_estudo || "REVISAO";

    let origem = tipo_revisao;
    if (Array.isArray(origem)) {
      const joined = origem.map(String).join(" ").toLowerCase();
      if (joined.includes("novo")) {
        tipoFinal = "CONTEUDO_NOVO";
      } else if (joined.includes("erro")) {
        tipoFinal = "REVISAO_ERRO";
      } else {
        tipoFinal = "REVISAO";
      }
    } else if (origem) {
      const t = String(origem).toLowerCase();
      if (t.includes("novo")) {
        tipoFinal = "CONTEUDO_NOVO";
      } else if (t.includes("erro")) {
        tipoFinal = "REVISAO_ERRO";
      } else {
        tipoFinal = "REVISAO";
      }
    }

    // Atualiza dia
    let dia = await Dia.findOne({ where: { data } });
    if (!dia) dia = await Dia.create({ data });

    await revisao.update({
      dia_id: dia.id,
      minutos_estudados: minutos_estudados ? Number(minutos_estudados) : 0,
      topicos_estudados: topicos_revisados || null,
      questoes_feitas: questoes_feitas ? Number(questoes_feitas) : 0,
      questoes_certas: questoes_certas ? Number(questoes_certas) : 0,
      tipo_estudo: tipoFinal
    });

    return res.redirect(`/revisao/materia/${revisao.materia_id}?sucesso=1`);

  } catch (error) {
    console.error("❌ Erro ao atualizar revisão:", error.message, error);
    res.status(500).send("Erro ao atualizar revisão.");
  }
}



// =====================================================================
// EXCLUIR REVISÃO
// =====================================================================
async function excluirRevisao(req, res) {
  try {
    const id = req.params.id;

    const revisao = await EstudoMateriaDia.findByPk(id);
    if (!revisao) return res.status(404).send("Revisão não encontrada.");

    const materiaId = revisao.materia_id;

    await revisao.destroy();

    return res.redirect(`/revisao/materia/${materiaId}?apagado=1`);

  } catch (error) {
    console.error("❌ Erro ao excluir revisão:", error);
    res.status(500).send("Erro ao excluir revisão.");
  }
}

// =====================================================
// API para buscar uma revisão específica (para o popup)
// =====================================================
async function getRevisaoAPI(req, res) {
  try {
    const id = req.params.id;

    const r = await EstudoMateriaDia.findByPk(id, {
      include: [{ model: Dia, as: "dia" }]
    });

    if (!r) return res.status(404).json({ erro: "Revisão não encontrada." });

    res.json({
      data: r.dia.data,
      minutos: r.minutos_estudados,
      topicos: r.topicos_estudados,
      feitas: r.questoes_feitas,
      certas: r.questoes_certas
    });

  } catch (err) {
    console.error("Erro ao buscar revisão API:", err);
    return res.status(500).json({ erro: "Erro no servidor." });
  }
}

module.exports = {
  dashboardRevisao,
  detalheMateriaRevisao,
  registrarRevisao,
  carregarRevisaoParaEdicao,
  atualizarRevisao,
  excluirRevisao,
  getRevisaoAPI
};
