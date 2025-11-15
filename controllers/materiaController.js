// controllers/materiaController.js
//
// Controla tudo relacionado às MATÉRIAS:
// - Listar
// - Criar
// - Detalhes (com resumo)
// - Editar
// - Atualizar
// - Excluir

const { Materia, EstudoMateriaDia, Dia } = require("../models");
const { formatarDDMMYYYY } = require("../utils/datas");

// ---------------------
// LISTAR MATÉRIAS
// ---------------------
async function listarMaterias(req, res) {
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
    console.error("❌ Erro ao listar matérias:", error);
    return res
      .status(500)
      .send("Erro ao carregar matérias. Veja o console para mais detalhes.");
  }
}

// ---------------------
// CRIAR MATÉRIA
// ---------------------
async function criarMateria(req, res) {
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
    console.error("❌ Erro ao criar matéria:", error);
    return res
      .status(500)
      .send("Erro ao criar matéria. Veja o console para mais detalhes.");
  }
}

// ---------------------
// DETALHE DE UMA MATÉRIA
// ---------------------
async function detalheMateria(req, res) {
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

    // ----- CALCULAR RESUMO -----
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
}

// ---------------------
// EDITAR MATÉRIA (form)
// ---------------------
async function editarMateriaForm(req, res) {
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
}

// ---------------------
// ATUALIZAR MATÉRIA
// ---------------------
async function atualizarMateria(req, res) {
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
}

// ---------------------
// EXCLUIR MATÉRIA
// (só se não tiver estudos relacionados)
// ---------------------
async function excluirMateria(req, res) {
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
}

module.exports = {
  listarMaterias,
  criarMateria,
  detalheMateria,
  editarMateriaForm,
  atualizarMateria,
  excluirMateria
};
