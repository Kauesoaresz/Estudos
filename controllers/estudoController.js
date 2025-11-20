// controllers/estudoController.js
//
// Agora 100% multiusuário! Cada usuário só vê os próprios estudos.
//

const { EstudoMateriaDia, Materia, Dia, RevisaoProgramada } = require("../models");
const { toISODate, formatarDDMMYYYY } = require("../utils/datas");
const { verificarMedalhas } = require("../services/medalhasService");

// ===================================================================
// FORM: Novo Estudo
// ===================================================================
async function novoEstudoForm(req, res) {
  try {
    const usuarioId = req.session.usuario.id;

    const sucesso = req.query.sucesso === "1";
    const erro = req.query.erro === "1";

    const materias = await Materia.findAll({
      where: { usuario_id: usuarioId },
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
    const usuarioId = req.session.usuario.id;

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

    // Garante que o dia existe para o usuário
    let dia = await Dia.findOne({ where: { data, usuario_id: usuarioId } });
    if (!dia)
      dia = await Dia.create({ data, usuario_id: usuarioId });

    const novoEstudo = await EstudoMateriaDia.create({
  usuario_id: usuarioId,
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

// 🔥 DISPARAR REVISÕES AUTOMÁTICAS
if (tipo_estudo === "CONTEUDO_NOVO") {
  const dataISO = toISODate(data);
  await gerarRevisoesAutomaticas(
  usuarioId,
  Number(materia_id),
  novoEstudo.id,
  dataISO,
  topicos_estudados || ""
);

}


    // CHECK DE MEDALHAS (por usuário)
    const novasMedalhas = await verificarMedalhas(usuarioId);
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
  const usuarioId = req.session.usuario.id;
  const { de, ate, materia_id } = req.query;

  try {
    const estudosBrutos = await EstudoMateriaDia.findAll({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: Materia,
          as: "materia",
          attributes: ["id", "nome"],
          where: { usuario_id: usuarioId }
        },
        {
          model: Dia,
          as: "dia",
          attributes: ["data"],
          where: { usuario_id: usuarioId }
        }
      ],
      order: [["id", "DESC"]]
    });

    const materias = await Materia.findAll({
      where: { usuario_id: usuarioId },
      order: [["nome", "ASC"]],
      raw: true
    });

    const estudosProcessados = estudosBrutos.map((e) => {
      const est = e.get({ plain: true });

      const dataISO = typeof est.dia.data === "string"
        ? est.dia.data
        : toISODate(est.dia.data);

      let taxaAcerto = null;
      if (est.questoes_feitas > 0 && est.questoes_certas != null) {
        taxaAcerto = Math.round((est.questoes_certas / est.questoes_feitas) * 100);
      }

      return {
        id: est.id,
        dataISO,
        dataFormatada: formatarDDMMYYYY(dataISO),
        materiaId: est.materia.id,
        materiaNome: est.materia.nome,
        minutos_estudados: est.minutos_estudados,
        tipo_estudo: est.tipo_estudo,
        questoes_feitas: est.questoes_feitas,
        questoes_certas: est.questoes_certas,
        questoes_marcadas_revisao: est.questoes_marcadas_revisao,
        taxaAcerto,
        topicos_estudados: est.topicos_estudados
      };
    });

    let estudos = estudosProcessados;

    if (de) estudos = estudos.filter((e) => e.dataISO >= de);
    if (ate) estudos = estudos.filter((e) => e.dataISO <= ate);
    if (materia_id)
      estudos = estudos.filter(
        (e) => String(e.materiaId) === String(materia_id)
      );

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
  const usuarioId = req.session.usuario.id;

  try {
    const estudo = await EstudoMateriaDia.findOne({
      where: {
        id: req.params.id,
        usuario_id: usuarioId
      },
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
  const usuarioId = req.session.usuario.id;

  try {
    const estudo = await EstudoMateriaDia.findOne({
      where: { id: req.params.id, usuario_id: usuarioId },
      include: [
        { model: Materia, as: "materia", attributes: ["id", "nome"] }
      ]
    });

    if (!estudo) return res.status(404).send("Estudo não encontrado.");

    const materias = await Materia.findAll({
      where: { usuario_id: usuarioId },
      order: [["nome", "ASC"]],
      raw: true
    });

    res.render("estudo_materia_editar", {
      tituloPagina: "Editar estudo",
      estudo: estudo.get({ plain: true }),
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
  const usuarioId = req.session.usuario.id;

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

    let dia = await Dia.findOne({ where: { data, usuario_id: usuarioId } });
    if (!dia)
      dia = await Dia.create({ data, usuario_id: usuarioId });

    await EstudoMateriaDia.update(
      {
        dia_id: dia.id,
        materia_id: Number(materia_id),
        minutos_estudados: minutos_estudados ? Number(minutos_estudados) : null,
        tipo_estudo: tipo_estudo || null,
        topicos_estudados,
        questoes_feitas: questoes_feitas ? Number(questoes_feitas) : null,
        questoes_certas: questoes_certas ? Number(questoes_certas) : null,
        questoes_marcadas_revisao: questoes_marcadas_revisao
          ? Number(questoes_marcadas_revisao)
          : null
      },
      {
        where: {
          id: req.params.id,
          usuario_id: usuarioId
        }
      }
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
  const usuarioId = req.session.usuario.id;

  try {
    await EstudoMateriaDia.destroy({
      where: {
        id: req.params.id,
        usuario_id: usuarioId
      }
    });

    res.redirect("/estudos");
  } catch (err) {
    console.error("❌ Erro ao excluir estudo:", err);
    res.status(500).send("Erro ao excluir estudo.");
  }
}

// =====================================================================
// FUNÇÃO ESPECIAL: CRIAR REVISÕES FUTURAS R1 → R5
// =====================================================================
async function gerarRevisoesAutomaticas(usuario_id, materia_id, origem_id, dataBaseISO, conteudo) {

  const ciclos = [
    { tipo: "R1", dias: 1 },
    { tipo: "R2", dias: 3 },
    { tipo: "R3", dias: 7 },
    { tipo: "R4", dias: 15 },
    { tipo: "R5", dias: 30 },
  ];

  const base = new Date(dataBaseISO);

  for (const c of ciclos) {
    const novaData = new Date(base);
    novaData.setDate(novaData.getDate() + c.dias);

    const dataISO = novaData.toISOString().slice(0, 10);

    await RevisaoProgramada.create({
      usuario_id,
      materia_id,
      origem_id,
      tipo_ciclo: c.tipo,
      data_programada: dataISO,
      status: "pendente",
      conteudo    // 🔥 AGORA SALVANDO OS TÓPICOS DO ESTUDO
    });
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
