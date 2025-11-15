// controllers/estudoController.js
//
// Controla tudo referente a ESTUDOS POR MATÉRIA:
// - listar estudos com filtros
// - criar estudo
// - detalhar estudo
// - editar estudo
// - atualizar estudo
// - excluir estudo

const { EstudoMateriaDia, Materia, Dia } = require("../models");
const { toISODate, formatarDDMMYYYY } = require("../utils/datas");

// ---------------------
// FORM: Novo Estudo
// ---------------------
async function novoEstudoForm(req, res) {
  try {
    const sucesso = req.query.sucesso === "1";
    const erro = req.query.erro === "1";

    const materias = await Materia.findAll({
      order: [["nome", "ASC"]],
      raw: true
    });

    res.render("estudo_materia_novo", {
      tituloPagina: "Registrar estudo por matéria",
      materias,
      sucesso,
      erro
    });
  } catch (error) {
    console.error("❌ Erro ao carregar formulário de estudo:", error);
    res
      .status(500)
      .send("Erro ao carregar formulário de estudo. Veja o console.");
  }
}

// ---------------------
// SALVAR ESTUDO
// ---------------------
async function criarEstudo(req, res) {
  try {
    const {
      data,
      materia_id,
      minutos_estudados,
      tipo_estudo,
      topicos_estudados,
      questoes_feitas,
      questoes_certas,
      questoes_marcadas_revisao
    } = req.body;

    if (!data || !materia_id) {
      return res.redirect("/estudos/novo?erro=1");
    }

    // Garante que o dia existe
    let dia = await Dia.findOne({ where: { data } });
    if (!dia) {
      dia = await Dia.create({ data });
    }

    await EstudoMateriaDia.create({
      dia_id: dia.id,
      materia_id: Number(materia_id),
      minutos_estudados: minutos_estudados ? Number(minutos_estudados) : null,
      tipo_estudo: tipo_estudo || null,
      topicos_estudados: topicos_estudados || null,
      questoes_feitas: questoes_feitas ? Number(questoes_feitas) : null,
      questoes_certas: questoes_certas ? Number(questoes_certas) : null,
      questoes_marcadas_revisao: questoes_marcadas_revisao
        ? Number(questoes_marcadas_revisao)
        : null
    });

    return res.redirect("/estudos/novo?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao salvar estudo:", error);
    res
      .status(500)
      .send("Erro ao salvar estudo. Veja o console.");
  }
}

// ---------------------
// LISTAR ESTUDOS + FILTROS
// ---------------------
async function listarEstudos(req, res) {
  const { de, ate, materia_id } = req.query;

  try {
    const estudosBrutos = await EstudoMateriaDia.findAll({
      include: [
        {
          model: Materia,
          as: "materia",
          attributes: ["id", "nome"]
        },
        {
          model: Dia,
          as: "dia",
          attributes: ["data"]
        }
      ],
      order: [["id", "DESC"]]
    });

    const materias = await Materia.findAll({
      order: [["nome", "ASC"]],
      raw: true
    });

    const estudosProcessados = estudosBrutos.map((e) => {
      const est = e.get({ plain: true });

      let dataISO = est.dia?.data;
      if (dataISO instanceof Date) {
        dataISO = toISODate(est.dia.data);
      }

      let dataFormatada = dataISO ? formatarDDMMYYYY(dataISO) : null;

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

      return {
        id: est.id,
        dataISO,
        dataFormatada,
        materiaId: est.materia?.id || null,
        materiaNome: est.materia?.nome || "—",
        minutos_estudados: est.minutos_estudados,
        tipo_estudo: est.tipo_estudo,
        questoes_feitas: est.questoes_feitas,
        questoes_certas: est.questoes_certas,
        questoes_marcadas_revisao: est.questoes_marcadas_revisao,
        taxaAcerto,
        topicos_estudados: est.topicos_estudados
      };
    });

    // Aplicando filtros
    let estudos = estudosProcessados;

    if (de) estudos = estudos.filter((e) => e.dataISO >= de);
    if (ate) estudos = estudos.filter((e) => e.dataISO <= ate);
    if (materia_id)
      estudos = estudos.filter(
        (e) => e.materiaId && String(e.materiaId) === String(materia_id)
      );

    res.render("estudos_lista", {
      tituloPagina: "Histórico de estudos por matéria",
      estudos,
      materias,
      de: de || "",
      ate: ate || "",
      materia_id: materia_id || ""
    });
  } catch (error) {
    console.error("❌ Erro ao listar estudos:", error);
    res.status(500).send("Erro ao carregar histórico de estudos.");
  }
}

// ---------------------
// DETALHE DE UM ESTUDO
// ---------------------
async function detalheEstudo(req, res) {
  const id = req.params.id;
  try {
    const estudo = await EstudoMateriaDia.findByPk(id, {
      include: [
        { model: Materia, as: "materia", attributes: ["nome"] },
        { model: Dia, as: "dia", attributes: ["data"] }
      ]
    });

    if (!estudo) {
      return res.status(404).send("Estudo não encontrado.");
    }

    const est = estudo.get({ plain: true });
    res.render("estudo_materia_detalhe", {
      tituloPagina: "Detalhes do estudo",
      estudo: est
    });
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes do estudo:", error);
    res.status(500).send("Erro ao carregar detalhes do estudo.");
  }
}

// ---------------------
// EDITAR FORM
// ---------------------
async function editarEstudoForm(req, res) {
  const id = req.params.id;
  try {
    const estudo = await EstudoMateriaDia.findByPk(id, {
      include: [{ model: Materia, as: "materia", attributes: ["id", "nome"] }]
    });

    if (!estudo) {
      return res.status(404).send("Estudo não encontrado.");
    }

    const estudoPlain = estudo.get({ plain: true });

    const materias = await Materia.findAll({
      order: [["nome", "ASC"]],
      raw: true
    });

    res.render("estudo_materia_editar", {
      tituloPagina: "Editar estudo",
      estudo: estudoPlain,
      materias
    });
  } catch (error) {
    console.error("❌ Erro ao carregar estudo para edição:", error);
    res
      .status(500)
      .send("Erro ao carregar formulário de edição do estudo.");
  }
}

// ---------------------
// ATUALIZAR ESTUDO
// ---------------------
async function atualizarEstudo(req, res) {
  const id = req.params.id;
  try {
    const {
      data,
      materia_id,
      minutos_estudados,
      tipo_estudo,
      topicos_estudados,
      questoes_feitas,
      questoes_certas,
      questoes_marcadas_revisao
    } = req.body;

    if (!data || !materia_id) {
      return res.redirect(`/estudos/${id}/editar`);
    }

    // Garante que o dia existe
    let dia = await Dia.findOne({ where: { data } });
    if (!dia) {
      dia = await Dia.create({ data });
    }

    await EstudoMateriaDia.update(
      {
        dia_id: dia.id,
        materia_id: Number(materia_id),
        minutos_estudados: minutos_estudados
          ? Number(minutos_estudados)
          : null,
        tipo_estudo: tipo_estudo || null,
        topicos_estudados: topicos_estudados || null,
        questoes_feitas: questoes_feitas ? Number(questoes_feitas) : null,
        questoes_certas: questoes_certas ? Number(questoes_certas) : null,
        questoes_marcadas_revisao: questoes_marcadas_revisao
          ? Number(questoes_marcadas_revisao)
          : null
      },
      { where: { id } }
    );

    return res.redirect("/estudos");
  } catch (error) {
    console.error("❌ Erro ao atualizar estudo:", error);
    res
      .status(500)
      .send("Erro ao atualizar estudo. Veja o console.");
  }
}

// ---------------------
// EXCLUIR ESTUDO
// ---------------------
async function excluirEstudo(req, res) {
  const id = req.params.id;
  try {
    await EstudoMateriaDia.destroy({ where: { id } });
    return res.redirect("/estudos");
  } catch (error) {
    console.error("❌ Erro ao excluir estudo:", error);
    res.status(500).send("Erro ao excluir estudo.");
  }
}

module.exports = {
  novoEstudoForm,
  criarEstudo,
  listarEstudos,
  detalheEstudo,
  editarEstudoForm,
  atualizarEstudo,
  excluirEstudo
};
