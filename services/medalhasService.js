// ================================================
// SERVICE DE MEDALHAS — 100 MEDALHAS COMPLETAS
// ================================================

const { Dia, EstudoMateriaDia, Simulado, Medalha, MedalhaUsuario } = require("../models");

// =====================================================
// 100 MEDALHAS — COMPLETAS
// =====================================================

const MEDALHAS_BASE = [
  // ============================================
  // 1) HORAS ACUMULADAS (20 medalhas)
  // ============================================
  { nome: "Primeira Hora", descricao: "Estude 1h no total.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 1 },
  { nome: "Marinheiro do Estudo", descricao: "10h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 10 },
  { nome: "Ritmo Inicial", descricao: "25h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 25 },
  { nome: "Andamento Forte", descricao: "50h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 50 },
  { nome: "Persistente I", descricao: "80h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 80 },
  { nome: "Persistente II", descricao: "120h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 120 },
  { nome: "Persistente III", descricao: "160h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 160 },
  { nome: "Estudioso I", descricao: "200h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 200 },
  { nome: "Estudioso II", descricao: "260h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 260 },
  { nome: "Estudioso III", descricao: "320h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 320 },
  { nome: "Dedicado I", descricao: "400h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 400 },
  { nome: "Dedicado II", descricao: "500h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 500 },
  { nome: "Dedicado III", descricao: "600h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 600 },
  { nome: "Monge do Estudo I", descricao: "800h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 800 },
  { nome: "Monge do Estudo II", descricao: "1000h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 1000 },
  { nome: "Monge do Estudo III", descricao: "1200h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 1200 },
  { nome: "Lenda I", descricao: "1500h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 1500 },
  { nome: "Lenda II", descricao: "1800h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 1800 },
  { nome: "Lenda III", descricao: "2000h acumuladas.", categoria: "Horas acumuladas", tipo_trigger: "HORAS_ACUM", valor_trigger: 2000 },

  // ============================================
  // 2) QUESTÕES FEITAS (15 medalhas)
  // ============================================
  { nome: "Primeiras 50", descricao: "Faça 50 questões.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 50 },
  { nome: "100 Questões", descricao: "100 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 100 },
  { nome: "200 Questões", descricao: "200 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 200 },
  { nome: "300 Questões", descricao: "300 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 300 },
  { nome: "500 Questões", descricao: "500 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 500 },
  { nome: "800 Questões", descricao: "800 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 800 },
  { nome: "1000 Questões", descricao: "1000 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 1000 },
  { nome: "1500 Questões", descricao: "1500 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 1500 },
  { nome: "2000 Questões", descricao: "2000 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 2000 },
  { nome: "3000 Questões", descricao: "3000 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 3000 },
  { nome: "5000 Questões", descricao: "5000 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 5000 },
  { nome: "8000 Questões", descricao: "8000 questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 8000 },
  { nome: "10.000 Questões", descricao: "10 mil questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 10000 },
  { nome: "15.000 Questões", descricao: "15 mil questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 15000 },
  { nome: "20.000 Questões", descricao: "20 mil questões feitas.", categoria: "Questões feitas", tipo_trigger: "QUESTOES", valor_trigger: 20000 },

  // ============================================
  // 3) ACERTOS (10 medalhas)
  // ============================================
  { nome: "Primeiros 30 Acertos", descricao: "30 acertos totais.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 30 },
  { nome: "100 Acertos", descricao: "100 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 100 },
  { nome: "250 Acertos", descricao: "250 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 250 },
  { nome: "500 Acertos", descricao: "500 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 500 },
  { nome: "800 Acertos", descricao: "800 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 800 },
  { nome: "1200 Acertos", descricao: "1200 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 1200 },
  { nome: "2000 Acertos", descricao: "2000 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 2000 },
  { nome: "5000 Acertos", descricao: "5000 acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 5000 },
  { nome: "10.000 Acertos", descricao: "10 mil acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 10000 },
  { nome: "15.000 Acertos", descricao: "15 mil acertos.", categoria: "Acertos", tipo_trigger: "ACERTOS", valor_trigger: 15000 },

  // ============================================
  // 4) DIAS SEGUIDOS (10 medalhas)
  // ============================================
  { nome: "Primeiro Dia", descricao: "1 dia seguido estudando.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 1 },
  { nome: "Mini Sequência", descricao: "3 dias seguidos estudando.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 3 },
  { nome: "Constância Inicial", descricao: "7 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 7 },
  { nome: "Constância II", descricao: "14 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 14 },
  { nome: "Constância III", descricao: "21 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 21 },
  { nome: "Foco Total I", descricao: "30 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 30 },
  { nome: "Foco Total II", descricao: "45 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 45 },
  { nome: "Foco Total III", descricao: "60 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 60 },
  { nome: "Foco Supremo", descricao: "90 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 90 },
  { nome: "Inquebrável", descricao: "180 dias seguidos.", categoria: "Dias seguidos", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 180 },

  // ============================================
  // 5) SIMULADOS (8 medalhas)
  // ============================================
  { nome: "Primeiro Simulado", descricao: "Complete 1 simulado.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 1 },
  { nome: "Simulador I", descricao: "3 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 3 },
  { nome: "Simulador II", descricao: "5 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 5 },
  { nome: "Simulador III", descricao: "10 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 10 },
  { nome: "Simulador IV", descricao: "20 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 20 },
  { nome: "Simulador Supremo", descricao: "40 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 40 },
  { nome: "Simulador Mestre", descricao: "70 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 70 },
  { nome: "Simulador Deus", descricao: "100 simulados.", categoria: "Simulados", tipo_trigger: "SIMULADOS_FEITOS", valor_trigger: 100 },

  // ============================================
  // 6) REVISÕES (8 medalhas)
  // ============================================
  { nome: "Primeira Revisão", descricao: "1 revisão.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 1 },
  { nome: "Revisor I", descricao: "5 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 5 },
  { nome: "Revisor II", descricao: "10 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 10 },
  { nome: "Revisor III", descricao: "20 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 20 },
  { nome: "Revisor IV", descricao: "40 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 40 },
  { nome: "Revisor Mestre", descricao: "80 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 80 },
  { nome: "Revisor Supremo", descricao: "150 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 150 },
  { nome: "Revisor Divino", descricao: "300 revisões.", categoria: "Revisões", tipo_trigger: "REVISOES", valor_trigger: 300 },

  // ============================================
  // 7) METAS DIÁRIAS (7 medalhas)
  // ============================================
  { nome: "Primeira Meta", descricao: "1 meta realizada.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 1 },
  { nome: "Meta Ativa", descricao: "5 metas.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 5 },
  { nome: "Meta Forte", descricao: "10 metas.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 10 },
  { nome: "Meta Mestre", descricao: "20 metas.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 20 },
  { nome: "Meta Supremo", descricao: "50 metas.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 50 },
  { nome: "Meta Ultra", descricao: "100 metas.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 100 },
  { nome: "Meta Infinita", descricao: "300 metas.", categoria: "Metas", tipo_trigger: "META", valor_trigger: 300 },

  // ============================================
  // 8) HORAS EM UM DIA (6 medalhas)
  // ============================================
  { nome: "Forte Hoje I", descricao: "2h em um dia.", categoria: "Horas/dia", tipo_trigger: "HORAS_DIA", valor_trigger: 2 },
  { nome: "Forte Hoje II", descricao: "3h em um dia.", categoria: "Horas/dia", tipo_trigger: "HORAS_DIA", valor_trigger: 3 },
  { nome: "Forte Hoje III", descricao: "4h em um dia.", categoria: "Horas/dia", tipo_trigger: "HORAS_DIA", valor_trigger: 4 },
  { nome: "Forte Hoje IV", descricao: "5h em um dia.", categoria: "Horas/dia", tipo_trigger: "HORAS_DIA", valor_trigger: 5 },
  { nome: "Dia Insano", descricao: "8h em um dia.", categoria: "Horas/dia", tipo_trigger: "HORAS_DIA", valor_trigger: 8 },
  { nome: "Dia Sobre-Humano", descricao: "12h em um dia.", categoria: "Horas/dia", tipo_trigger: "HORAS_DIA", valor_trigger: 12 },

  // ============================================
  // 9) QUESTÕES EM UM DIA (6 medalhas)
  // ============================================
  { nome: "Dia Produtivo I", descricao: "20 questões/dia.", categoria: "Produtividade", tipo_trigger: "QUESTOES_DIA", valor_trigger: 20 },
  { nome: "Dia Produtivo II", descricao: "40 questões/dia.", categoria: "Produtividade", tipo_trigger: "QUESTOES_DIA", valor_trigger: 40 },
  { nome: "Dia Produtivo III", descricao: "60 questões/dia.", categoria: "Produtividade", tipo_trigger: "QUESTOES_DIA", valor_trigger: 60 },
  { nome: "Produtivo Supremo", descricao: "100 questões/dia.", categoria: "Produtividade", tipo_trigger: "QUESTOES_DIA", valor_trigger: 100 },
  { nome: "Produtivo Insano", descricao: "150 questões/dia.", categoria: "Produtividade", tipo_trigger: "QUESTOES_DIA", valor_trigger: 150 },
  { nome: "Produtivo Deus", descricao: "200 questões/dia.", categoria: "Produtividade", tipo_trigger: "QUESTOES_DIA", valor_trigger: 200 },

  // ============================================
  // 10) ESPECIAIS – LONGO PRAZO (10 medalhas)
  // ============================================
  { nome: "Mês Concluído", descricao: "Estudar todos os dias por 1 mês.", categoria: "Especial", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 30 },
  { nome: "Dois Meses", descricao: "2 meses seguidos estudando.", categoria: "Especial", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 60 },
  { nome: "Três Meses", descricao: "3 meses seguidos estudando.", categoria: "Especial", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 90 },
  { nome: "Quatro Meses", descricao: "120 dias seguidos estudando.", categoria: "Especial", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 120 },
  { nome: "Meio Ano", descricao: "180 dias de estudo acumulados (não seguidos).", categoria: "Especial", tipo_trigger: "DIAS_SEGUIDOS", valor_trigger: 180 },
  { nome: "Explosão de Conhecimento", descricao: "Estudar 100h em 30 dias.", categoria: "Especial", tipo_trigger: "HORAS_ACUM", valor_trigger: 100 },
  { nome: "Ano de Luta", descricao: "Estudar 300h em 1 ano.", categoria: "Especial", tipo_trigger: "HORAS_ACUM", valor_trigger: 300 },
  { nome: "Ano Supremo", descricao: "500h em 1 ano.", categoria: "Especial", tipo_trigger: "HORAS_ACUM", valor_trigger: 500 },
  { nome: "Ano Divino", descricao: "800h em 1 ano.", categoria: "Especial", tipo_trigger: "HORAS_ACUM", valor_trigger: 800 },
  { nome: "Lendário do Estudo", descricao: "1000h em 1 ano.", categoria: "Especial", tipo_trigger: "HORAS_ACUM", valor_trigger: 1000 }
];


// =====================================================
// FUNÇÃO PARA GARANTIR QUE TODAS AS MEDALHAS EXISTAM
// =====================================================

async function inicializarMedalhasBase() {
  console.log("Rodando inicialização de medalhas! Total no JSON:", MEDALHAS_BASE.length);

  for (const medalha of MEDALHAS_BASE) {
    const existe = await Medalha.findOne({
      where: { nome: medalha.nome }
    });

    if (!existe) {
      await Medalha.create(medalha);
    }
  }

  console.log("🏅 Medalhas base carregadas");
}


// =====================================================
// FUNÇÃO PRINCIPAL — VERIFICAR MEDALHAS
// =====================================================

async function verificarMedalhas() {
  try {
    const dias = await Dia.findAll();
    const estudos = await EstudoMateriaDia.findAll();
    const simulados = await Simulado.findAll();
    const medalhas = await Medalha.findAll();
    const jaTem = await MedalhaUsuario.findAll();

    const idsJaTem = jaTem.map(m => m.medalha_id);

    // Progresso total
    const totalHoras = dias.reduce((acc, d) => acc + (d.horas_estudo_liquidas || 0), 0);
    const totalQuestoes = dias.reduce((acc, d) => acc + (d.questoes_feitas_total || 0), 0);
    const totalAcertos = dias.reduce((acc, d) => acc + (d.questoes_acertos_total || 0), 0);
    const totalSimulados = simulados.length;

    // Dias seguidos
    let sequencia = 0;
    let maiorSequencia = 0;
    const diasOrdenados = dias.sort((a, b) => a.data.localeCompare(b.data));

    for (let d of diasOrdenados) {
      const h = d.horas_estudo_liquidas || 0;
      const q = d.questoes_feitas_total || 0;
      if (h > 0 || q > 0) {
        sequencia++;
        maiorSequencia = Math.max(maiorSequencia, sequencia);
      } else {
        sequencia = 0;
      }
    }

    const novasMedalhas = [];

    for (const medalha of medalhas) {
      if (idsJaTem.includes(medalha.id)) continue;

      const tipo = medalha.tipo_trigger;
      const valor = medalha.valor_trigger;

      let conquistou = false;

      if (tipo === "HORAS_ACUM" && totalHoras >= valor) conquistou = true;
      if (tipo === "QUESTOES" && totalQuestoes >= valor) conquistou = true;
      if (tipo === "ACERTOS" && totalAcertos >= valor) conquistou = true;
      if (tipo === "SIMULADOS_FEITOS" && totalSimulados >= valor) conquistou = true;
      if (tipo === "DIAS_SEGUIDOS" && maiorSequencia >= valor) conquistou = true;

      // Medalhas por um dia apenas
      const ultimoDia = diasOrdenados[diasOrdenados.length - 1];

      if (ultimoDia) {
        if (tipo === "HORAS_DIA" && ultimoDia.horas_estudo_liquidas >= valor)
          conquistou = true;

        if (tipo === "QUESTOES_DIA" && ultimoDia.questoes_feitas_total >= valor)
          conquistou = true;

        if (tipo === "SONO" && ultimoDia.horas_sono_total >= valor)
          conquistou = true;

        if (tipo === "ENERGIA" && ultimoDia.nivel_energia >= valor)
          conquistou = true;

        if (tipo === "FOCO" && ultimoDia.nivel_foco >= valor)
          conquistou = true;

        if (tipo === "META" && ultimoDia.status_meta === "CONCLUIDA" && valor === 1)
          conquistou = true;
      }

      if (conquistou) {
        await MedalhaUsuario.create({
          medalha_id: medalha.id,
          data_conquista: new Date()
        });
        novasMedalhas.push(medalha);
      }
    }

    return novasMedalhas;

  } catch (err) {
    console.error("❌ Erro ao verificar medalhas:", err);
    return [];
  }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  inicializarMedalhasBase,
  verificarMedalhas,
  MEDALHAS_BASE
};
