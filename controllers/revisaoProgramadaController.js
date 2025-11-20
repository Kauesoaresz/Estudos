// controllers/revisaoProgramadaController.js

const {
  RevisaoProgramada,
  Materia,
  EstudoMateriaDia
} = require("../models");

// helper interno pra diferença em dias (data2 - data1)
function diffDias(data1ISO, data2ISO) {
  const d1 = new Date(data1ISO + "T00:00:00");
  const d2 = new Date(data2ISO + "T00:00:00");
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// MAPA COMPLETO — TODAS AS MATÉRIAS DO ENEM
const materiaCoresPorNome = {

  "matemática": "#ef4444",
  "matematica": "#ef4444",
  "mat": "#ef4444",
  "matemat": "#ef4444",
  "física": "#3b82f6",
  "fisica": "#3b82f6",
  "química": "#22c55e",
  "quimica": "#22c55e",
  "biologia": "#a855f7",
  "bio": "#a855f7",
  "português": "#f97316",
  "portugues": "#f97316",
  "língua portuguesa": "#f97316",
  "lingua portuguesa": "#f97316",
  "gramática": "#fb923c",
  "gramatica": "#fb923c",
  "interpretação de texto": "#f59e0b",
  "interpretacao de texto": "#f59e0b",
  "literatura": "#f97316",
  "redação": "#eab308",
  "redacao": "#eab308",
  "história": "#ec4899",
  "historia": "#ec4899",
  "geografia": "#0ea5e9",
  "geo": "#0ea5e9",
  "sociologia": "#6366f1",
  "socio": "#6366f1",
  "filosofia": "#8b5cf6",
  "filo": "#8b5cf6",
  "inglês": "#06b6d4",
  "ingles": "#06b6d4",
  "ing": "#06b6d4"
  };

const fallbackPalette = [
  "#3b82f6", // azul
  "#eab308", // amarelo
  "#22c55e", // verde
  "#a855f7", // roxo
  "#f97316", // laranja
  "#ec4899", // rosa
  "#06b6d4", // ciano
  "#f43f5e", // vermelho forte
  "#14b8a6", // verde água
  "#8b5cf6"  // roxo claro
];

function getMateriaColor(nomeMateria) {
  if (!nomeMateria) return fallbackPalette[0];

  const key = nomeMateria.trim().toLowerCase();

  if (materiaCoresPorNome[key]) {
    return materiaCoresPorNome[key];
  }

  // fallback por hash da palavra
  const hash = [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return fallbackPalette[hash % fallbackPalette.length];
}

function getMateriaAccentColor(nome, id) {
  if (!nome) {
    const idx = id ? id % fallbackPalette.length : 0;
    return fallbackPalette[idx];
  }
  const key = nome.toLowerCase();
  if (materiaCoresPorNome[key]) {
    return materiaCoresPorNome[key];
  }
  const idx = id ? id % fallbackPalette.length : 0;
  return fallbackPalette[idx];
}

// ===================================================================
// LISTA PRINCIPAL: hoje / atrasadas / futuras (AGRUPADAS)
// ===================================================================
async function listarRevisoesProgramadas(req, res) {
  try {
    const usuarioId = req.session.usuario.id;
    const hojeISO = new Date().toISOString().slice(0, 10);

    // Busca todas as revisões pendentes do usuário
    const revisoesBrutas = await RevisaoProgramada.findAll({
      where: {
        usuario_id: usuarioId,
        status: "pendente"
      },
      include: [
        { model: Materia, as: "materia", attributes: ["id", "nome"] }
      ],
      order: [["data_programada", "ASC"], ["tipo_ciclo", "ASC"]]
    });

    // -------------------------------------------------
    // Puxa infos dos estudos originais (origem_id)
    // -------------------------------------------------
    const origemIdsPendentes = [
      ...new Set(
        revisoesBrutas
          .map((r) => r.origem_id)
          .filter((id) => !!id)
      )
    ];

    let estudosMap = {};
    if (origemIdsPendentes.length > 0) {
      const estudos = await EstudoMateriaDia.findAll({
        where: {
          id: origemIdsPendentes,
          usuario_id: usuarioId
        },
        attributes: [
          "id",
          "topicos_estudados",
          "minutos_estudados",
          "questoes_feitas",
          "questoes_certas"
        ]
      });

      estudosMap = estudos.reduce((acc, e) => {
        const plain = e.get({ plain: true });
        acc[plain.id] = plain;
        return acc;
      }, {});
    }

    // -------------------------------------------------
    // Separa em hoje / atrasadas + agrupa FUTURAS
    // -------------------------------------------------
    const hoje = [];
    const atrasadas = [];
    const futurasPorMateria = {};

    revisoesBrutas.forEach((r) => {
      const plain = r.get({ plain: true });

      let dataISO =
        typeof plain.data_programada === "string"
          ? plain.data_programada
          : plain.data_programada.toISOString().slice(0, 10);

      const estInfo = plain.origem_id ? estudosMap[plain.origem_id] : null;

      const baseItem = {
        id: plain.id,
        materiaId: plain.materia ? plain.materia.id : plain.materia_id,
        materiaNome: plain.materia ? plain.materia.nome : "Matéria",
        dataISO,
        dataLabel: dataISO.split("-").reverse().join("/"),
        tipo_ciclo: plain.tipo_ciclo,
        origem_id: plain.origem_id,
        status: plain.status,
        topicos_estudados: estInfo ? estInfo.topicos_estudados : null,
        minutos_estudados: estInfo ? estInfo.minutos_estudados : null,
        questoes_feitas: estInfo ? estInfo.questoes_feitas : null,
        questoes_certas: estInfo ? estInfo.questoes_certas : null
      };

      if (dataISO === hojeISO) {
        hoje.push(baseItem);
      } else if (dataISO < hojeISO) {
        baseItem.diasAtraso = diffDias(dataISO, hojeISO); // hoje - data
        atrasadas.push(baseItem);
      } else {
        // FUTURAS → agrupa por MATÉRIA e depois por CONTEÚDO (origem_id)
        const materiaId = baseItem.materiaId;
        if (!futurasPorMateria[materiaId]) {
          futurasPorMateria[materiaId] = {
            materiaId,
            materiaNome: baseItem.materiaNome,
            estudos: {}
          };
        }

        const estudoKey =
          baseItem.origem_id != null
            ? String(baseItem.origem_id)
            : `sem-estudo-${materiaId}`;

        if (!futurasPorMateria[materiaId].estudos[estudoKey]) {
          futurasPorMateria[materiaId].estudos[estudoKey] = {
            origem_id: baseItem.origem_id || null,
            topicos_estudados: baseItem.topicos_estudados,
            minutos_estudados: baseItem.minutos_estudados,
            questoes_feitas: baseItem.questoes_feitas,
            questoes_certas: baseItem.questoes_certas,
            revisoes: []
          };
        }

        futurasPorMateria[materiaId].estudos[estudoKey].revisoes.push({
          id: baseItem.id,
          tipo_ciclo: baseItem.tipo_ciclo,
          dataLabel: baseItem.dataLabel,
          diasRestantes: diffDias(hojeISO, dataISO),
          origem_id: baseItem.origem_id
        });
      }
    });

    // -------------------------------------------------
    // Cálculo de progresso por matéria (todas revisões)
    // -------------------------------------------------
    const materiaIds = Object.keys(futurasPorMateria).map((id) => Number(id));

    let progressoMateria = {};
    let progressoOrigem = {};

    if (materiaIds.length > 0) {
      // resumo geral por matéria
      const resumoMat = await RevisaoProgramada.findAll({
        where: {
          usuario_id: usuarioId,
          materia_id: materiaIds
        },
        attributes: ["materia_id", "status"],
        raw: true
      });

      const tmpMat = {};
      resumoMat.forEach((item) => {
        const mid = item.materia_id;
        if (!tmpMat[mid]) {
          tmpMat[mid] = { total: 0, feitas: 0 };
        }
        tmpMat[mid].total += 1;
        if (item.status === "feito") tmpMat[mid].feitas += 1;
      });

      Object.entries(tmpMat).forEach(([mid, data]) => {
        const total = data.total || 0;
        const feitas = data.feitas || 0;
        const percent =
          total > 0 ? Math.round((feitas / total) * 100) : null;
        progressoMateria[mid] = { total, feitas, percent };
      });

      // progresso por conteúdo (origem_id)
      const origemIdsAll = [];
      Object.values(futurasPorMateria).forEach((m) => {
        Object.values(m.estudos).forEach((est) => {
          if (est.origem_id) origemIdsAll.push(est.origem_id);
        });
      });

      const origemIdsUnique = [...new Set(origemIdsAll)];

      if (origemIdsUnique.length > 0) {
        const resumoOrigem = await RevisaoProgramada.findAll({
          where: {
            usuario_id: usuarioId,
            origem_id: origemIdsUnique
          },
          attributes: ["origem_id", "status"],
          raw: true
        });

        const tmpOrigem = {};
        resumoOrigem.forEach((item) => {
          const oid = item.origem_id;
          if (!tmpOrigem[oid]) {
            tmpOrigem[oid] = { total: 0, feitas: 0 };
          }
          tmpOrigem[oid].total += 1;
          if (item.status === "feito") tmpOrigem[oid].feitas += 1;
        });

        Object.entries(tmpOrigem).forEach(([oid, data]) => {
          const total = data.total || 0;
          const feitas = data.feitas || 0;
          const percent =
            total > 0 ? Math.round((feitas / total) * 100) : null;
          progressoOrigem[oid] = { total, feitas, percent };
        });
      }
    }

    // -------------------------------------------------
    // Monta estrutura final para a view
    // -------------------------------------------------
    let futurasAgrupadas = Object.values(futurasPorMateria).map((m) => {
      const estudosArray = Object.values(m.estudos).map((est) => {
        let percentConcluido = null;
        if (est.origem_id && progressoOrigem[est.origem_id]) {
          percentConcluido = progressoOrigem[est.origem_id].percent;
        }

        return {
          ...est,
          percentConcluido
        };
      });

      const totalRevisoesPendentes = estudosArray.reduce(
        (acc, est) => acc + est.revisoes.length,
        0
      );

      const progMat = progressoMateria[m.materiaId] || {};
      const accentColor = getMateriaAccentColor(
        m.materiaNome,
        m.materiaId
      );

      return {
        materiaId: m.materiaId,
        materiaNome: m.materiaNome,
        totalRevisoesPendentes,
        accentColor,
        percentConcluido:
          progMat.percent != null ? progMat.percent : null,
        estudos: estudosArray
      };
    });

    // Ordena matérias por nome (fica mais clean na UI)
    futurasAgrupadas.sort((a, b) =>
      a.materiaNome.localeCompare(b.materiaNome, "pt-BR", {
        sensitivity: "base"
      })
    );

    res.render("revisoes_programadas", {
      tituloPagina: "Revisões programadas",
      hoje,
      atrasadas,
      futurasAgrupadas
    });
  } catch (err) {
    console.error("❌ Erro ao listar revisões programadas:", err);
    return res.status(500).send("Erro ao carregar revisões programadas.");
  }
}

// ===================================================================
// HISTÓRICO: revisões feitas ou ignoradas
// ===================================================================
async function listarHistorico(req, res) {
  try {
    const usuarioId = req.session.usuario.id;

    const historico = await RevisaoProgramada.findAll({
      where: {
        usuario_id: usuarioId,
        status: ["feito", "ignorado"]
      },
      include: [
        { model: Materia, as: "materia", attributes: ["id", "nome"] }
      ],
      order: [["data_programada", "DESC"], ["tipo_ciclo", "ASC"]]
    });

    // Puxa estudos originais pra mostrar conteúdo / minutos / questões
    const origemIds = [
      ...new Set(
        historico
          .map((r) => r.origem_id)
          .filter((id) => !!id)
      )
    ];

    let estudosMap = {};
    if (origemIds.length > 0) {
      const estudos = await EstudoMateriaDia.findAll({
        where: {
          id: origemIds,
          usuario_id: usuarioId
        },
        attributes: [
          "id",
          "topicos_estudados",
          "minutos_estudados",
          "questoes_feitas",
          "questoes_certas"
        ]
      });

      estudosMap = estudos.reduce((acc, e) => {
        const plain = e.get({ plain: true });
        acc[plain.id] = plain;
        return acc;
      }, {});
    }

    const lista = historico.map((h) => {
      const plain = h.get({ plain: true });
      const estInfo = plain.origem_id ? estudosMap[plain.origem_id] : null;

      const dataISO =
        typeof plain.data_programada === "string"
          ? plain.data_programada
          : plain.data_programada.toISOString().slice(0, 10);

      return {
        id: plain.id,
        materiaNome: plain.materia ? plain.materia.nome : "Matéria",
        dataLabel: dataISO.split("-").reverse().join("/"),
        tipo_ciclo: plain.tipo_ciclo,
        status: plain.status,
        origem_id: plain.origem_id,
        topicos_estudados: estInfo ? estInfo.topicos_estudados : null,
        minutos_estudados: estInfo ? estInfo.minutos_estudados : null,
        questoes_feitas: estInfo ? estInfo.questoes_feitas : null,
        questoes_certas: estInfo ? estInfo.questoes_certas : null
      };
    });

    return res.render("revisoes_historico", {
      tituloPagina: "Histórico de Revisões",
      lista
    });
  } catch (err) {
    console.error("❌ Erro ao carregar histórico:", err);
    return res.status(500).send("Erro ao carregar histórico.");
  }
}

// ===================================================================
// MARCAR COMO FEITA
// ===================================================================
async function marcarRevisaoFeita(req, res) {
  try {
    const usuarioId = req.session.usuario.id;
    const id = req.params.id;

    const rev = await RevisaoProgramada.findOne({
      where: { id, usuario_id: usuarioId }
    });

    if (!rev) return res.status(404).send("Revisão não encontrada.");

    rev.status = "feito";
    await rev.save();

    return res.redirect("/revisoes-programadas");
  } catch (err) {
    console.error("❌ Erro ao marcar revisão como feita:", err);
    return res.status(500).send("Erro ao atualizar revisão.");
  }
}

// ===================================================================
// ADIAR REVISÃO
// ===================================================================
async function adiarRevisao(req, res) {
  try {
    const usuarioId = req.session.usuario.id;
    const id = req.params.id;

    const rev = await RevisaoProgramada.findOne({
      where: { id, usuario_id: usuarioId }
    });

    if (!rev) return res.status(404).send("Revisão não encontrada.");

    const diasAdiar = Number(req.body.dias || 2);

    let dataISO =
      typeof rev.data_programada === "string"
        ? rev.data_programada
        : rev.data_programada.toISOString().slice(0, 10);

    const dt = new Date(dataISO + "T00:00:00");
    dt.setDate(dt.getDate() + diasAdiar);

    rev.data_programada = dt.toISOString().slice(0, 10);
    await rev.save();

    return res.redirect("/revisoes-programadas");
  } catch (err) {
    console.error("❌ Erro ao adiar revisão:", err);
    return res.status(500).send("Erro ao adiar revisão.");
  }
}

// ===================================================================
// IGNORAR REVISÃO
// ===================================================================
async function ignorarRevisao(req, res) {
  try {
    const usuarioId = req.session.usuario.id;
    const id = req.params.id;

    const rev = await RevisaoProgramada.findOne({
      where: { id, usuario_id: usuarioId }
    });

    if (!rev) return res.status(404).send("Revisão não encontrada.");

    rev.status = "ignorado";
    await rev.save();

    return res.redirect("/revisoes-programadas");
  } catch (err) {
    console.error("❌ Erro ao ignorar revisão:", err);
    return res.status(500).send("Erro ao ignorar revisão.");
  }
}

// ===================================================================
// DELETAR (APENAS NO HISTÓRICO)
// ===================================================================
async function deletarRevisao(req, res) {
  try {
    const usuarioId = req.session.usuario.id;
    const id = req.params.id;

    const rev = await RevisaoProgramada.findOne({
      where: { id, usuario_id: usuarioId }
    });

    if (!rev) return res.status(404).send("Revisão não encontrada.");

    await rev.destroy();

    return res.redirect("/revisoes-programadas/historico");
  } catch (err) {
    console.error("❌ Erro ao deletar revisão:", err);
    return res.status(500).send("Erro ao deletar revisão.");
  }
}

module.exports = {
  listarRevisoesProgramadas,
  listarHistorico,
  marcarRevisaoFeita,
  adiarRevisao,
  ignorarRevisao,
  deletarRevisao
};
