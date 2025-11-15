// controllers/diaController.js
//
// Controla:
// - Home (dashboard)
// - Registro diário (criar, listar, detalhar, editar, excluir)

const { Dia, Materia, EstudoMateriaDia, Simulado } = require("../models");
const {
  toISODate,
  diffDiasFromHoje,
  formatarDDMMYYYY
} = require("../utils/datas");

// ---------------------
// Helpers internos
// ---------------------

function agregaDias(lista) {
  if (!lista.length) {
    return {
      totalDias: 0,
      diasComEstudo: 0,
      somaHoras: 0,
      mediaHoras: 0,
      somaQuestoes: 0,
      mediaQuestoes: 0
    };
  }

  let diasComEstudo = 0;
  let somaHoras = 0;
  let somaQuestoes = 0;

  lista.forEach((d) => {
    const horas =
      d.horas_estudo_liquidas != null ? Number(d.horas_estudo_liquidas) : 0;
    const questoes =
      d.questoes_feitas_total != null ? Number(d.questoes_feitas_total) : 0;

    if (horas > 0 || questoes > 0) diasComEstudo++;

    somaHoras += horas;
    somaQuestoes += questoes;
  });

  const mediaHoras = diasComEstudo ? somaHoras / diasComEstudo : 0;
  const mediaQuestoes = diasComEstudo ? somaQuestoes / diasComEstudo : 0;

  return {
    totalDias: lista.length,
    diasComEstudo,
    somaHoras,
    mediaHoras,
    somaQuestoes,
    mediaQuestoes
  };
}

// ---------------------
// EXPORT: funções do controller
// ---------------------

// Home = painel Hoje / 7d / 30d + gráficos (últimos 30 dias)
async function home(req, res) {
  try {
    const diasBrutos = await Dia.findAll({
      order: [["data", "ASC"]],
      raw: true
    });

    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0, 10);

    // Dia de hoje
    let diaHoje = null;
    for (const d of diasBrutos) {
      if (toISODate(d.data) === hojeISO) {
        diaHoje = d;
        break;
      }
    }

    let resumoHoje = {
      existe: false,
      dataLabel: null,
      horasEstudo: 0,
      questoes: 0,
      horasSono: null,
      foco: null,
      energia: null,
      humor: null
    };

    if (diaHoje) {
      let dataLabel = diaHoje.data;
      if (typeof dataLabel === "string" && dataLabel.includes("-")) {
        const [ano, mes, dia] = dataLabel.split("-");
        dataLabel = `${dia}/${mes}`;
      }
      resumoHoje = {
        existe: true,
        dataLabel,
        horasEstudo:
          diaHoje.horas_estudo_liquidas != null
            ? Number(diaHoje.horas_estudo_liquidas)
            : 0,
        questoes:
          diaHoje.questoes_feitas_total != null
            ? Number(diaHoje.questoes_feitas_total)
            : 0,
        horasSono:
          diaHoje.horas_sono_total != null
            ? Number(diaHoje.horas_sono_total)
            : null,
        foco:
          diaHoje.nivel_foco != null ? Number(diaHoje.nivel_foco) : null,
        energia:
          diaHoje.nivel_energia != null
            ? Number(diaHoje.nivel_energia)
            : null,
        humor: diaHoje.humor || null
      };
    }

    // Últimos 7 e 30 dias
    const diasUltimos7 = diasBrutos.filter((d) => {
      const iso = toISODate(d.data);
      const diff = diffDiasFromHoje(iso);
      return diff >= 0 && diff <= 7;
    });

    const diasUltimos30 = diasBrutos.filter((d) => {
      const iso = toISODate(d.data);
      const diff = diffDiasFromHoje(iso);
      return diff >= 0 && diff <= 30;
    });

    const resumo7 = agregaDias(diasUltimos7);
    const resumo30 = agregaDias(diasUltimos30);

    // Gráficos da home = últimos 30 dias
    const diasOrdenados30 = [...diasUltimos30].sort((a, b) => {
      const isoA = toISODate(a.data) || "";
      const isoB = toISODate(b.data) || "";
      if (isoA < isoB) return -1;
      if (isoA > isoB) return 1;
      return 0;
    });

    const labels30 = [];
    const horas30 = [];
    const questoes30 = [];

    diasOrdenados30.forEach((d) => {
      let label = d.data;
      if (typeof label === "string" && label.includes("-")) {
        const [ano, mes, dia] = label.split("-");
        label = `${dia}/${mes}`;
      }
      labels30.push(label);
      horas30.push(
        d.horas_estudo_liquidas != null
          ? Number(d.horas_estudo_liquidas)
          : 0
      );
      questoes30.push(
        d.questoes_feitas_total != null
          ? Number(d.questoes_feitas_total)
          : 0
      );
    });

    res.render("home", {
      tituloPagina: "Rastreador de Estudos do Kauê",
      resumoHoje,
      resumo7,
      resumo30,
      labels30,
      horas30,
      questoes30
    });
  } catch (error) {
    console.error("❌ Erro ao carregar dashboard da home:", error);
    res.render("home", {
      tituloPagina: "Rastreador de Estudos do Kauê",
      resumoHoje: {
        existe: false,
        dataLabel: null,
        horasEstudo: 0,
        questoes: 0,
        horasSono: null,
        foco: null,
        energia: null,
        humor: null
      },
      resumo7: {
        totalDias: 0,
        diasComEstudo: 0,
        somaHoras: 0,
        mediaHoras: 0,
        somaQuestoes: 0,
        mediaQuestoes: 0
      },
      resumo30: {
        totalDias: 0,
        diasComEstudo: 0,
        somaHoras: 0,
        mediaHoras: 0,
        somaQuestoes: 0,
        mediaQuestoes: 0
      },
      labels30: [],
      horas30: [],
      questoes30: []
    });
  }
}

// Form de novo dia
function novoDiaForm(req, res) {
  const sucesso = req.query.sucesso === "1";

  res.render("dia_novo", {
    tituloPagina: "Registrar dia",
    sucesso
  });
}

// Salvar novo dia
async function criarDia(req, res) {
  try {
    const {
      data,
      hora_acordou,
      hora_dormiu,
      horas_sono_total,
      qualidade_sono_nota,
      tirou_soneca,
      minutos_soneca,
      horas_estudo_liquidas,
      questoes_feitas_total,
      questoes_acertos_total,
      erros_do_dia,
      melhorar_amanha,
      ponto_alto_dia,
      maior_vacilo_dia,
      meta_principal_dia,
      status_meta,
      nivel_foco,
      nivel_energia,
      humor
    } = req.body;

    if (!data) {
      return res.status(400).send("Data é obrigatória.");
    }

    await Dia.create({
      data,
      hora_acordou: hora_acordou || null,
      hora_dormiu: hora_dormiu || null,
      horas_sono_total: horas_sono_total ? Number(horas_sono_total) : null,
      qualidade_sono_nota: qualidade_sono_nota
        ? Number(qualidade_sono_nota)
        : null,
      tirou_soneca:
        tirou_soneca === "" || tirou_soneca === undefined
          ? null
          : tirou_soneca === "SIM",
      minutos_soneca: minutos_soneca ? Number(minutos_soneca) : null,
      horas_estudo_liquidas: horas_estudo_liquidas
        ? Number(horas_estudo_liquidas)
        : null,
      questoes_feitas_total: questoes_feitas_total
        ? Number(questoes_feitas_total)
        : null,
      questoes_acertos_total: questoes_acertos_total
        ? Number(questoes_acertos_total)
        : null,
      erros_do_dia: erros_do_dia || null,
      melhorar_amanha: melhorar_amanha || null,
      ponto_alto_dia: ponto_alto_dia || null,
      maior_vacilo_dia: maior_vacilo_dia || null,
      meta_principal_dia: meta_principal_dia || null,
      status_meta: status_meta || null,
      nivel_foco: nivel_foco ? Number(nivel_foco) : null,
      nivel_energia: nivel_energia ? Number(nivel_energia) : null,
      humor: humor || null
    });

    return res.redirect("/dia/novo?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao salvar dia:", error);
    return res
      .status(500)
      .send("Erro ao salvar o dia. Veja o console para mais detalhes.");
  }
}

// Histórico de dias (resumo) + filtro
async function listarDias(req, res) {
  const { de, ate, somente_com_estudo } = req.query;

  try {
    const diasBrutos = await Dia.findAll({
      order: [["data", "DESC"]],
      raw: true
    });

    const diasProcessados = diasBrutos.map((d) => {
      let dataFormatada = d.data;
      if (typeof d.data === "string" && d.data.includes("-")) {
        dataFormatada = formatarDDMMYYYY(d.data);
      }

      let taxaAcerto = null;
      if (
        d.questoes_feitas_total &&
        d.questoes_acertos_total != null &&
        d.questoes_feitas_total > 0
      ) {
        taxaAcerto = Math.round(
          (d.questoes_acertos_total / d.questoes_feitas_total) * 100
        );
      }

      return {
        ...d,
        id: d.id,
        dataFormatada,
        taxaAcerto
      };
    });

    // remove dias completamente vazios
    let dias = diasProcessados.filter((d) => {
      const semHoras = d.horas_estudo_liquidas == null;
      const semQuestoes =
        d.questoes_feitas_total == null && d.questoes_acertos_total == null;
      const semFocoEnergia =
        d.nivel_foco == null && d.nivel_energia == null;
      const semHumorMeta = !d.humor && !d.status_meta;

      const diaVazio =
        semHoras && semQuestoes && semFocoEnergia && semHumorMeta;

      return !diaVazio;
    });

    // filtro por data (string YYYY-MM-DD compara certinho)
    if (de) {
      dias = dias.filter((d) => d.data >= de);
    }
    if (ate) {
      dias = dias.filter((d) => d.data <= ate);
    }

    // filtro: apenas dias com estudo (horas ou questões)
    if (somente_com_estudo === "1") {
      dias = dias.filter((d) => {
        const horas =
          d.horas_estudo_liquidas != null
            ? Number(d.horas_estudo_liquidas)
            : 0;
        const quest =
          d.questoes_feitas_total != null
            ? Number(d.questoes_feitas_total)
            : 0;
        return horas > 0 || quest > 0;
      });
    }

    res.render("dias_lista", {
      tituloPagina: "Histórico de dias",
      dias,
      de: de || "",
      ate: ate || "",
      somente_com_estudo: somente_com_estudo || ""
    });
  } catch (error) {
    console.error("❌ Erro ao listar dias:", error);
    return res
      .status(500)
      .send("Erro ao carregar histórico de dias. Veja o console.");
  }
}

// Detalhe de um dia
async function detalhesDia(req, res) {
  const id = req.params.id;
  try {
    const dia = await Dia.findByPk(id, {
      include: [
        {
          model: EstudoMateriaDia,
          as: "estudos_materias",
          include: [{ model: Materia, as: "materia", attributes: ["nome"] }]
        },
        {
          model: Simulado,
          as: "simulados"
        }
      ]
    });

    if (!dia) {
      return res.status(404).send("Dia não encontrado.");
    }

    const diaPlain = dia.get({ plain: true });
    res.render("dia_detalhe", {
      tituloPagina: "Detalhes do dia",
      dia: diaPlain
    });
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes do dia:", error);
    return res
      .status(500)
      .send("Erro ao carregar detalhes do dia. Veja o console.");
  }
}

// Editar dia (form)
async function editarDiaForm(req, res) {
  const id = req.params.id;
  try {
    const dia = await Dia.findByPk(id, { raw: true });
    if (!dia) {
      return res.status(404).send("Dia não encontrado.");
    }

    res.render("dia_editar", {
      tituloPagina: "Editar dia",
      dia
    });
  } catch (error) {
    console.error("❌ Erro ao carregar dia para edição:", error);
    return res
      .status(500)
      .send("Erro ao carregar dia para edição. Veja o console.");
  }
}

// Atualizar dia
async function atualizarDia(req, res) {
  const id = req.params.id;
  try {
    const {
      data,
      hora_acordou,
      hora_dormiu,
      horas_sono_total,
      qualidade_sono_nota,
      tirou_soneca,
      minutos_soneca,
      horas_estudo_liquidas,
      questoes_feitas_total,
      questoes_acertos_total,
      erros_do_dia,
      melhorar_amanha,
      ponto_alto_dia,
      maior_vacilo_dia,
      meta_principal_dia,
      status_meta,
      nivel_foco,
      nivel_energia,
      humor
    } = req.body;

    if (!data) {
      return res.status(400).send("Data é obrigatória.");
    }

    await Dia.update(
      {
        data,
        hora_acordou: hora_acordou || null,
        hora_dormiu: hora_dormiu || null,
        horas_sono_total: horas_sono_total ? Number(horas_sono_total) : null,
        qualidade_sono_nota: qualidade_sono_nota
          ? Number(qualidade_sono_nota)
          : null,
        tirou_soneca:
          tirou_soneca === "" || tirou_soneca === undefined
            ? null
            : tirou_soneca === "SIM",
        minutos_soneca: minutos_soneca ? Number(minutos_soneca) : null,
        horas_estudo_liquidas: horas_estudo_liquidas
          ? Number(horas_estudo_liquidas)
          : null,
        questoes_feitas_total: questoes_feitas_total
          ? Number(questoes_feitas_total)
          : null,
        questoes_acertos_total: questoes_acertos_total
          ? Number(questoes_acertos_total)
          : null,
        erros_do_dia: erros_do_dia || null,
        melhorar_amanha: melhorar_amanha || null,
        ponto_alto_dia: ponto_alto_dia || null,
        maior_vacilo_dia: maior_vacilo_dia || null,
        meta_principal_dia: meta_principal_dia || null,
        status_meta: status_meta || null,
        nivel_foco: nivel_foco ? Number(nivel_foco) : null,
        nivel_energia: nivel_energia ? Number(nivel_energia) : null,
        humor: humor || null
      },
      { where: { id } }
    );

    return res.redirect("/dias");
  } catch (error) {
    console.error("❌ Erro ao atualizar dia:", error);
    return res
      .status(500)
      .send("Erro ao atualizar o dia. Veja o console.");
  }
}

// Excluir dia (apaga também estudos/simulados ligados)
async function excluirDia(req, res) {
  const id = req.params.id;
  try {
    await EstudoMateriaDia.destroy({ where: { dia_id: id } });
    await Simulado.destroy({ where: { dia_id: id } });
    await Dia.destroy({ where: { id } });
    return res.redirect("/dias");
  } catch (error) {
    console.error("❌ Erro ao excluir dia:", error);
    return res
      .status(500)
      .send("Erro ao excluir o dia. Veja o console.");
  }
}

module.exports = {
  home,
  novoDiaForm,
  criarDia,
  listarDias,
  detalhesDia,
  editarDiaForm,
  atualizarDia,
  excluirDia
};
