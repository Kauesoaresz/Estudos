// controllers/diaController.js
//
// Controla:
// - Home (dashboard)
// - Registro diário (criar, listar, detalhar, editar, excluir)
// - Agora 100% filtrado por usuário (usuario_id)

const { Dia, Materia, EstudoMateriaDia, Simulado } = require("../models");
const {
  toISODate,
  diffDiasFromHoje,
  formatarDDMMYYYY
} = require("../utils/datas");
const { Op } = require("sequelize");

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
    const horas = d.horas_estudo_liquidas != null ? Number(d.horas_estudo_liquidas) : 0;
    const questoes = d.questoes_feitas_total != null ? Number(d.questoes_feitas_total) : 0;

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

function gerarInsightsDia(diaHoje, ultimosDias) {
  const insights = [];
  if (!diaHoje) return insights;

  const horasHoje =
    diaHoje.horas_estudo_liquidas != null
      ? Number(diaHoje.horas_estudo_liquidas)
      : 0;

  const sonoHoje =
    diaHoje.horas_sono_total != null
      ? Number(diaHoje.horas_sono_total)
      : 0;

  const focoHoje =
    diaHoje.nivel_foco != null ? Number(diaHoje.nivel_foco) : null;

  const energiaHoje =
    diaHoje.nivel_energia != null ? Number(diaHoje.nivel_energia) : null;

  const humorHoje = diaHoje.humor || null;

  const questoesHoje =
    diaHoje.questoes_feitas_total != null
      ? Number(diaHoje.questoes_feitas_total)
      : 0;

  const acertosHoje =
    diaHoje.questoes_acertos_total != null
      ? Number(diaHoje.questoes_acertos_total)
      : 0;

  const taxaAcertoHoje =
    questoesHoje > 0 ? Math.round((acertosHoje / questoesHoje) * 100) : null;

  // Média recente
  const diasComEstudoRecentes = ultimosDias.filter((d) => {
    const h = d.horas_estudo_liquidas != null ? Number(d.horas_estudo_liquidas) : 0;
    return h > 0;
  });

  let mediaHorasRecentes = 0;
  if (diasComEstudoRecentes.length > 0) {
    const somaHorasRecentes = diasComEstudoRecentes.reduce((acc, d) => {
      const h = d.horas_estudo_liquidas != null ? Number(d.horas_estudo_liquidas) : 0;
      return acc + h;
    }, 0);
    mediaHorasRecentes = somaHorasRecentes / diasComEstudoRecentes.length;
  }

  if (mediaHorasRecentes > 0) {
    if (horasHoje >= mediaHorasRecentes + 1) {
      insights.push("Você estudou acima da sua média recente — ótimo progresso.");
    } else if (horasHoje > 0 && horasHoje <= mediaHorasRecentes - 1) {
      insights.push("Você estudou menos do que a média recente. Tente compensar depois.");
    }
  }

  if (sonoHoje > 0 && sonoHoje < 6) {
    insights.push("Seu sono foi baixo hoje (menos de 6h). Isso prejudica foco.");
  } else if (sonoHoje >= 7.5) {
    insights.push("Você dormiu muito bem hoje. Isso favorece energia e foco.");
  }

  if (focoHoje != null) {
    if (focoHoje >= 8 && horasHoje > 0) {
      insights.push("Seu foco estava alto e você estudou. Aproveite dias assim.");
    } else if (focoHoje <= 4 && horasHoje > 0) {
      insights.push("Você estudou mesmo com foco baixo. Pode valer revisar esse conteúdo.");
    }
  }

  if (energiaHoje != null && energiaHoje <= 4 && horasHoje > 0) {
    insights.push("Sua energia estava baixa hoje. Veja se isso se repete.");
  }

  if (humorHoje === "ruim") {
    insights.push("Seu humor estava ruim hoje. Isso impacta nos estudos.");
  } else if (humorHoje === "bom" && horasHoje > 0) {
    insights.push("Humor bom + estudo = ótima combinação.");
  }

  if (questoesHoje >= 30 && taxaAcertoHoje >= 70) {
    insights.push(`Você fez ${questoesHoje} questões com ${taxaAcertoHoje}% de acerto!`);
  }

  return insights.slice(0, 3);
}

// ---------------------
// HOME (dashboard)
// ---------------------

async function home(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO

    const diasBrutos = await Dia.findAll({
      where: { usuario_id: usuarioId },
      order: [["data", "ASC"]],
      raw: true
    });

    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0, 10);

    let diaHoje = diasBrutos.find(d => toISODate(d.data) === hojeISO);

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
      if (dataLabel.includes("-")) {
        const [a, m, d] = dataLabel.split("-");
        dataLabel = `${d}/${m}`;
      }
      resumoHoje = {
        existe: true,
        dataLabel,
        horasEstudo: Number(diaHoje.horas_estudo_liquidas || 0),
        questoes: Number(diaHoje.questoes_feitas_total || 0),
        horasSono: diaHoje.horas_sono_total || null,
        foco: diaHoje.nivel_foco || null,
        energia: diaHoje.nivel_energia || null,
        humor: diaHoje.humor
      };
    }

    const diasUltimos7 = diasBrutos.filter(d => {
      const diff = diffDiasFromHoje(d.data);
      return diff >= 0 && diff <= 7;
    });

    const diasUltimos30 = diasBrutos.filter(d => {
      const diff = diffDiasFromHoje(d.data);
      return diff >= 0 && diff <= 30;
    });

    const resumo7 = agregaDias(diasUltimos7);
    const resumo30 = agregaDias(diasUltimos30);

    const diasOrdenados30 = [...diasUltimos30].sort((a, b) => a.data.localeCompare(b.data));

    const labels30 = diasOrdenados30.map(d => d.data.slice(8));
    const horas30 = diasOrdenados30.map(d => Number(d.horas_estudo_liquidas || 0));
    const questoes30 = diasOrdenados30.map(d => Number(d.questoes_feitas_total || 0));

    res.render("home", {
      tituloPagina: "Rastreador de Estudos",
      resumoHoje,
      resumo7,
      resumo30,
      labels30,
      horas30,
      questoes30
    });
  } catch (error) {
    console.error("❌ Erro na Home:", error);
    res.status(500).send("Erro ao carregar dashboard.");
  }
}

// ---------------------
// FORM
// ---------------------

function novoDiaForm(req, res) {
  const sucesso = req.query.sucesso === "1";
  res.render("dia_novo", {
    tituloPagina: "Registrar dia",
    sucesso
  });
}

// ---------------------
// CRIAR DIA
// ---------------------

async function criarDia(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO

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
      usuario_id: usuarioId,
      data,
      hora_acordou: hora_acordou || null,
      hora_dormiu: hora_dormiu || null,
      horas_sono_total: horas_sono_total || null,
      qualidade_sono_nota: qualidade_sono_nota || null,
      tirou_soneca: tirou_soneca === "SIM" ? true : tirou_soneca === "NAO" ? false : null,
      minutos_soneca: minutos_soneca || null,
      horas_estudo_liquidas: horas_estudo_liquidas || null,
      questoes_feitas_total: questoes_feitas_total || null,
      questoes_acertos_total: questoes_acertos_total || null,
      erros_do_dia: erros_do_dia || null,
      melhorar_amanha: melhorar_amanha || null,
      ponto_alto_dia: ponto_alto_dia || null,
      maior_vacilo_dia: maior_vacilo_dia || null,
      meta_principal_dia: meta_principal_dia || null,
      status_meta: status_meta || null,
      nivel_foco: nivel_foco || null,
      nivel_energia: nivel_energia || null,
      humor: humor || null
    });

    const { verificarMedalhas } = require("../services/medalhasService");
    const novasMedalhas = await verificarMedalhas(usuarioId);

    if (novasMedalhas.length > 0) {
      return res.render("medalha_nova", { novasMedalhas });
    }

    return res.redirect("/?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao criar dia:", error);
    return res.status(500).send("Erro ao salvar o dia.");
  }
}

// ---------------------
// HISTÓRICO
// ---------------------

async function listarDias(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO
    const { de, ate, somente_com_estudo } = req.query;

    let diasBrutos = await Dia.findAll({
      where: { usuario_id: usuarioId },
      order: [["data", "DESC"]],
      raw: true
    });

    diasBrutos = diasBrutos.map(d => {
      const dataFormatada = formatarDDMMYYYY(d.data);
      const taxaAcerto =
        d.questoes_feitas_total > 0 && d.questoes_acertos_total != null
          ? Math.round((d.questoes_acertos_total / d.questoes_feitas_total) * 100)
          : null;

      return {
        ...d,
        dataFormatada,
        taxaAcerto
      };
    });

    if (de) diasBrutos = diasBrutos.filter(d => d.data >= de);
    if (ate) diasBrutos = diasBrutos.filter(d => d.data <= ate);

    if (somente_com_estudo === "1") {
      diasBrutos = diasBrutos.filter(d => {
        const horas = Number(d.horas_estudo_liquidas || 0);
        const questoes = Number(d.questoes_feitas_total || 0);
        return horas > 0 || questoes > 0;
      });
    }

    res.render("dias_lista", {
      tituloPagina: "Histórico",
      dias: diasBrutos,
      de: de || "",
      ate: ate || "",
      somente_com_estudo
    });
  } catch (error) {
    console.error("❌ Erro ao listar dias:", error);
    res.status(500).send("Erro ao listar dias.");
  }
}

// ---------------------
// DETALHE DO DIA
// ---------------------

async function detalhesDia(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO
    const id = req.params.id;

    const dia = await Dia.findOne({
      where: { id, usuario_id: usuarioId },
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

    const ultimosDias = await Dia.findAll({
      where: {
        usuario_id: usuarioId,
        id: { [Op.ne]: id }
      },
      order: [["data", "DESC"]],
      limit: 10,
      raw: true
    });

    const insights = gerarInsightsDia(diaPlain, ultimosDias);

    res.render("dia_detalhe", {
      tituloPagina: "Detalhes do dia",
      dia: diaPlain,
      insights
    });
  } catch (error) {
    console.error("❌ Erro ao detalhar dia:", error);
    res.status(500).send("Erro ao carregar detalhes.");
  }
}

// ---------------------
// EDITAR DIA (FORM)
// ---------------------

async function editarDiaForm(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO
    const id = req.params.id;

    const dia = await Dia.findOne({
      where: { id, usuario_id: usuarioId },
      raw: true
    });

    if (!dia) {
      return res.status(404).send("Dia não encontrado.");
    }

    res.render("dia_editar", {
      tituloPagina: "Editar dia",
      dia
    });
  } catch (error) {
    console.error("❌ Erro ao carregar edição:", error);
    res.status(500).send("Erro ao carregar edição.");
  }
}

// ---------------------
// ATUALIZAR DIA
// ---------------------

async function atualizarDia(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO
    const id = req.params.id;

    const body = req.body;

    await Dia.update(
      {
        data: body.data,
        hora_acordou: body.hora_acordou || null,
        hora_dormiu: body.hora_dormiu || null,
        horas_sono_total: body.horas_sono_total || null,
        qualidade_sono_nota: body.qualidade_sono_nota || null,
        tirou_soneca: body.tirou_soneca === "SIM" ? true : body.tirou_soneca === "NAO" ? false : null,
        minutos_soneca: body.minutos_soneca || null,
        horas_estudo_liquidas: body.horas_estudo_liquidas || null,
        questoes_feitas_total: body.questoes_feitas_total || null,
        questoes_acertos_total: body.questoes_acertos_total || null,
        erros_do_dia: body.erros_do_dia || null,
        melhorar_amanha: body.melhorar_amanha || null,
        ponto_alto_dia: body.ponto_alto_dia || null,
        maior_vacilo_dia: body.maior_vacilo_dia || null,
        meta_principal_dia: body.meta_principal_dia || null,
        status_meta: body.status_meta || null,
        nivel_foco: body.nivel_foco || null,
        nivel_energia: body.nivel_energia || null,
        humor: body.humor || null
      },
      {
        where: { id, usuario_id: usuarioId }
      }
    );

    res.redirect("/dias");
  } catch (error) {
    console.error("❌ Erro ao atualizar dia:", error);
    res.status(500).send("Erro ao atualizar dia.");
  }
}

// ---------------------
// EXCLUIR DIA + estudos e simulados
// ---------------------

async function excluirDia(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO
    const id = req.params.id;

    await EstudoMateriaDia.destroy({
      where: { dia_id: id }
    });

    await Simulado.destroy({
      where: { dia_id: id }
    });

    await Dia.destroy({
      where: { id, usuario_id: usuarioId }
    });

    res.redirect("/dias");
  } catch (error) {
    console.error("❌ Erro ao excluir dia:", error);
    res.status(500).send("Erro ao excluir dia.");
  }
}

// ---------------------
// RECORDES
// ---------------------

async function recordesPessoais(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO

    const dias = await Dia.findAll({
      where: { usuario_id: usuarioId },
      raw: true
    });

    if (!dias.length) {
      return res.render("recordes", {
        tituloPagina: "Recordes pessoais",
        possuiDados: false
      });
    }

    const maiorHoras = Math.max(...dias.map(d => d.horas_estudo_liquidas || 0));
    const maiorQuestoes = Math.max(...dias.map(d => d.questoes_feitas_total || 0));

    const maiorAcerto = Math.max(
      ...dias.map(d => {
        if (d.questoes_feitas_total > 0 && d.questoes_acertos_total != null) {
          return Math.round(
            (d.questoes_acertos_total / d.questoes_feitas_total) * 100
          );
        }
        return 0;
      })
    );

    const maiorFoco = Math.max(...dias.map(d => d.nivel_foco || 0));
    const maiorEnergia = Math.max(...dias.map(d => d.nivel_energia || 0));

    const diasOrdenados = dias.sort((a, b) => a.data.localeCompare(b.data));

    let maiorSequencia = 0;
    let atual = 0;

    for (let d of diasOrdenados) {
      const h = d.horas_estudo_liquidas || 0;
      const q = d.questoes_feitas_total || 0;

      if (h > 0 || q > 0) {
        atual++;
        maiorSequencia = Math.max(maiorSequencia, atual);
      } else {
        atual = 0;
      }
    }

    res.render("recordes", {
      tituloPagina: "Recordes pessoais",
      possuiDados: true,
      maiorHoras,
      maiorQuestoes,
      maiorAcerto,
      maiorFoco,
      maiorEnergia,
      maiorSequencia
    });
  } catch (err) {
    console.error("Erro ao carregar recordes:", err);
    res.status(500).send("Erro.");
  }
}

// ---------------------
// CALENDÁRIO
// ---------------------

async function calendarioEstudos(req, res) {
  try {
    const usuarioId = req.session.usuario.id; //🔥 CORRIGIDO

    let ano = Number(req.query.ano);
    let mesIndex = Number(req.query.mes);

    const hoje = new Date();

    if (isNaN(ano) || isNaN(mesIndex)) {
      ano = hoje.getFullYear();
      mesIndex = hoje.getMonth();
    }

    const diasBD = await Dia.findAll({
      where: { usuario_id: usuarioId },
      raw: true
    });

    const inicio = new Date(ano, mesIndex, 1);
    const fim = new Date(ano, mesIndex + 1, 0);
    const totalDiasMes = fim.getDate();

    let diasMes = [];

    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const dataISO = `${ano}-${String(mesIndex + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

      const registro = diasBD.find(d => d.data === dataISO);

      const horas = registro ? Number(registro.horas_estudo_liquidas || 0) : 0;

      let cor = "zero";
      if (horas >= 8) cor = "h8";
      else if (horas >= 7) cor = "h7";
      else if (horas >= 6) cor = "h6";
      else if (horas >= 5) cor = "h5";
      else if (horas >= 4) cor = "h4";
      else if (horas >= 3) cor = "h3";
      else if (horas >= 2) cor = "h2";
      else if (horas >= 1) cor = "h1";

      diasMes.push({
        dia,
        dataISO,
        horas,
        cor,
        destaque: horas >= 8
      });
    }

    const nomesMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const mesAnterior = mesIndex === 0 ? 11 : mesIndex - 1;
    const anoAnterior = mesIndex === 0 ? ano - 1 : ano;

    const mesProximo = mesIndex === 11 ? 0 : mesIndex + 1;
    const anoProximo = mesIndex === 11 ? ano + 1 : ano;

    const totalHorasMes = diasMes.reduce((acc, d) => acc + d.horas, 0);
    const diasEstudados = diasMes.filter(d => d.horas > 0).length;
    const mediaDiaria = diasEstudados > 0 ? (totalHorasMes / diasEstudados) : 0;

    res.render("calendario", {
      tituloPagina: "Calendário de estudos",
      diasMes,
      mesLabel: `${nomesMeses[mesIndex]} de ${ano}`,
      possuiDados: diasBD.length > 0,
      anoAnterior,
      mesAnterior,
      anoProximo,
      mesProximo,
      totalHorasMes,
      diasEstudados,
      mediaDiaria: mediaDiaria.toFixed(1)
    });
  } catch (err) {
    console.error("Erro no calendário:", err);
    res.status(500).send("Erro ao carregar calendário.");
  }
}

// -------------------------------------------------
// EXPORTAR CONTROLLER
// -------------------------------------------------

module.exports = {
  home,
  novoDiaForm,
  criarDia,
  listarDias,
  detalhesDia,
  editarDiaForm,
  atualizarDia,
  excluirDia,
  recordesPessoais,
  calendarioEstudos
};
