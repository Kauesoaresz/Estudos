// controllers/estatisticasController.js
//
// Módulo de ESTATÍSTICAS (VERSÃO MULTIUSUÁRIO):
// - Por matéria (últimos 7d, 30d ou todos os tempos)
// - De simulados (últimos 7d, 30d ou todos os tempos)
// - Dos dias (hábitos, estudo, sono, humor)
//
// Tudo sempre filtrando pelo usuario_id da sessão. 👍

const { Dia, Materia, EstudoMateriaDia, Simulado } = require("../models");
const { toISODate, diffDias, formatarDDMMYYYY } = require("../utils/datas");

// ============================================================================
// 📌 ESTATÍSTICAS POR MATÉRIA
// ============================================================================

async function estatisticasMaterias(req, res) {
  const periodo = req.query.periodo || "30d"; // "7d", "30d" ou "todos"

  try {
    const userId = req.session.usuario.id;

    const estudosBrutos = await EstudoMateriaDia.findAll({
      where: { usuario_id: userId },
      include: [
        {
          model: Materia,
          as: "materia",
          attributes: ["id", "nome"],
          where: { usuario_id: userId },
          required: true
        },
        {
          model: Dia,
          as: "dia",
          attributes: ["data"],
          where: { usuario_id: userId },
          required: true
        }
      ]
    });

    const hoje = new Date();
    const estudos = estudosBrutos.map((e) => e.get({ plain: true }));

    const estudosFiltrados = estudos.filter((est) => {
      if (!est.dia || !est.dia.data) return false;
      if (periodo === "todos") return true;

      const dataISO = toISODate(est.dia.data);
      if (!dataISO) return false;

      const d = diffDias(dataISO, hoje);
      const limite = periodo === "7d" ? 7 : 30;

      return d >= 0 && d <= limite;
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

      if (!mapa.has(mat.id)) {
        mapa.set(mat.id, {
          materiaId: mat.id,
          materiaNome: mat.nome,
          totalMinutos: 0,
          totalQuestoes: 0,
          totalCertas: 0,
          diasSet: new Set()
        });
      }

      const item = mapa.get(mat.id);

      if (est.minutos_estudados)
        item.totalMinutos += Number(est.minutos_estudados);
      if (est.questoes_feitas)
        item.totalQuestoes += Number(est.questoes_feitas);
      if (est.questoes_certas)
        item.totalCertas += Number(est.questoes_certas);

      if (est.dia && est.dia.data) {
        const iso = toISODate(est.dia.data);
        if (iso) item.diasSet.add(iso);
      }
    });

    const materiasStats = Array.from(mapa.values()).map((m) => {
      const horasTotais = m.totalMinutos / 60;
      const taxaAcerto =
        m.totalQuestoes > 0
          ? Math.round((m.totalCertas / m.totalQuestoes) * 100)
          : null;

      return {
        materiaId: m.materiaId,
        materiaNome: m.materiaNome,
        totalMinutos: m.totalMinutos,
        horasTotais,
        totalQuestoes: m.totalQuestoes,
        totalCertas: m.totalCertas,
        totalDias: m.diasSet.size,
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
    console.error("❌ Erro em estatísticas por matéria:", error);
    return res.status(500).send("Erro ao carregar estatísticas por matéria.");
  }
}

// ============================================================================
// 📌 ESTATÍSTICAS DE SIMULADOS
// ============================================================================

async function estatisticasSimulados(req, res) {
  const periodo = req.query.periodo || "30d";

  try {
    const userId = req.session.usuario.id;

    const simuladosBrutos = await Simulado.findAll({
      where: { usuario_id: userId },
      include: [
        {
          model: Dia,
          as: "dia",
          attributes: ["data"],
          where: { usuario_id: userId },
          required: true
        }
      ],
      order: [[{ model: Dia, as: "dia" }, "data", "ASC"]]
    });

    const hoje = new Date();

    const simuladosFiltrados = simuladosBrutos
      .map((s) => s.get({ plain: true }))
      .filter((sim) => {
        if (periodo === "todos") return true;
        if (!sim.dia || !sim.dia.data) return false;

        const iso = toISODate(sim.dia.data);
        if (!iso) return false;

        const d = diffDias(iso, hoje);
        const limite = periodo === "7d" ? 7 : 30;

        return d >= 0 && d <= limite;
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
    let somaL = 0,
      somaH = 0,
      somaN = 0,
      somaM = 0;

    let melhorTotal = null;
    let piorTotal = null;

    simuladosFiltrados.forEach((sim) => {
      let dataLabel = sim.dia.data;
      dataLabel = formatarDDMMYYYY(toISODate(dataLabel)).substring(0, 5); // dd/mm

      const L = sim.acertos_linguagens || 0;
      const H = sim.acertos_humanas || 0;
      const N = sim.acertos_naturezas || 0;
      const M = sim.acertos_matematica || 0;

      const total = L + H + N + M;

      labels.push(dataLabel);
      totalDataset.push(total);

      somaL += L;
      somaH += H;
      somaN += N;
      somaM += M;

      if (melhorTotal === null || total > melhorTotal) melhorTotal = total;
      if (piorTotal === null || total < piorTotal) piorTotal = total;
    });

    const totalSimulados = simuladosFiltrados.length;

    const medias = [
      somaL / totalSimulados,
      somaH / totalSimulados,
      somaN / totalSimulados,
      somaM / totalSimulados
    ].map((v) => Number(v.toFixed(2)));

    res.render("estatisticas_simulados", {
      tituloPagina: "Estatísticas de simulados",
      totalSimulados,
      mediaLinguagens: medias[0],
      mediaHumanas: medias[1],
      mediaNaturezas: medias[2],
      mediaMatematica: medias[3],
      melhorTotal,
      piorTotal,
      labelsJSON: JSON.stringify(labels),
      totalDatasetJSON: JSON.stringify(totalDataset),
      mediasPorAreaLabelsJSON: JSON.stringify([
        "Linguagens",
        "Humanas",
        "Naturezas",
        "Matemática"
      ]),
      mediasPorAreaValoresJSON: JSON.stringify(medias),
      periodo
    });
  } catch (error) {
    console.error("❌ Erro em estatísticas de simulados:", error);
    return res.status(500).send("Erro ao carregar estatísticas de simulados.");
  }
}

// ============================================================================
// 📌 ESTATÍSTICAS DOS DIAS (hábitos, estudo, sono, humor)
// ============================================================================

async function estatisticasDias(req, res) {
  const periodo = req.query.periodo || "30d";

  try {
    const userId = req.session.usuario.id;

    const dias = await Dia.findAll({
      where: { usuario_id: userId },
      order: [["data", "ASC"]],
      raw: true
    });

    const hoje = new Date();
    const filtrados = dias.filter((d) => {
      if (periodo === "todos") return true;

      const iso = toISODate(d.data);
      if (!iso) return false;

      const dif = diffDias(iso, hoje);
      const limite = periodo === "7d" ? 7 : 30;

      return dif >= 0 && dif <= limite;
    });

    if (!filtrados.length) {
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

    let diasComEstudo = 0,
      somaHorasEstudo = 0,
      somaQuestoes = 0,
      somaSono = 0,
      contaSono = 0,
      somaQualidadeSono = 0,
      contaQualidade = 0,
      somaFoco = 0,
      contaFoco = 0,
      somaEnergia = 0,
      contaEnergia = 0,
      countBom = 0,
      countOk = 0,
      countRuim = 0;

    const labels = [];
    const horasDataset = [];
    const questoesDataset = [];
    const focoDataset = [];
    const energiaDataset = [];
    const sonoDataset = [];

    filtrados.forEach((d) => {
      const iso = toISODate(d.data);
      const label = formatarDDMMYYYY(iso).substring(0, 5);

      labels.push(label);

      const horas = d.horas_estudo_liquidas
        ? Number(d.horas_estudo_liquidas)
        : 0;
      const quest = d.questoes_feitas_total
        ? Number(d.questoes_feitas_total)
        : 0;

      horasDataset.push(horas);
      questoesDataset.push(quest);

      if (horas > 0 || quest > 0) diasComEstudo++;

      somaHorasEstudo += horas;
      somaQuestoes += quest;

      if (d.horas_sono_total != null) {
        somaSono += Number(d.horas_sono_total);
        contaSono++;
        sonoDataset.push(Number(d.horas_sono_total));
      } else {
        sonoDataset.push(0);
      }

      if (d.qualidade_sono_nota != null) {
        somaQualidadeSono += Number(d.qualidade_sono_nota);
        contaQualidade++;
      }

      const foco = d.nivel_foco != null ? Number(d.nivel_foco) : null;
      focoDataset.push(foco);
      if (foco != null) {
        somaFoco += foco;
        contaFoco++;
      }

      const energia = d.nivel_energia != null ? Number(d.nivel_energia) : null;
      energiaDataset.push(energia);
      if (energia != null) {
        somaEnergia += energia;
        contaEnergia++;
      }

      if (d.humor === "BOM") countBom++;
      else if (d.humor === "OK") countOk++;
      else if (d.humor === "RUIM") countRuim++;
    });

    const mediaHorasEstudo = diasComEstudo
      ? somaHorasEstudo / diasComEstudo
      : 0;
    const mediaQuestoes = diasComEstudo ? somaQuestoes / diasComEstudo : 0;
    const mediaSono = contaSono ? somaSono / contaSono : 0;
    const mediaQualidade = contaQualidade
      ? somaQualidadeSono / contaQualidade
      : 0;
    const mediaFocoTotal = contaFoco ? somaFoco / contaFoco : 0;
    const mediaEnergiaTotal = contaEnergia ? somaEnergia / contaEnergia : 0;

    res.render("estatisticas_dias", {
      tituloPagina: "Estatísticas dos dias",
      totalDias: filtrados.length,
      diasComEstudo,
      somaHorasEstudo,
      mediaHorasEstudo,
      somaQuestoes,
      mediaQuestoesPorDia: mediaQuestoes,
      mediaHorasSono: mediaSono,
      mediaQualidadeSono: mediaQualidade,
      diasComSoneca: filtrados.filter((d) => d.tirou_soneca).length,
      mediaFoco: mediaFocoTotal,
      mediaEnergia: mediaEnergiaTotal,
      countHumorBom: countBom,
      countHumorOk: countOk,
      countHumorRuim: countRuim,
      labelsJSON: JSON.stringify(labels),
      horasEstudoDatasetJSON: JSON.stringify(horasDataset),
      questoesDatasetJSON: JSON.stringify(questoesDataset),
      focoDatasetJSON: JSON.stringify(focoDataset),
      energiaDatasetJSON: JSON.stringify(energiaDataset),
      sonoDatasetJSON: JSON.stringify(sonoDataset),
      humorLabelsJSON: JSON.stringify(["Bom", "OK", "Ruim"]),
      humorValoresJSON: JSON.stringify([countBom, countOk, countRuim]),
      periodo
    });
  } catch (error) {
    console.error("❌ Erro em estatísticas dos dias:", error);
    return res.status(500).send("Erro ao carregar estatísticas dos dias.");
  }
}

module.exports = {
  estatisticasMaterias,
  estatisticasSimulados,
  estatisticasDias
};
