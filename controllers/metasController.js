// controllers/metasController.js
//
// VERSÃO 100% MULTI-USUÁRIO
// Todos os dados filtrados por usuario_id
//

const { Dia, EstudoMateriaDia, Simulado, Materia } = require("../models");
const { Op } = require("sequelize");

// ==============================
// CONFIGURAÇÃO DAS METAS 2026
// ==============================
const METAS_CONFIG = {
  anoPadrao: 2026,

  // Tempo
  horasAno: 2700,
  horasSemanaisMin: 35,
  horasSemanaisIdeal: 49,

  // Questões e constância
  questoesAno: 15000,
  diasEstudandoAno: 320,

  // Simulados
  simulados: {
    curtos: 15,     // até 60 min
    medios: 15,     // 61–180 min
    completos: 10,  // 181+ min
    oficiais: 6     // aproximado (ENEM / prova oficial)
  },

  // Redações
  redacoesAno: 48
};

// Helpers
function porcentagem(parte, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((parte / total) * 100));
}

function classificarSimulado(minutos) {
  if (!minutos || minutos <= 0) return "desconhecido";
  if (minutos <= 60) return "curto";
  if (minutos <= 180) return "medio";
  return "completo";
}

// ==============================
// CONTROLLER PRINCIPAL
// ==============================
async function painelMetas(req, res) {
  try {
    const usuarioId = req.session.usuario.id;

    const ano = Number(req.query.ano) || METAS_CONFIG.anoPadrao;
    const inicioAno = `${ano}-01-01`;
    const fimAno = `${ano}-12-31`;

    // ==============================
    // DIAS DO ANO (somente do usuário)
    // ==============================
    const diasAno = await Dia.findAll({
      where: {
        usuario_id: usuarioId,
        data: {
          [Op.between]: [inicioAno, fimAno]
        }
      },
      order: [["data", "ASC"]],
      raw: true
    });

    const totalDiasAno = diasAno.length;

    let somaHorasAno = 0;
    let somaQuestoesAno = 0;
    let diasEstudadosAno = 0;

    let somaSono = 0;
    let diasComSono = 0;
    let diasSonoAdequado = 0;

    let somaEnergia = 0;
    let diasComEnergia = 0;

    diasAno.forEach((d) => {
      const horas = d.horas_estudo_liquidas ? Number(d.horas_estudo_liquidas) : 0;
      const questoes = d.questoes_feitas_total ? Number(d.questoes_feitas_total) : 0;

      somaHorasAno += horas;
      somaQuestoesAno += questoes;

      if (horas > 0 || questoes > 0) diasEstudadosAno++;

      // Sono
      if (d.horas_sono_total != null) {
        const sono = Number(d.horas_sono_total);
        somaSono += sono;
        diasComSono++;

        if (sono >= 7 && sono <= 9) diasSonoAdequado++;
      }

      // Energia
      if (d.nivel_energia != null) {
        somaEnergia += Number(d.nivel_energia);
        diasComEnergia++;
      }
    });

    const mediaHorasPorDiaEstudado =
      diasEstudadosAno > 0 ? somaHorasAno / diasEstudadosAno : 0;

    const mediaHorasDiaNoAno =
      totalDiasAno > 0 ? somaHorasAno / totalDiasAno : 0;

    const mediaSono = diasComSono > 0 ? somaSono / diasComSono : null;
    const mediaEnergia = diasComEnergia > 0 ? somaEnergia / diasComEnergia : null;

    const percSonoAdequado =
      totalDiasAno > 0 ? Math.round((diasSonoAdequado / totalDiasAno) * 100) : 0;

    // ==============================
    // SIMULADOS (somente usuário)
    // ==============================
    const simuladosAno = await Simulado.findAll({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: Dia,
          as: "dia",
          attributes: ["data"],
          where: {
            usuario_id: usuarioId,
            data: {
              [Op.between]: [inicioAno, fimAno]
            }
          }
        }
      ],
      order: [["id", "ASC"]]
    });

    let qtdCurtos = 0;
    let qtdMedios = 0;
    let qtdCompletos = 0;
    let qtdOficiais = 0;

    simuladosAno.forEach((s) => {
      const sim = s.get({ plain: true });
      const tipo = classificarSimulado(sim.tempo_total_minutos || 0);

      if (tipo === "curto") qtdCurtos++;
      else if (tipo === "medio") qtdMedios++;
      else if (tipo === "completo") qtdCompletos++;

      const resumo = (sim.resultado_resumo || "").toLowerCase();
      if (resumo.includes("enem") || resumo.includes("oficial")) {
        qtdOficiais++;
      }
    });

    // ==============================
    // REDAÇÕES (somente usuário)
    // ==============================
    const estudosRedacao = await EstudoMateriaDia.findAll({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: Dia,
          as: "dia",
          attributes: ["data"],
          where: {
            usuario_id: usuarioId,
            data: {
              [Op.between]: [inicioAno, fimAno]
            }
          }
        },
        {
          model: Materia,
          as: "materia",
          attributes: ["nome"]
        }
      ]
    });

    let totalRedacoesAno = 0;

    estudosRedacao.forEach((e) => {
      const est = e.get({ plain: true });
      const nome = (est.materia?.nome || "").toLowerCase();

      if (nome.includes("redação")) totalRedacoesAno++;
    });

    // ==============================
    // JUNTAR TUDO PARA O TEMPLATE
    // ==============================
    const progressoTempo = {
      metaHorasAno: METAS_CONFIG.horasAno,
      totalHorasAno: somaHorasAno,
      percHorasAno: porcentagem(somaHorasAno, METAS_CONFIG.horasAno),

      horasSemanaisMin: METAS_CONFIG.horasSemanaisMin,
      horasSemanaisIdeal: METAS_CONFIG.horasSemanaisIdeal,

      diasEstudadosAno,
      metaDiasEstudadosAno: METAS_CONFIG.diasEstudandoAno,
      percDiasEstudadosAno: porcentagem(
        diasEstudadosAno,
        METAS_CONFIG.diasEstudandoAno
      ),

      mediaHorasPorDiaEstudado: Number(mediaHorasPorDiaEstudado.toFixed(1)),
      mediaHorasDiaNoAno: Number(mediaHorasDiaNoAno.toFixed(1))
    };

    const progressoQuestoes = {
      metaQuestoesAno: METAS_CONFIG.questoesAno,
      totalQuestoesAno: somaQuestoesAno,
      percQuestoesAno: porcentagem(somaQuestoesAno, METAS_CONFIG.questoesAno)
    };

    const progressoSimulados = {
      metaCurtos: METAS_CONFIG.simulados.curtos,
      metaMedios: METAS_CONFIG.simulados.medios,
      metaCompletos: METAS_CONFIG.simulados.completos,
      metaOficiais: METAS_CONFIG.simulados.oficiais,

      qtdCurtos,
      qtdMedios,
      qtdCompletos,
      qtdOficiais,

      percCurtos: porcentagem(qtdCurtos, METAS_CONFIG.simulados.curtos),
      percMedios: porcentagem(qtdMedios, METAS_CONFIG.simulados.medios),
      percCompletos: porcentagem(qtdCompletos, METAS_CONFIG.simulados.completos),
      percOficiais: porcentagem(qtdOficiais, METAS_CONFIG.simulados.oficiais)
    };

    const progressoRedacoes = {
      metaRedacoesAno: METAS_CONFIG.redacoesAno,
      totalRedacoesAno,
      percRedacoesAno: porcentagem(
        totalRedacoesAno,
        METAS_CONFIG.redacoesAno
      )
    };

    const progressoSaude = {
      mediaSono: mediaSono != null ? Number(mediaSono.toFixed(1)) : null,
      diasComSono,
      diasSonoAdequado,
      percSonoAdequado,
      mediaEnergia: mediaEnergia != null ? Number(mediaEnergia.toFixed(1)) : null
    };

    return res.render("metas", {
      tituloPagina: "Painel de metas",
      ano,
      METAS_CONFIG,
      progressoTempo,
      progressoQuestoes,
      progressoSimulados,
      progressoRedacoes,
      progressoSaude
    });

  } catch (error) {
    console.error("❌ Erro ao carregar painel de metas:", error);
    return res.status(500).send("Erro ao carregar painel de metas.");
  }
}

module.exports = {
  painelMetas
};
