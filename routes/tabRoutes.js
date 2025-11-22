// routes/tabRoutes.js

const express = require("express");
const router = express.Router();

const { ensureAuth } = require("../middlewares/authMiddleware");
const { TabBloco, TabErro } = require("../models");

// =====================================================================
// 🔵 FORMULÁRIO DE NOVO BLOCO TAB
// =====================================================================
router.get("/tab/novo", ensureAuth, (req, res) => {
  return res.render("tab/form", {
    tituloPagina: "Novo Bloco TAB",
    usuarioLogado: req.session.usuario,
  });
});

// =====================================================================
// 🟢 SALVAR BLOCO TAB + ERROS
// =====================================================================
router.post("/tab/novo", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const { anoProva, area, blocoPosicao, provaEtiqueta, errosTexto } = req.body;

    const bloco = await TabBloco.create({
      usuarioId,
      anoProva,
      area,
      blocoPosicao,
      provaEtiqueta: provaEtiqueta || null,
    });

    await salvarErrosDoFormulario(bloco.id, errosTexto);

    return res.redirect("/tab");
  } catch (error) {
    console.error("Erro ao salvar bloco TAB:", error);
    return res.status(500).send("Erro ao salvar bloco TAB.");
  }
});

// =====================================================================
// 🟣 LISTA DE BLOCOS TAB — DASHBOARD PRINCIPAL
// =====================================================================
router.get("/tab", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;

    const blocos = await TabBloco.findAll({
      where: { usuarioId },
      include: [{ model: TabErro, as: "erros" }],
      order: [["criado_em", "DESC"]],
    });

    return res.render("tab/index", {
      tituloPagina: "Técnica TAB",
      usuarioLogado: req.session.usuario,
      blocos,
    });

  } catch (error) {
    console.error("Erro ao carregar TAB:", error);
    return res.status(500).send("Erro ao carregar página TAB.");
  }
});

// =====================================================================
// 📘 BANCO DE ERROS GERAL
// =====================================================================
router.get("/tab/erros-geral", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;

    const erros = await TabErro.findAll({
      include: [
        {
          model: TabBloco,
          as: "bloco",
          where: { usuarioId },
        },
      ],
      order: [
        [{ model: TabBloco, as: "bloco" }, "anoProva", "DESC"],
        ["numeroQuestao", "ASC"],
      ],
    });

    return res.render("tab/erros_geral", {
      tituloPagina: "Banco de Erros TAB",
      usuarioLogado: req.session.usuario,
      erros,
    });

  } catch (error) {
    console.error("Erro ao carregar banco de erros:", error);
    return res.status(500).send("Erro ao carregar banco de erros geral.");
  }
});

// =====================================================================
// 📊 ANÁLISE POR ÁREA (NOVA TELA)
// =====================================================================
router.get("/tab/analise", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const areaSelecionadaQuery = req.query.area || null;

    const blocos = await TabBloco.findAll({
      where: { usuarioId },
      include: [{ model: TabErro, as: "erros" }],
      order: [
        ["anoProva", "DESC"],
        ["blocoPosicao", "ASC"],
      ],
    });

    if (!blocos || blocos.length === 0) {
      return res.render("tab/analise_area", {
        tituloPagina: "Análise por área TAB",
        usuarioLogado: req.session.usuario,
        areasLista: [],
        areaSelecionada: null,
        blocosArea: [],
        totalBlocosArea: 0,
        totalErrosArea: 0,
        mediaErrosArea: 0,
        errosPorTipoArea: { DESCONHECIMENTO: 0, LACUNA: 0, BANALIDADE: 0 },
        errosPorBloco: [],
      });
    }

    const areasLista = [...new Set(blocos.map(b => b.area))].sort();

    let areaSelecionada = areaSelecionadaQuery;
    if (!areaSelecionada || !areasLista.includes(areaSelecionada)) {
      areaSelecionada = areasLista[0];
    }

    const blocosArea = blocos.filter(b => b.area === areaSelecionada);

    const totalBlocosArea = blocosArea.length;
    const totalErrosArea = blocosArea.reduce(
      (acc, b) => acc + (b.erros ? b.erros.length : 0),
      0
    );
    const mediaErrosArea = totalBlocosArea
      ? (totalErrosArea / totalBlocosArea)
      : 0;

    const errosPorTipoArea = {
      DESCONHECIMENTO: 0,
      LACUNA: 0,
      BANALIDADE: 0,
    };

    blocosArea.forEach(b => {
      (b.erros || []).forEach(e => {
        if (errosPorTipoArea[e.tipoErro] !== undefined) {
          errosPorTipoArea[e.tipoErro]++;
        }
      });
    });

    const errosPorBloco = blocosArea.map(b => ({
      label: `${b.anoProva} – ${b.blocoPosicao}`,
      totalErros: b.erros ? b.erros.length : 0,
    }));

    return res.render("tab/analise_area", {
      tituloPagina: "Análise por área TAB",
      usuarioLogado: req.session.usuario,
      areasLista,
      areaSelecionada,
      blocosArea,
      totalBlocosArea,
      totalErrosArea,
      mediaErrosArea,
      errosPorTipoArea,
      errosPorBloco,
    });

  } catch (error) {
    console.error("Erro ao carregar análise por área:", error);
    return res.status(500).send("Erro ao carregar análise por área.");
  }
});

// =====================================================================
// ✏️ FORMULÁRIO DE EDIÇÃO
// =====================================================================
router.get("/tab/:id/editar", ensureAuth, async (req, res) => {
  const usuarioId = req.session.usuario.id;
  const { id } = req.params;

  const bloco = await TabBloco.findOne({
    where: { id, usuarioId },
    include: [{ model: TabErro, as: "erros" }],
  });

  if (!bloco) return res.status(404).send("Bloco TAB não encontrado.");

  return res.render("tab/edit", {
    tituloPagina: "Editar Bloco TAB",
    usuarioLogado: req.session.usuario,
    bloco,
  });
});

// =====================================================================
// ✏️ SALVAR EDIÇÃO DO BLOCO
// =====================================================================
router.post("/tab/:id/editar", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const { id } = req.params;
    const { anoProva, area, blocoPosicao, provaEtiqueta, errosTexto } = req.body;

    const bloco = await TabBloco.findOne({ where: { id, usuarioId } });
    if (!bloco) return res.status(404).send("Bloco não encontrado.");

    bloco.anoProva = anoProva;
    bloco.area = area;
    bloco.blocoPosicao = blocoPosicao;
    bloco.provaEtiqueta = provaEtiqueta || null;
    await bloco.save();

    await TabErro.destroy({ where: { blocoId: id } });

    await salvarErrosDoFormulario(id, errosTexto);

    return res.redirect(`/tab/${id}`);

  } catch (error) {
    console.error("Erro ao editar bloco TAB:", error);
    res.status(500).send("Erro ao editar bloco TAB.");
  }
});

// =====================================================================
// 🗑️ EXCLUIR BLOCO
// =====================================================================
router.post("/tab/:id/excluir", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const { id } = req.params;

    await TabErro.destroy({ where: { blocoId: id } });
    await TabBloco.destroy({ where: { id, usuarioId } });

    return res.redirect("/tab");

  } catch (error) {
    console.error("Erro ao excluir bloco:", error);
    res.status(500).send("Erro ao excluir bloco.");
  }
});

// =====================================================================
// 🟡 DETALHES DE UM BLOCO TAB (DEIXA POR ÚLTIMO PARA NÃO QUEBRAR ROTAS)
// =====================================================================
router.get("/tab/:id", ensureAuth, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const { id } = req.params;

    const bloco = await TabBloco.findOne({
      where: { id, usuarioId },
      include: [{ model: TabErro, as: "erros" }],
    });

    if (!bloco) return res.status(404).send("Bloco TAB não encontrado.");

    return res.render("tab/detalhe", {
      tituloPagina: "Bloco TAB",
      usuarioLogado: req.session.usuario,
      bloco,
    });

  } catch (error) {
    console.error("Erro ao carregar bloco TAB:", error);
    return res.status(500).send("Erro ao carregar bloco TAB.");
  }
});

// =====================================================================
// FUNÇÃO AUXILIAR — SALVAR ERROS
// =====================================================================
async function salvarErrosDoFormulario(blocoId, errosTexto) {
  if (!errosTexto || errosTexto.trim() === "") return;

  const linhas = errosTexto.split("\n");

  for (let linha of linhas) {
    const clean = linha.trim();
    if (!clean) continue;

    const partes = clean.split("-").map((p) => p.trim());

    const numeroQuestao = partes[0];
    const tipoTexto = (partes[1] || "").toLowerCase();
    const descricao = partes.slice(2).join(" - ");

    let tipoErro = "DESCONHECIMENTO";
    if (tipoTexto.startsWith("l")) tipoErro = "LACUNA";
    if (tipoTexto.startsWith("b")) tipoErro = "BANALIDADE";

    await TabErro.create({
      blocoId,
      numeroQuestao,
      tipoErro,
      descricao,
    });
  }
}

module.exports = router;
