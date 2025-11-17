// controllers/simuladoController.js
//
// Controla tudo relacionado aos SIMULADOS:
// - Form criar simulado
// - Criar simulado
// - Listar simulados + filtro
// - Detalhar
// - Editar
// - Atualizar
// - Excluir
// - Sistema automático de medalhas

const { Simulado, Dia } = require("../models");
const { toISODate, formatarDDMMYYYY } = require("../utils/datas");
const { verificarMedalhas } = require("../services/medalhasService");

// ===================================================================
// FORM: Novo Simulado
// ===================================================================
function novoSimuladoForm(req, res) {
  const sucesso = req.query.sucesso === "1";
  const erro = req.query.erro === "1";

  res.render("simulado_novo", {
    tituloPagina: "Registrar simulado",
    sucesso,
    erro
  });
}

// ===================================================================
// CRIAR SIMULADO
// ===================================================================
async function criarSimulado(req, res) {
  try {
    const {
      data,
      tempo_total_minutos,
      resultado_resumo,
      area_que_mais_errou,
      principal_dificuldade,
      acertos_linguagens,
      acertos_humanas,
      acertos_naturezas,
      acertos_matematica
    } = req.body;

    if (!data) {
      return res.redirect("/simulados/novo?erro=1");
    }

    // Garante que o dia existe
    let dia = await Dia.findOne({ where: { data } });
    if (!dia) dia = await Dia.create({ data });

    await Simulado.create({
      dia_id: dia.id,
      tempo_total_minutos: tempo_total_minutos ? Number(tempo_total_minutos) : null,
      resultado_resumo: resultado_resumo || null,
      area_que_mais_errou: area_que_mais_errou || null,
      principal_dificuldade: principal_dificuldade || null,

      acertos_linguagens: acertos_linguagens !== "" ? Number(acertos_linguagens) : null,
      acertos_humanas: acertos_humanas !== "" ? Number(acertos_humanas) : null,
      acertos_naturezas: acertos_naturezas !== "" ? Number(acertos_naturezas) : null,
      acertos_matematica: acertos_matematica !== "" ? Number(acertos_matematica) : null
    });

    // ===============================
    // CHECK AUTOMÁTICO DE MEDALHAS
    // ===============================
    const novasMedalhas = await verificarMedalhas();
    if (novasMedalhas.length > 0) {
      return res.render("medalha_nova", { novasMedalhas });
    }

    return res.redirect("/simulados/novo?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao salvar simulado:", error);
    return res.status(500).send("Erro ao salvar simulado. Veja o console.");
  }
}

// ===================================================================
// LISTAR SIMULADOS COM FILTRO
// ===================================================================
async function listarSimulados(req, res) {
  const { de, ate } = req.query;

  try {
    const simuladosBrutos = await Simulado.findAll({
      include: [{ model: Dia, as: "dia", attributes: ["data"] }],
      order: [["id", "DESC"]]
    });

    const simuladosProcessados = simuladosBrutos.map((s) => {
      const sim = s.get({ plain: true });

      let dataISO = sim.dia?.data;
      if (dataISO instanceof Date) dataISO = toISODate(dataISO);

      const dataFormatada = dataISO ? formatarDDMMYYYY(dataISO) : null;

      const totalAcertos =
        (sim.acertos_linguagens || 0) +
        (sim.acertos_humanas || 0) +
        (sim.acertos_naturezas || 0) +
        (sim.acertos_matematica || 0);

      return {
        id: sim.id,
        dataISO,
        dataFormatada,
        tempo_total_minutos: sim.tempo_total_minutos,
        resultado_resumo: sim.resultado_resumo,
        area_que_mais_errou: sim.area_que_mais_errou,
        principal_dificuldade: sim.principal_dificuldade,
        acertos_linguagens: sim.acertos_linguagens,
        acertos_humanas: sim.acertos_humanas,
        acertos_naturezas: sim.acertos_naturezas,
        acertos_matematica: sim.acertos_matematica,
        totalAcertos
      };
    });

    let simulados = simuladosProcessados;

    if (de) simulados = simulados.filter((s) => s.dataISO && s.dataISO >= de);
    if (ate) simulados = simulados.filter((s) => s.dataISO && s.dataISO <= ate);

    res.render("simulados_lista", {
      tituloPagina: "Histórico de simulados",
      simulados,
      de: de || "",
      ate: ate || ""
    });
  } catch (error) {
    console.error("❌ Erro ao listar simulados:", error);
    return res.status(500).send("Erro ao carregar simulados.");
  }
}

// ===================================================================
// DETALHAR SIMULADO
// ===================================================================
async function detalheSimulado(req, res) {
  try {
    const simulado = await Simulado.findByPk(req.params.id, {
      include: [{ model: Dia, as: "dia", attributes: ["data"] }]
    });

    if (!simulado) return res.status(404).send("Simulado não encontrado.");

    res.render("simulado_detalhe", {
      tituloPagina: "Detalhes do simulado",
      simulado: simulado.get({ plain: true })
    });
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes do simulado:", error);
    return res.status(500).send("Erro ao carregar detalhes do simulado.");
  }
}

// ===================================================================
// EDITAR FORM
// ===================================================================
async function editarSimuladoForm(req, res) {
  try {
    const simulado = await Simulado.findByPk(req.params.id, {
      include: [{ model: Dia, as: "dia", attributes: ["data"] }]
    });

    if (!simulado) return res.status(404).send("Simulado não encontrado.");

    res.render("simulado_editar", {
      tituloPagina: "Editar simulado",
      simulado: simulado.get({ plain: true })
    });
  } catch (error) {
    console.error("❌ Erro ao carregar simulado para edição:", error);
    return res.status(500).send("Erro ao carregar simulado para edição.");
  }
}

// ===================================================================
// ATUALIZAR SIMULADO
// ===================================================================
async function atualizarSimulado(req, res) {
  try {
    const id = req.params.id;

    const {
      data,
      tempo_total_minutos,
      resultado_resumo,
      area_que_mais_errou,
      principal_dificuldade,
      acertos_linguagens,
      acertos_humanas,
      acertos_naturezas,
      acertos_matematica
    } = req.body;

    if (!data) return res.redirect(`/simulados/${id}/editar`);

    let dia = await Dia.findOne({ where: { data } });
    if (!dia) dia = await Dia.create({ data });

    await Simulado.update(
      {
        dia_id: dia.id,
        tempo_total_minutos: tempo_total_minutos ? Number(tempo_total_minutos) : null,
        resultado_resumo: resultado_resumo || null,
        area_que_mais_errou: area_que_mais_errou || null,
        principal_dificuldade: principal_dificuldade || null,
        acertos_linguagens: acertos_linguagens !== "" ? Number(acertos_linguagens) : null,
        acertos_humanas: acertos_humanas !== "" ? Number(acertos_humanas) : null,
        acertos_naturezas: acertos_naturezas !== "" ? Number(acertos_naturezas) : null,
        acertos_matematica: acertos_matematica !== "" ? Number(acertos_matematica) : null
      },
      { where: { id } }
    );

    return res.redirect("/simulados");
  } catch (error) {
    console.error("❌ Erro ao atualizar simulado:", error);
    return res.status(500).send("Erro ao atualizar simulado.");
  }
}

// ===================================================================
// EXCLUIR SIMULADO
// ===================================================================
async function excluirSimulado(req, res) {
  try {
    await Simulado.destroy({ where: { id: req.params.id } });
    return res.redirect("/simulados");
  } catch (error) {
    console.error("❌ Erro ao excluir simulado:", error);
    return res.status(500).send("Erro ao excluir simulado.");
  }
}

// ===================================================================
// EXPORTAR CONTROLLER COMPLETO
// ===================================================================
module.exports = {
  novoSimuladoForm,
  criarSimulado,
  listarSimulados,
  detalheSimulado,
  editarSimuladoForm,
  atualizarSimulado,
  excluirSimulado
};
