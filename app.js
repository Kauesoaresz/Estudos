const express = require("express");
const path = require("path");
const db = require("./models"); // Dia, Materia, EstudoMateriaDia, Simulado

const app = express();

// Pega os models que vamos usar
const { Dia, Materia, EstudoMateriaDia, Simulado } = db;

// Configura a engine de visualização (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "public")));

// Middleware para ler dados de formulários (POST)
app.use(express.urlencoded({ extended: true }));

// Teste de conexão com o banco e sync dos models
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Conexao com o banco estabelecida com sucesso.");

    await db.sequelize.sync();
    console.log("✅ Models sincronizados com o banco (tabelas criadas/atualizadas).");
  } catch (error) {
    console.error("❌ Erro ao conectar ou sincronizar com o banco:", error.message);
  }
})();

// ---------------------
// FUNÇÕES DE APOIO (datas)
// ---------------------

function toISODate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return null;
}

// ---------------------
// HOME = painel Hoje / 7d / 30d + gráficos (últimos 30 dias)
// ---------------------

app.get("/", async (req, res) => {
  try {
    const diasBrutos = await Dia.findAll({
      order: [["data", "ASC"]],
      raw: true
    });

    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0, 10);

    function diffDiasFromHoje(isoStr) {
      if (!isoStr || !isoStr.includes("-")) return Number.POSITIVE_INFINITY;
      const [ano, mes, dia] = isoStr.split("-");
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
      const hojeMid = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
      );
      const dataMid = new Date(
        dataObj.getFullYear(),
        dataObj.getMonth(),
        dataObj.getDate()
      );
      const diffMs = hojeMid - dataMid;
      return diffMs / (1000 * 60 * 60 * 24);
    }

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
          d.horas_estudo_liquidas != null
            ? Number(d.horas_estudo_liquidas)
            : 0;
        const questoes =
          d.questoes_feitas_total != null
            ? Number(d.questoes_feitas_total)
            : 0;

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
});

// ---------------------
// DIA (registro diário)
// ---------------------

// Form de novo dia
app.get("/dia/novo", (req, res) => {
  const sucesso = req.query.sucesso === "1";

  res.render("dia_novo", {
    tituloPagina: "Registrar dia",
    sucesso
  });
});

// Salvar novo dia
app.post("/dia", async (req, res) => {
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
});

// Histórico de dias (resumo) + filtro
app.get("/dias", async (req, res) => {
  const { de, ate, somente_com_estudo } = req.query;

  try {
    const diasBrutos = await Dia.findAll({
      order: [["data", "DESC"]],
      raw: true
    });

    const diasProcessados = diasBrutos.map((d) => {
      let dataFormatada = d.data;
      if (typeof d.data === "string" && d.data.includes("-")) {
        const [ano, mes, dia] = d.data.split("-");
        dataFormatada = `${dia}/${mes}/${ano}`;
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
});

// Detalhe de um dia
app.get("/dias/:id", async (req, res) => {
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
});

// Editar dia (form)
app.get("/dias/:id/editar", async (req, res) => {
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
});

// Atualizar dia
app.post("/dias/:id/atualizar", async (req, res) => {
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
});

// Excluir dia (apaga também estudos/simulados ligados)
app.post("/dias/:id/excluir", async (req, res) => {
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
});

// ---------------------
// MATÉRIAS
// ---------------------

// Listar matérias + criar
app.get("/materias", async (req, res) => {
  try {
    const sucesso = req.query.sucesso === "1";
    const erro = req.query.erro === "1";
    const erroExcluir = req.query.erroExcluir === "1";

    const materias = await Materia.findAll({
      order: [["nome", "ASC"]],
      raw: true
    });

    res.render("materias_lista", {
      tituloPagina: "Matérias",
      materias,
      sucesso,
      erro,
      erroExcluir
    });
  } catch (error) {
    console.error("❌ Erro ao listar materias:", error);
    return res
      .status(500)
      .send("Erro ao carregar matérias. Veja o console para mais detalhes.");
  }
});

app.post("/materias", async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.redirect("/materias?erro=1");
    }

    await Materia.create({
      nome: nome.trim()
    });

    return res.redirect("/materias?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao criar materia:", error);
    return res
      .status(500)
      .send("Erro ao criar matéria. Veja o console para mais detalhes.");
  }
});

// Detalhe da matéria (com resumo simples)
app.get("/materias/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const materia = await Materia.findByPk(id, {
      include: [
        {
          model: EstudoMateriaDia,
          as: "estudos",
          include: [{ model: Dia, as: "dia", attributes: ["data"] }]
        }
      ]
    });

    if (!materia) {
      return res.status(404).send("Matéria não encontrada.");
    }

    const mat = materia.get({ plain: true });

    let totalMinutos = 0;
    let totalQuestoes = 0;
    let totalCertas = 0;
    const diasSet = new Set();

    (mat.estudos || []).forEach((e) => {
      if (e.minutos_estudados != null) {
        totalMinutos += Number(e.minutos_estudados);
      }
      if (e.questoes_feitas != null) {
        totalQuestoes += Number(e.questoes_feitas);
      }
      if (e.questoes_certas != null) {
        totalCertas += Number(e.questoes_certas);
      }
      if (e.dia && e.dia.data) {
        diasSet.add(e.dia.data.toString());
      }
    });

    const horasTotais = totalMinutos / 60;
    const diasEstudados = diasSet.size;
    const taxaAcerto =
      totalQuestoes > 0
        ? Math.round((totalCertas / totalQuestoes) * 100)
        : null;

    res.render("materia_detalhe", {
      tituloPagina: "Detalhes da matéria",
      materia: mat,
      resumo: {
        horasTotais,
        totalMinutos,
        diasEstudados,
        totalQuestoes,
        totalCertas,
        taxaAcerto
      }
    });
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes da matéria:", error);
    return res
      .status(500)
      .send("Erro ao carregar detalhes da matéria. Veja o console.");
  }
});

// Editar matéria
app.get("/materias/:id/editar", async (req, res) => {
  const id = req.params.id;
  try {
    const materia = await Materia.findByPk(id, { raw: true });
    if (!materia) {
      return res.status(404).send("Matéria não encontrada.");
    }

    res.render("materia_editar", {
      tituloPagina: "Editar matéria",
      materia
    });
  } catch (error) {
    console.error("❌ Erro ao carregar matéria para edição:", error);
    return res
      .status(500)
      .send("Erro ao carregar matéria. Veja o console.");
  }
});

app.post("/materias/:id/atualizar", async (req, res) => {
  const id = req.params.id;
  try {
    const { nome } = req.body;
    if (!nome || !nome.trim()) {
      return res.redirect(`/materias/${id}/editar`);
    }

    await Materia.update({ nome: nome.trim() }, { where: { id } });

    return res.redirect("/materias");
  } catch (error) {
    console.error("❌ Erro ao atualizar matéria:", error);
    return res
      .status(500)
      .send("Erro ao atualizar matéria. Veja o console.");
  }
});

// Excluir matéria (só se não tiver estudos)
app.post("/materias/:id/excluir", async (req, res) => {
  const id = req.params.id;
  try {
    const count = await EstudoMateriaDia.count({ where: { materia_id: id } });
    if (count > 0) {
      return res.redirect("/materias?erroExcluir=1");
    }

    await Materia.destroy({ where: { id } });
    return res.redirect("/materias");
  } catch (error) {
    console.error("❌ Erro ao excluir matéria:", error);
    return res
      .status(500)
      .send("Erro ao excluir matéria. Veja o console.");
  }
});

// ---------------------
// ESTUDO POR MATÉRIA
// ---------------------

// Form de novo estudo
app.get("/estudos/novo", async (req, res) => {
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
    console.error("❌ Erro ao carregar formulario de estudo:", error);
    return res
      .status(500)
      .send("Erro ao carregar formulário de estudo. Veja o console.");
  }
});

// Salvar estudo por matéria
app.post("/estudos", async (req, res) => {
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
    console.error("❌ Erro ao salvar estudo por materia:", error);
    return res
      .status(500)
      .send("Erro ao salvar estudo por matéria. Veja o console.");
  }
});

// Histórico de estudos por matéria + filtro
app.get("/estudos", async (req, res) => {
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
        dataISO = dataISO.toISOString().slice(0, 10);
      }

      let dataFormatada = dataISO;
      if (
        typeof dataFormatada === "string" &&
        dataFormatada.includes("-")
      ) {
        const [ano, mes, dia] = dataFormatada.split("-");
        dataFormatada = `${dia}/${mes}/${ano}`;
      }

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
        dataISO: dataISO || null,
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

    let estudos = estudosProcessados;

    if (de) {
      estudos = estudos.filter(
        (e) => e.dataISO && e.dataISO >= de
      );
    }
    if (ate) {
      estudos = estudos.filter(
        (e) => e.dataISO && e.dataISO <= ate
      );
    }
    if (materia_id) {
      estudos = estudos.filter(
        (e) =>
          e.materiaId &&
          String(e.materiaId) === String(materia_id)
      );
    }

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
    return res
      .status(500)
      .send("Erro ao carregar histórico de estudos. Veja o console.");
  }
});

// Detalhe de um estudo
app.get("/estudos/:id", async (req, res) => {
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
    return res
      .status(500)
      .send("Erro ao carregar detalhes do estudo. Veja o console.");
  }
});

// Editar estudo
app.get("/estudos/:id/editar", async (req, res) => {
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
    return res
      .status(500)
      .send("Erro ao carregar estudo. Veja o console.");
  }
});

// Atualizar estudo
app.post("/estudos/:id/atualizar", async (req, res) => {
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

    // garante que o dia existe
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
    return res
      .status(500)
      .send("Erro ao atualizar estudo. Veja o console.");
  }
});

// Excluir estudo
app.post("/estudos/:id/excluir", async (req, res) => {
  const id = req.params.id;
  try {
    await EstudoMateriaDia.destroy({ where: { id } });
    return res.redirect("/estudos");
  } catch (error) {
    console.error("❌ Erro ao excluir estudo:", error);
    return res
      .status(500)
      .send("Erro ao excluir estudo. Veja o console.");
  }
});

// ---------------------
// SIMULADOS
// ---------------------

// Form de novo simulado
app.get("/simulados/novo", (req, res) => {
  const sucesso = req.query.sucesso === "1";
  const erro = req.query.erro === "1";

  res.render("simulado_novo", {
    tituloPagina: "Registrar simulado",
    sucesso,
    erro
  });
});

// Salvar simulado
app.post("/simulados", async (req, res) => {
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
});

// Lista de simulados + filtro
app.get("/simulados", async (req, res) => {
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
        dataISO = dataISO.toISOString().slice(0, 10);
      }

      let dataFormatada = dataISO;
      if (
        typeof dataFormatada === "string" &&
        dataFormatada.includes("-")
      ) {
        const [ano, mes, dia] = dataFormatada.split("-");
        dataFormatada = `${dia}/${mes}/${ano}`;
      }

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
});

// Detalhe de simulado
app.get("/simulados/:id", async (req, res) => {
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
});

// Editar simulado (form)
app.get("/simulados/:id/editar", async (req, res) => {
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
});

// Atualizar simulado
app.post("/simulados/:id/atualizar", async (req, res) => {
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
});

// Excluir simulado
app.post("/simulados/:id/excluir", async (req, res) => {
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
});

// ---------------------
// ESTATÍSTICAS POR MATÉRIA (COM PERÍODO)
// ---------------------

app.get("/estatisticas/materias", async (req, res) => {
  const periodo = req.query.periodo || "30d"; // 7d, 30d ou todos

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
      ]
    });

    const hoje = new Date();

    const estudosPlain = estudosBrutos.map((e) => e.get({ plain: true }));

    const estudosFiltrados = estudosPlain.filter((est) => {
      if (periodo === "todos") return true;

      if (!est.dia || !est.dia.data) return false;

      let dataStr;
      if (est.dia.data instanceof Date) {
        dataStr = est.dia.data.toISOString().slice(0, 10);
      } else {
        dataStr = est.dia.data;
      }

      if (!dataStr || typeof dataStr !== "string" || !dataStr.includes("-")) {
        return false;
      }

      const [ano, mes, dia] = dataStr.split("-");
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));

      const diffMs = hoje - dataObj;
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      const limiteDias = periodo === "7d" ? 7 : 30;

      return diffDias >= 0 && diffDias <= limiteDias;
    });

    if (!estudosFiltrados.length) {
      return res.render("estatisticas_materias", {
        tituloPagina: "Estatísticas por matéria",
        materiasStats: [],
        labels: [],
        horasDataset: [],
        questoesDataset: [],
        periodo
      });
    }

    const mapa = new Map();

    estudosFiltrados.forEach((est) => {
      const mat = est.materia;
      if (!mat) return;

      const key = mat.id;

      if (!mapa.has(key)) {
        mapa.set(key, {
          materiaId: mat.id,
          materiaNome: mat.nome,
          totalMinutos: 0,
          totalQuestoes: 0,
          totalCertas: 0,
          diasSet: new Set(),
          estudosCount: 0
        });
      }

      const item = mapa.get(key);
      item.estudosCount++;

      if (est.minutos_estudados != null) {
        item.totalMinutos += Number(est.minutos_estudados);
      }
      if (est.questoes_feitas != null) {
        item.totalQuestoes += Number(est.questoes_feitas);
      }
      if (est.questoes_certas != null) {
        item.totalCertas += Number(est.questoes_certas);
      }
      if (est.dia && est.dia.data) {
        item.diasSet.add(est.dia.data.toString());
      }
    });

    let materiasStats = Array.from(mapa.values()).map((item) => {
      const totalDias = item.diasSet.size;
      const horasTotais = item.totalMinutos / 60;
      const mediaMinutosPorDia = totalDias
        ? item.totalMinutos / totalDias
        : 0;
      const taxaAcerto =
        item.totalQuestoes > 0
          ? Math.round((item.totalCertas / item.totalQuestoes) * 100)
          : null;

      return {
        materiaId: item.materiaId,
        materiaNome: item.materiaNome,
        totalMinutos: item.totalMinutos,
        horasTotais,
        totalQuestoes: item.totalQuestoes,
        totalCertas: item.totalCertas,
        totalDias,
        estudosCount: item.estudosCount,
        mediaMinutosPorDia,
        taxaAcerto
      };
    });

    materiasStats.sort((a, b) => b.horasTotais - a.horasTotais);

    const labels = materiasStats.map((m) => m.materiaNome);
    const horasDataset = materiasStats.map((m) =>
      Number(m.horasTotais.toFixed(2))
    );
    const questoesDataset = materiasStats.map((m) => m.totalQuestoes);

    res.render("estatisticas_materias", {
      tituloPagina: "Estatísticas por matéria",
      materiasStats,
      labels,
      horasDataset,
      questoesDataset,
      periodo
    });
  } catch (error) {
    console.error("❌ Erro ao carregar estatísticas por matéria:", error);
    return res
      .status(500)
      .send("Erro ao carregar estatísticas por matéria. Veja o console.");
  }
});

// ---------------------
// ESTATÍSTICAS DE SIMULADOS (COM PERÍODO)
// ---------------------

app.get("/estatisticas/simulados", async (req, res) => {
  const periodo = req.query.periodo || "30d"; // 7d, 30d ou todos

  try {
    const simuladosBrutos = await Simulado.findAll({
      include: [
        {
          model: Dia,
          as: "dia",
          attributes: ["data"]
        }
      ],
      order: [
        [{ model: Dia, as: "dia" }, "data", "ASC"],
        ["id", "ASC"]
      ]
    });

    if (!simuladosBrutos.length) {
      return res.render("estatisticas_simulados", {
        tituloPagina: "Estatísticas de simulados",
        totalSimulados: 0,
        mediaLinguagens: 0,
        mediaHumanas: 0,
        mediaNaturezas: 0,
        mediaMatematica: 0,
        melhorTotal: null,
        piorTotal: null,
        labelsJSON: JSON.stringify([]),
        totalDatasetJSON: JSON.stringify([]),
        mediasPorAreaLabelsJSON: JSON.stringify([
          "Linguagens",
          "Humanas",
          "Naturezas",
          "Matemática"
        ]),
        mediasPorAreaValoresJSON: JSON.stringify([0, 0, 0, 0]),
        periodo
      });
    }

    const hoje = new Date();
    const simuladosPlain = simuladosBrutos.map((s) => s.get({ plain: true }));

    const simuladosFiltrados = simuladosPlain.filter((sim) => {
      if (periodo === "todos") return true;

      if (!sim.dia || !sim.dia.data) return false;

      let dataStr;
      if (sim.dia.data instanceof Date) {
        dataStr = sim.dia.data.toISOString().slice(0, 10);
      } else {
        dataStr = sim.dia.data;
      }

      if (!dataStr || typeof dataStr !== "string" || !dataStr.includes("-")) {
        return false;
      }

      const [ano, mes, dia] = dataStr.split("-");
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));

      const diffMs = hoje - dataObj;
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      const limiteDias = periodo === "7d" ? 7 : 30;

      return diffDias >= 0 && diffDias <= limiteDias;
    });

    if (!simuladosFiltrados.length) {
      return res.render("estatisticas_simulados", {
        tituloPagina: "Estatísticas de simulados",
        totalSimulados: 0,
        mediaLinguagens: 0,
        mediaHumanas: 0,
        mediaNaturezas: 0,
        mediaMatematica: 0,
        melhorTotal: null,
        piorTotal: null,
        labelsJSON: JSON.stringify([]),
        totalDatasetJSON: JSON.stringify([]),
        mediasPorAreaLabelsJSON: JSON.stringify([
          "Linguagens",
          "Humanas",
          "Naturezas",
          "Matemática"
        ]),
        mediasPorAreaValoresJSON: JSON.stringify([0, 0, 0, 0]),
        periodo
      });
    }

    const labels = [];
    const totalDataset = [];

    let totalSimulados = simuladosFiltrados.length;

    let somaL = 0;
    let somaH = 0;
    let somaN = 0;
    let somaM = 0;

    let melhorTotal = null;
    let piorTotal = null;

    simuladosFiltrados.forEach((sim) => {
      let dataLabel = sim.dia?.data;
      if (typeof dataLabel === "string" && dataLabel.includes("-")) {
        const [ano, mes, dia] = dataLabel.split("-");
        dataLabel = `${dia}/${mes}`;
      }

      const L = sim.acertos_linguagens || 0;
      const H = sim.acertos_humanas || 0;
      const N = sim.acertos_naturezas || 0;
      const M = sim.acertos_matematica || 0;
      const totalAcertos = L + H + N + M;

      labels.push(dataLabel);
      totalDataset.push(totalAcertos);

      somaL += L;
      somaH += H;
      somaN += N;
      somaM += M;

      if (melhorTotal === null || totalAcertos > melhorTotal) {
        melhorTotal = totalAcertos;
      }
      if (piorTotal === null || totalAcertos < piorTotal) {
        piorTotal = totalAcertos;
      }
    });

    const mediaLinguagens = somaL / totalSimulados;
    const mediaHumanas = somaH / totalSimulados;
    const mediaNaturezas = somaN / totalSimulados;
    const mediaMatematica = somaM / totalSimulados;

    const mediasPorAreaLabels = [
      "Linguagens",
      "Humanas",
      "Naturezas",
      "Matemática"
    ];
    const mediasPorAreaValores = [
      Number(mediaLinguagens.toFixed(2)),
      Number(mediaHumanas.toFixed(2)),
      Number(mediaNaturezas.toFixed(2)),
      Number(mediaMatematica.toFixed(2))
    ];

    res.render("estatisticas_simulados", {
      tituloPagina: "Estatísticas de simulados",
      totalSimulados,
      mediaLinguagens,
      mediaHumanas,
      mediaNaturezas,
      mediaMatematica,
      melhorTotal,
      piorTotal,
      labelsJSON: JSON.stringify(labels),
      totalDatasetJSON: JSON.stringify(totalDataset),
      mediasPorAreaLabelsJSON: JSON.stringify(mediasPorAreaLabels),
      mediasPorAreaValoresJSON: JSON.stringify(mediasPorAreaValores),
      periodo
    });
  } catch (error) {
    console.error("❌ Erro ao carregar estatísticas de simulados:", error);
    return res
      .status(500)
      .send("Erro ao carregar estatísticas de simulados. Veja o console.");
  }
});

// ---------------------
// ESTATÍSTICAS DOS DIAS (JÁ COM PERÍODO)
// ---------------------

app.get("/estatisticas/dias", async (req, res) => {
  const periodo = req.query.periodo || "30d"; // 7d, 30d ou todos

  try {
    const diasBrutos = await Dia.findAll({
      order: [["data", "ASC"]],
      raw: true
    });

    const hoje = new Date();
    let diasFiltrados = diasBrutos;

    if (periodo === "7d" || periodo === "30d") {
      const limiteDias = periodo === "7d" ? 7 : 30;

      diasFiltrados = diasBrutos.filter((d) => {
        let dataStr;

        if (d.data instanceof Date) {
          dataStr = d.data.toISOString().slice(0, 10);
        } else {
          dataStr = d.data;
        }

        if (!dataStr || typeof dataStr !== "string" || !dataStr.includes("-")) {
          return false;
        }

        const [ano, mes, dia] = dataStr.split("-");
        const dataObj = new Date(
          Number(ano),
          Number(mes) - 1,
          Number(dia)
        );

        const diffMs = hoje - dataObj;
        const diffDias = diffMs / (1000 * 60 * 60 * 24);

        return diffDias >= 0 && diffDias <= limiteDias;
      });
    }

    const totalDias = diasFiltrados.length;

    if (!totalDias) {
      return res.render("estatisticas_dias", {
        tituloPagina: "Estatísticas dos dias",
        totalDias: 0,
        diasComEstudo: 0,
        somaHorasEstudo: 0,
        mediaHorasEstudo: 0,
        somaQuestoes: 0,
        mediaQuestoesPorDia: 0,
        mediaHorasSono: 0,
        mediaQualidadeSono: 0,
        diasComSoneca: 0,
        mediaFoco: 0,
        mediaEnergia: 0,
        countHumorBom: 0,
        countHumorOk: 0,
        countHumorRuim: 0,
        labelsJSON: JSON.stringify([]),
        horasEstudoDatasetJSON: JSON.stringify([]),
        questoesDatasetJSON: JSON.stringify([]),
        focoDatasetJSON: JSON.stringify([]),
        energiaDatasetJSON: JSON.stringify([]),
        sonoDatasetJSON: JSON.stringify([]),
        humorLabelsJSON: JSON.stringify(["Bom", "OK", "Ruim"]),
        humorValoresJSON: JSON.stringify([0, 0, 0]),
        periodo
      });
    }

    let diasComEstudo = 0;
    let somaHorasEstudo = 0;
    let somaQuestoes = 0;

    let somaHorasSono = 0;
    let contaSono = 0;
    let somaQualidadeSono = 0;
    let contaQualidadeSono = 0;
    let diasComSoneca = 0;

    let somaFoco = 0;
    let contaFoco = 0;
    let somaEnergia = 0;
    let contaEnergia = 0;

    let countHumorBom = 0;
    let countHumorOk = 0;
    let countHumorRuim = 0;

    const labels = [];
    const horasEstudoDataset = [];
    const questoesDataset = [];
    const focoDataset = [];
    const energiaDataset = [];
    const sonoDataset = [];

    diasFiltrados.forEach((d) => {
      let label = d.data;
      if (typeof d.data === "string" && d.data.includes("-")) {
        const [ano, mes, dia] = d.data.split("-");
        label = `${dia}/${mes}`;
      }
      labels.push(label);

      const horasEst =
        d.horas_estudo_liquidas != null
          ? Number(d.horas_estudo_liquidas)
          : 0;
      const questoes =
        d.questoes_feitas_total != null
          ? Number(d.questoes_feitas_total)
          : 0;
      const horasSono =
        d.horas_sono_total != null ? Number(d.horas_sono_total) : 0;
      const foco = d.nivel_foco != null ? Number(d.nivel_foco) : null;
      const energia =
        d.nivel_energia != null ? Number(d.nivel_energia) : null;

      horasEstudoDataset.push(horasEst);
      questoesDataset.push(questoes);
      sonoDataset.push(horasSono);
      focoDataset.push(foco);
      energiaDataset.push(energia);

      if (horasEst > 0 || questoes > 0) {
        diasComEstudo++;
      }

      if (d.horas_estudo_liquidas != null) {
        somaHorasEstudo += Number(d.horas_estudo_liquidas);
      }
      if (d.questoes_feitas_total != null) {
        somaQuestoes += Number(d.questoes_feitas_total);
      }

      if (d.horas_sono_total != null) {
        somaHorasSono += Number(d.horas_sono_total);
        contaSono++;
      }
      if (d.qualidade_sono_nota != null) {
        somaQualidadeSono += Number(d.qualidade_sono_nota);
        contaQualidadeSono++;
      }
      if (d.tirou_soneca) {
        diasComSoneca++;
      }

      if (d.nivel_foco != null) {
        somaFoco += Number(d.nivel_foco);
        contaFoco++;
      }
      if (d.nivel_energia != null) {
        somaEnergia += Number(d.nivel_energia);
        contaEnergia++;
      }

      if (d.humor === "BOM") countHumorBom++;
      else if (d.humor === "OK") countHumorOk++;
      else if (d.humor === "RUIM") countHumorRuim++;
    });

    const mediaHorasEstudo = diasComEstudo
      ? somaHorasEstudo / diasComEstudo
      : 0;
    const mediaQuestoesPorDia = diasComEstudo
      ? somaQuestoes / diasComEstudo
      : 0;

    const mediaHorasSono = contaSono ? somaHorasSono / contaSono : 0;
    const mediaQualidadeSono = contaQualidadeSono
      ? somaQualidadeSono / contaQualidadeSono
      : 0;

    const mediaFoco = contaFoco ? somaFoco / contaFoco : 0;
    const mediaEnergia = contaEnergia ? somaEnergia / contaEnergia : 0;

    res.render("estatisticas_dias", {
      tituloPagina: "Estatísticas dos dias",
      totalDias,
      diasComEstudo,
      somaHorasEstudo,
      mediaHorasEstudo,
      somaQuestoes,
      mediaQuestoesPorDia,
      mediaHorasSono,
      mediaQualidadeSono,
      diasComSoneca,
      mediaFoco,
      mediaEnergia,
      countHumorBom,
      countHumorOk,
      countHumorRuim,
      labelsJSON: JSON.stringify(labels),
      horasEstudoDatasetJSON: JSON.stringify(horasEstudoDataset),
      questoesDatasetJSON: JSON.stringify(questoesDataset),
      focoDatasetJSON: JSON.stringify(focoDataset),
      energiaDatasetJSON: JSON.stringify(energiaDataset),
      sonoDatasetJSON: JSON.stringify(sonoDataset),
      humorLabelsJSON: JSON.stringify(["Bom", "OK", "Ruim"]),
      humorValoresJSON: JSON.stringify([
        countHumorBom,
        countHumorOk,
        countHumorRuim
      ]),
      periodo
    });
  } catch (error) {
    console.error("❌ Erro ao carregar estatísticas dos dias:", error);
    return res
      .status(500)
      .send("Erro ao carregar estatísticas dos dias. Veja o console.");
  }
});

// Porta padrão
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Rastreador de Estudos rodando em http://localhost:${PORT}`);
});
