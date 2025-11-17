// controllers/estudoController.js
//
// Controla tudo referente aos ESTUDOS POR MATÉRIA:
// - Form criar
// - Criar estudo
// - Listar estudos + filtros
// - Detalhar estudo
// - Editar
// - Atualizar
// - Excluir
// - Sistema automático de medalhas

const { EstudoMateriaDia, Materia, Dia } = require("../models");
const { toISODate, formatarDDMMYYYY } = require("../utils/datas");
const { verificarMedalhas } = require("../services/medalhasService");

// ===================================================================
// FORM: Novo Estudo
// ===================================================================
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
  } catch (err) {
    console.error("❌ Erro ao carregar formulario:", err);
    res.status(500).send("Erro ao abrir formulário de estudo.");
  }
}

// ===================================================================
// CRIAR ESTUDO
// ===================================================================
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
    if (!dia) dia = await Dia.create({ data });

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

    // ===============================
    // CHECK AUTOMÁTICO DE MEDALHAS
    // ===============================
    const novasMedalhas = await verificarMedalhas();
    if (novasMedalhas.length > 0) {
      return res.render("medalha_nova", { novasMedalhas });
    }

    return res.redirect("/estudos/novo?sucesso=1");
  } catch (err) {
    console.error("❌ Erro ao criar estudo:", err);
    res.status(500).send("Erro ao salvar estudo.");
  }
}

// ===================================================================
// LISTAR ESTUDOS + FILTROS
// ===================================================================
async function listarEstudos(req, res) {
  const { de, ate, materia_id } = req.query;

  try {
    const estudosBrutos = await EstudoMateriaDia.findAll({
      include: [
        { model: Materia, as: "materia", attributes: ["id", "nome"] },
        { model: Dia, as: "dia", attributes: ["data"] }
      ],
      order: [["id", "DESC"]]
    });

    const materias = await Materia.findAll({
      order: [["nome", "ASC"]],
      raw: true
    });

    // Processar dados
    const estudosProcessados = estudosBrutos.map((e) => {
      const est = e.get({ plain: true });

      let dataISO = est.dia?.data;
      if (dataISO instanceof Date) dataISO = toISODate(est.dia.data);

      let dataFormatada = dataISO ? formatarDDMMYYYY(dataISO) : null;

      let taxaAcerto = null;
      if (est.questoes_feitas > 0 && est.questoes_certas != null) {
        taxaAcerto = Math.round((est.questoes_certas / est.questoes_feitas) * 100);
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

    // Aplicar filtros
    let estudos = estudosProcessados;

    if (de) estudos = estudos.filter((e) => e.dataISO >= de);
    if (ate) estudos = estudos.filter((e) => e.dataISO <= ate);
    if (materia_id)
      estudos = estudos.filter((e) => e.materiaId && String(e.materiaId) === String(materia_id));

    res.render("estudos_lista", {
      tituloPagina: "Histórico de estudos por matéria",
      estudos,
      materias,
      de: de || "",
      ate: ate || "",
      materia_id: materia_id || ""
    });
  } catch (err) {
    console.error("❌ Erro ao listar estudos:", err);
    res.status(500).send("Erro ao carregar histórico de estudos.");
  }
}

// ===================================================================
// DETALHAR UM ESTUDO
// ===================================================================
async function detalheEstudo(req, res) {
  try {
    const estudo = await EstudoMateriaDia.findByPk(req.params.id, {
      include: [
        { model: Materia, as: "materia", attributes: ["nome"] },
        { model: Dia, as: "dia", attributes: ["data"] }
      ]
    });

    if (!estudo) return res.status(404).send("Estudo não encontrado.");

    res.render("estudo_materia_detalhe", {
      tituloPagina: "Detalhes do estudo",
      estudo: estudo.get({ plain: true })
    });
  } catch (err) {
    console.error("❌ Erro ao detalhar estudo:", err);
    res.status(500).send("Erro ao carregar detalhes.");
  }
}

// ===================================================================
// EDITAR FORM
// ===================================================================
async function editarEstudoForm(req, res) {
  try {
    const estudo = await EstudoMateriaDia.findByPk(req.params.id, {
      include: [{ model: Materia, as: "materia", attributes: ["id", "nome"] }]
    });

    if (!estudo) return res.status(404).send("Estudo não encontrado.");

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
  } catch (err) {
    console.error("❌ Erro ao carregar edição:", err);
    res.status(500).send("Erro ao carregar formulário de edição.");
  }
}

// ===================================================================
// ATUALIZAR ESTUDO
// ===================================================================
async function atualizarEstudo(req, res) {
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
      return res.redirect(`/estudos/${req.params.id}/editar`);
    }

    let dia = await Dia.findOne({ where: { data } });
    if (!dia) dia = await Dia.create({ data });

    await EstudoMateriaDia.update(
      {
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
      },
      { where: { id: req.params.id } }
    );

    return res.redirect("/estudos");
  } catch (err) {
    console.error("❌ Erro ao atualizar estudo:", err);
    res.status(500).send("Erro ao atualizar estudo.");
  }
}

// ===================================================================
// EXCLUIR ESTUDO
// ===================================================================
async function excluirEstudo(req, res) {
  try {
    await EstudoMateriaDia.destroy({ where: { id: req.params.id } });
    res.redirect("/estudos");
  } catch (err) {
    console.error("❌ Erro ao excluir estudo:", err);
    res.status(500).send("Erro ao excluir estudo.");
  }
}

// ===================================================================
// EXPORTAR CONTROLLER COMPLETO
// ===================================================================
module.exports = {
  novoEstudoForm,
  criarEstudo,
  listarEstudos,
  detalheEstudo,
  editarEstudoForm,
  atualizarEstudo,
  excluirEstudo
};
