// controllers/simuladoController.js
//
// Controla tudo relacionado aos SIMULADOS:
// - Form novo simulado
// - Criar simulado
// - Listar simulados + filtro por período
// - Detalhar simulado
// - Editar simulado
// - Atualizar simulado
// - Excluir simulado

const { Simulado, Dia } = require("../models");
const { toISODate, formatarDDMMYYYY } = require("../utils/datas");

// ---------------------
// FORM: NOVO SIMULADO
// ---------------------
function novoSimuladoForm(req, res) {
  const sucesso = req.query.sucesso === "1";
  const erro = req.query.erro === "1";

  res.render("simulado_novo", {
    tituloPagina: "Registrar simulado",
    sucesso,
    erro
  });
}

// ---------------------
// CRIAR SIMULADO
// ---------------------
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
    if (!dia) {
      dia = await Dia.create({ data });
    }

    await Simulado.create({
      dia_id: dia.id,
      tempo_total_minutos: tempo_total_minutos
        ? Number(tempo_total_minutos)
        : null,
      resultado_resumo: resultado_resumo || null,
      area_que_mais_errou: area_que_mais_errou || null,
      principal_dificuldade: principal_dificuldade || null,
      acertos_linguagens: acertos_linguagens
        ? Number(acertos_linguagens)
        : null,
      acertos_humanas: acertos_humanas
        ? Number(acertos_humanas)
        : null,
      acertos_naturezas: acertos_naturezas
        ? Number(acertos_naturezas)
        : null,
      acertos_matematica: acertos_matematica
        ? Number(acertos_matematica)
        : null
    });

    return res.redirect("/simulados/novo?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao salvar simulado:", error);
    return res
      .status(500)
      .send("Erro ao salvar simulado. Veja o console.");
  }
}

// ---------------------
// LISTAR SIMULADOS + FILTRO
// ---------------------
async function listarSimulados(req, res) {
  const { de, ate } = req.query;

  try {
    const simuladosBrutos = await Simulado.findAll({
      include: [
        {
          model: Dia,
          as: "dia",
          attributes: ["data"]
        }
      ],
      order: [["id", "DESC"]]
    });

    const simuladosProcessados = simuladosBrutos.map((s) => {
      const sim = s.get({ plain: true });

      let dataISO = sim.dia?.data;
      if (dataISO instanceof Date) {
        dataISO = toISODate(dataISO);
      }

      const dataFormatada = dataISO ? formatarDDMMYYYY(dataISO) : null;

      const acertosL = sim.acertos_linguagens || 0;
      const acertosH = sim.acertos_humanas || 0;
      const acertosN = sim.acertos_naturezas || 0;
      const acertosM = sim.acertos_matematica || 0;
      const totalAcertos = acertosL + acertosH + acertosN + acertosM;

      return {
        id: sim.id,
        dataISO: dataISO || null,
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

    if (de) {
      simulados = simulados.filter(
        (s) => s.dataISO && s.dataISO >= de
      );
    }
    if (ate) {
      simulados = simulados.filter(
        (s) => s.dataISO && s.dataISO <= ate
      );
    }

    res.render("simulados_lista", {
      tituloPagina: "Histórico de simulados",
      simulados,
      de: de || "",
      ate: ate || ""
    });
  } catch (error) {
    console.error("❌ Erro ao listar simulados:", error);
    return res
      .status(500)
      .send("Erro ao carregar simulados. Veja o console.");
  }
}

// ---------------------
// DETALHE DE UM SIMULADO
// ---------------------
async function detalheSimulado(req, res) {
  const id = req.params.id;
  try {
    const simulado = await Simulado.findByPk(id, {
      include: [{ model: Dia, as: "dia", attributes: ["data"] }]
    });

    if (!simulado) {
      return res.status(404).send("Simulado não encontrado.");
    }

    const sim = simulado.get({ plain: true });

    res.render("simulado_detalhe", {
      tituloPagina: "Detalhes do simulado",
      simulado: sim
    });
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes do simulado:", error);
    return res
      .status(500)
      .send("Erro ao carregar detalhes do simulado. Veja o console.");
  }
}

// ---------------------
// EDITAR SIMULADO (FORM)
// ---------------------
async function editarSimuladoForm(req, res) {
  const id = req.params.id;
  try {
    const simulado = await Simulado.findByPk(id, {
      include: [{ model: Dia, as: "dia", attributes: ["data"] }]
    });

    if (!simulado) {
      return res.status(404).send("Simulado não encontrado.");
    }

    const sim = simulado.get({ plain: true });

    res.render("simulado_editar", {
      tituloPagina: "Editar simulado",
      simulado: sim
    });
  } catch (error) {
    console.error("❌ Erro ao carregar simulado para edição:", error);
    return res
      .status(500)
      .send("Erro ao carregar simulado para edição. Veja o console.");
  }
}

// ---------------------
// ATUALIZAR SIMULADO
// ---------------------
async function atualizarSimulado(req, res) {
  const id = req.params.id;
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
      return res.redirect(`/simulados/${id}/editar`);
    }

    let dia = await Dia.findOne({ where: { data } });
    if (!dia) {
      dia = await Dia.create({ data });
    }

    await Simulado.update(
      {
        dia_id: dia.id,
        tempo_total_minutos: tempo_total_minutos
          ? Number(tempo_total_minutos)
          : null,
        resultado_resumo: resultado_resumo || null,
        area_que_mais_errou: area_que_mais_errou || null,
        principal_dificuldade: principal_dificuldade || null,
        acertos_linguagens: acertos_linguagens
          ? Number(acertos_linguagens)
          : null,
        acertos_humanas: acertos_humanas
          ? Number(acertos_humanas)
          : null,
        acertos_naturezas: acertos_naturezas
          ? Number(acertos_naturezas)
          : null,
        acertos_matematica: acertos_matematica
          ? Number(acertos_matematica)
          : null
      },
      { where: { id } }
    );

    return res.redirect("/simulados");
  } catch (error) {
    console.error("❌ Erro ao atualizar simulado:", error);
    return res
      .status(500)
      .send("Erro ao atualizar simulado. Veja o console.");
  }
}

// ---------------------
// EXCLUIR SIMULADO
// ---------------------
async function excluirSimulado(req, res) {
  const id = req.params.id;
  try {
    await Simulado.destroy({ where: { id } });
    return res.redirect("/simulados");
  } catch (error) {
    console.error("❌ Erro ao excluir simulado:", error);
    return res
      .status(500)
      .send("Erro ao excluir simulado. Veja o console.");
  }
}

module.exports = {
  novoSimuladoForm,
  criarSimulado,
  listarSimulados,
  detalheSimulado,
  editarSimuladoForm,
  atualizarSimulado,
  excluirSimulado
};
