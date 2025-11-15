// controllers/revisaoController.js
//
// Módulo de REVISÃO do Kauê Study Tracker
// - Dashboard de revisão por matéria
// - Tela detalhada da matéria para revisão
// - Registro de sessões de revisão (reutilizando EstudoMateriaDia)

const { Materia, EstudoMateriaDia, Dia } = require("../models");
const {
  toISODate,
  diffDiasFromHoje,
  formatarDDMMYYYY
} = require("../utils/datas");

// -----------------------------
// DASHBOARD DE REVISÃO GERAL
// -----------------------------
async function dashboardRevisao(req, res) {
  try {
    // Busca TODOS os estudos, com matéria + dia
    const estudosBrutos = await EstudoMateriaDia.findAll({
      include: [
        { model: Materia, as: "materia", attributes: ["id", "nome"] },
        { model: Dia, as: "dia", attributes: ["data"] }
      ]
    });

    const estudos = estudosBrutos.map((e) => e.get({ plain: true }));

    // Mapa por matéria
    const mapa = new Map();

    estudos.forEach((est) => {
      const mat = est.materia;
      if (!mat) return;

      const matId = mat.id;

      if (!mapa.has(matId)) {
        mapa.set(matId, {
          materiaId: matId,
          materiaNome: mat.nome,
          ultimoEstudoISO: null,
          totalQuestoes: 0,
          totalCertas: 0,
          totalMarcadasRevisao: 0,
          totalEstudos: 0
        });
      }

      const item = mapa.get(matId);
      item.totalEstudos++;

      // Data
      if (est.dia && est.dia.data) {
        const iso = toISODate(est.dia.data);
        if (iso) {
          if (!item.ultimoEstudoISO || iso > item.ultimoEstudoISO) {
            item.ultimoEstudoISO = iso;
          }
        }
      }

      // Questões
      if (est.questoes_feitas != null) {
        item.totalQuestoes += Number(est.questoes_feitas);
      }
      if (est.questoes_certas != null) {
        item.totalCertas += Number(est.questoes_certas);
      }
      if (est.questoes_marcadas_revisao != null) {
        item.totalMarcadasRevisao += Number(est.questoes_marcadas_revisao);
      }
    });

    // Constrói array final
    const materiasRevisao = Array.from(mapa.values()).map((m) => {
      let diasSemVer = null;
      if (m.ultimoEstudoISO) {
        diasSemVer = diffDiasFromHoje(m.ultimoEstudoISO);
        if (diasSemVer < 0) diasSemVer = 0;
      }

      const taxaAcerto =
        m.totalQuestoes > 0
          ? Math.round((m.totalCertas / m.totalQuestoes) * 100)
          : null;

      const dificuldade = taxaAcerto != null ? 100 - taxaAcerto : 50;
      const diasPeso = Math.min(diasSemVer ?? 0, 60);
      const marcadasPeso = Math.min(m.totalMarcadasRevisao || 0, 50);

      // Combinação dos critérios (III)
      const prioridadeScore =
        diasPeso * 0.5 + dificuldade * 0.3 + marcadasPeso * 0.2;

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
        prioridadeScore: Number(prioridadeScore.toFixed(1)),
        dificuldade
      };
    });

    // Ordena por prioridade desc
    materiasRevisao.sort((a, b) => b.prioridadeScore - a.prioridadeScore);

    const sugestoesHoje = materiasRevisao.slice(0, 5); // top 5

    res.render("revisao_dashboard", {
      tituloPagina: "Revisão – Kauê Study Tracker",
      materiasRevisao,
      sugestoesHoje
    });
  } catch (error) {
    console.error("❌ Erro ao carregar dashboard de revisão:", error);
    return res
      .status(500)
      .send("Erro ao carregar painel de revisão. Veja o console.");
  }
}

// -----------------------------
// TELA DETALHADA DE UMA MATÉRIA PARA REVISÃO
// -----------------------------
async function detalheMateriaRevisao(req, res) {
  const id = req.params.id;

  try {
    const materia = await Materia.findByPk(id, { raw: true });
    if (!materia) {
      return res.status(404).send("Matéria não encontrada.");
    }

    const estudosBrutos = await EstudoMateriaDia.findAll({
      where: { materia_id: id },
      include: [{ model: Dia, as: "dia", attributes: ["data"] }],
      order: [["id", "DESC"]]
    });

    const estudosDetalhados = estudosBrutos.map((e) => {
      const est = e.get({ plain: true });

      const iso = est.dia?.data ? toISODate(est.dia.data) : null;
      const dataLabel = iso ? formatarDDMMYYYY(iso) : "—";

      let taxaAcerto = null;
      if (
        est.questoes_feitas &&
        est.questoes_certas != null &&
        est.questoes_feitas > 0
      ) {
        taxaAcerto = Math.round(
          (est.questoes_certas / est.questoes_feitas) * 100
        );
      }

      const tipo =
        est.tipo_estudo && est.tipo_estudo.toUpperCase().includes("REVIS")
          ? "REVISÃO"
          : "ESTUDO";

      return {
        id: est.id,
        dataLabel,
        tipo,
        minutos_estudados: est.minutos_estudados,
        topicos_estudados: est.topicos_estudados,
        questoes_feitas: est.questoes_feitas,
        questoes_certas: est.questoes_certas,
        questoes_marcadas_revisao: est.questoes_marcadas_revisao,
        taxaAcerto
      };
    });

    // Resumo rápido
    let totalMinutos = 0;
    let totalQuestoes = 0;
    let totalCertas = 0;
    let totalMarcadas = 0;

    estudosDetalhados.forEach((e) => {
      if (e.minutos_estudados != null) {
        totalMinutos += Number(e.minutos_estudados);
      }
      if (e.questoes_feitas != null) {
        totalQuestoes += Number(e.questoes_feitas);
      }
      if (e.questoes_certas != null) {
        totalCertas += Number(e.questoes_certas);
      }
      if (e.questoes_marcadas_revisao != null) {
        totalMarcadas += Number(e.questoes_marcadas_revisao);
      }
    });

    const horasTotais = totalMinutos / 60;
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
        horasTotais,
        totalMinutos,
        totalQuestoes,
        totalCertas,
        totalMarcadas,
        taxaAcertoGeral
      },
      sucesso
    });
  } catch (error) {
    console.error("❌ Erro ao carregar tela de revisão da matéria:", error);
    return res
      .status(500)
      .send("Erro ao carregar revisão da matéria. Veja o console.");
  }
}

// -----------------------------
// REGISTRAR UMA SESSÃO DE REVISÃO
// (reutiliza EstudoMateriaDia com tipo_estudo = "REVISÃO")
// -----------------------------
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

    if (!data || !materia_id) {
      return res.redirect(`/revisao/materia/${materia_id}?erro=1`);
    }

    // Garante que existe um Dia com essa data
    let dia = await Dia.findOne({ where: { data } });
    if (!dia) {
      dia = await Dia.create({ data });
    }

    await EstudoMateriaDia.create({
      dia_id: dia.id,
      materia_id: Number(materia_id),
      minutos_estudados: minutos_estudados
        ? Number(minutos_estudados)
        : null,
      tipo_estudo: tipo_revisao
        ? `REVISÃO - ${tipo_revisao}`
        : "REVISÃO",
      topicos_estudados: topicos_revisados || null,
      questoes_feitas: questoes_feitas ? Number(questoes_feitas) : null,
      questoes_certas: questoes_certas ? Number(questoes_certas) : null,
      questoes_marcadas_revisao: null
    });

    return res.redirect(`/revisao/materia/${materia_id}?sucesso=1`);
  } catch (error) {
    console.error("❌ Erro ao registrar revisão:", error);
    return res
      .status(500)
      .send("Erro ao registrar revisão. Veja o console.");
  }
}

module.exports = {
  dashboardRevisao,
  detalheMateriaRevisao,
  registrarRevisao
};
