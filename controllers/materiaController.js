// controllers/materiaController.js
//
// Controla MATÉRIAS no modo multiusuário.
// Cada usuário tem SUAS próprias matérias e estudos.

const { Materia, EstudoMateriaDia, Dia } = require("../models");

// ---------------------
// LISTAR MATÉRIAS
// ---------------------
async function listarMaterias(req, res) {
  try {
    const usuarioId = req.session.usuario.id;

    const sucesso = req.query.sucesso === "1";
    const erro = req.query.erro === "1";
    const erroExcluir = req.query.erroExcluir === "1";

    const materias = await Materia.findAll({
      where: { usuario_id: usuarioId },
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
    return res.status(500).send("Erro ao carregar matérias.");
  }
}

// ---------------------
// CRIAR MATÉRIA
// ---------------------
async function criarMateria(req, res) {
  try {
    const usuarioId = req.session.usuario.id;
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.redirect("/materias?erro=1");
    }

    await Materia.create({
      nome: nome.trim(),
      usuario_id: usuarioId
    });

    return res.redirect("/materias?sucesso=1");
  } catch (error) {
    console.error("❌ Erro ao criar matéria:", error);
    return res.status(500).send("Erro ao criar matéria.");
  }
}

// ---------------------
// DETALHE DE UMA MATÉRIA
// ---------------------
async function detalheMateria(req, res) {
  const usuarioId = req.session.usuario.id;
  const id = req.params.id;

  try {
    const materia = await Materia.findOne({
      where: { id, usuario_id: usuarioId },
      include: [
        {
          model: EstudoMateriaDia,
          as: "estudos",
          include: [
            {
              model: Dia,
              as: "dia",
              attributes: ["data"],
              where: { usuario_id: usuarioId }
            }
          ]
        }
      ]
    });

    if (!materia) {
      return res.status(404).send("Matéria não encontrada.");
    }

    const mat = materia.get({ plain: true });

    // ----- CALCULAR RESUMO GERAL -----
    let totalMinutos = 0;
    let totalQuestoes = 0;
    let totalCertas = 0;
    const diasSet = new Set();

    (mat.estudos || []).forEach((e) => {
      totalMinutos += Number(e.minutos_estudados || 0);
      totalQuestoes += Number(e.questoes_feitas || 0);
      totalCertas += Number(e.questoes_certas || 0);

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

    // ============================================================
    // AGRUPAR TÓPICOS: mesmo nome = linha única somando minutos
    // ============================================================
    const mapaTopicos = {}; // key: texto normalizado

    (mat.estudos || []).forEach((est) => {
      if (!est.topicos_estudados || !est.topicos_estudados.trim()) return;

      const textoOriginal = est.topicos_estudados.trim();
      const minutos = est.minutos_estudados ? Number(est.minutos_estudados) : 0;
      const data = est.dia?.data || null;

      // normaliza pra agrupar (pode ajustar se quiser case-sensitive)
      const chave = textoOriginal.toLowerCase();

      if (!mapaTopicos[chave]) {
        mapaTopicos[chave] = {
          texto: textoOriginal,
          minutosTotal: 0,
          vezes: 0,
          primeiraData: data,
          ultimaData: data
        };
      }

      const registro = mapaTopicos[chave];
      registro.minutosTotal += minutos;
      registro.vezes += 1;

      if (data) {
        const d = new Date(data);
        if (!registro.primeiraData || d < new Date(registro.primeiraData)) {
          registro.primeiraData = data;
        }
        if (!registro.ultimaData || d > new Date(registro.ultimaData)) {
          registro.ultimaData = data;
        }
      }
    });

    // transforma em array e ordena por minutos desc
    const topicosAgrupados = Object.values(mapaTopicos).sort(
      (a, b) => b.minutosTotal - a.minutosTotal
    );

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
      },
      topicos: topicosAgrupados
    });
  } catch (error) {
    console.error("❌ Erro ao detalhar matéria:", error);
    return res.status(500).send("Erro ao carregar detalhes da matéria.");
  }
}

// ---------------------
// EDITAR MATÉRIA (form)
// ---------------------
async function editarMateriaForm(req, res) {
  const usuarioId = req.session.usuario.id;
  const id = req.params.id;

  try {
    const materia = await Materia.findOne({
      where: { id, usuario_id: usuarioId },
      raw: true
    });

    if (!materia) {
      return res.status(404).send("Matéria não encontrada.");
    }

    res.render("materia_editar", {
      tituloPagina: "Editar matéria",
      materia
    });
  } catch (error) {
    console.error("❌ Erro ao carregar matéria para edição:", error);
    return res.status(500).send("Erro ao carregar matéria para edição.");
  }
}

// ---------------------
// ATUALIZAR MATÉRIA
// ---------------------
async function atualizarMateria(req, res) {
  const usuarioId = req.session.usuario.id;
  const id = req.params.id;

  try {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
      return res.redirect(`/materias/${id}/editar`);
    }

    await Materia.update(
      { nome: nome.trim() },
      { where: { id, usuario_id: usuarioId } }
    );

    return res.redirect("/materias");
  } catch (error) {
    console.error("❌ Erro ao atualizar matéria:", error);
    return res.status(500).send("Erro ao atualizar matéria.");
  }
}

// ---------------------
// EXCLUIR MATÉRIA
// ---------------------
async function excluirMateria(req, res) {
  const usuarioId = req.session.usuario.id;
  const id = req.params.id;

  try {
    const count = await EstudoMateriaDia.count({
      where: { materia_id: id },
      include: [
        {
          model: Dia,
          as: "dia",
          where: { usuario_id: usuarioId }
        }
      ]
    });

    if (count > 0) {
      return res.redirect("/materias?erroExcluir=1");
    }

    await Materia.destroy({
      where: { id, usuario_id: usuarioId }
    });

    return res.redirect("/materias");
  } catch (error) {
    console.error("❌ Erro ao excluir matéria:", error);
    return res.status(500).send("Erro ao excluir matéria.");
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
