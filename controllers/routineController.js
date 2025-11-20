// controllers/routineController.js

const db = require("../models");
const RoutineBlock = db.RoutineBlock;

const diasSemana = [
  { value: 0, label: "Segunda", short: "Seg" },
  { value: 1, label: "Terça", short: "Ter" },
  { value: 2, label: "Quarta", short: "Qua" },
  { value: 3, label: "Quinta", short: "Qui" },
  { value: 4, label: "Sexta", short: "Sex" },
  { value: 5, label: "Sábado", short: "Sáb" },
  { value: 6, label: "Domingo", short: "Dom" }
];

function getUserId(req) {
  return req.session?.usuario?.id || null;
}

function formatTimeForView(time) {
  if (!time) return "";
  if (typeof time === "string" && time.length >= 5) {
    return time.slice(0, 5);
  }
  return time;
}

module.exports = {

  // GET /rotina
  async index(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const blocks = await RoutineBlock.findAll({
        where: { usuario_id: usuarioId },
        order: [
          ["weekday", "ASC"],
          ["startTime", "ASC"]
        ]
      });

      const rotinaPorDia = [[], [], [], [], [], [], []];

      blocks.forEach((b) => {
        if (b.weekday >= 0 && b.weekday <= 6) {
          const plain = b.get({ plain: true });
          plain.startTime = formatTimeForView(plain.startTime);
          plain.endTime = formatTimeForView(plain.endTime);
          rotinaPorDia[b.weekday].push(plain);
        }
      });

      return res.render("rotina/index", {
        tituloPagina: "Rotina",
        rotinaPorDia,
        diasSemana,
        layout: "layouts/blank"
      });

    } catch (error) {
      console.error("Erro ao carregar rotina:", error);
      return res.status(500).send("Erro ao carregar rotina");
    }
  },

  // GET /rotina/novo
  showCreateForm(req, res) {
    const selectedWeekday = isNaN(parseInt(req.query.weekday, 10))
      ? 0
      : parseInt(req.query.weekday, 10);

    return res.render("rotina/form", {
      tituloPagina: "Novo bloco da rotina",
      diasSemana,
      routineBlock: null,
      formAction: "/rotina/novo",
      selectedWeekday,
      isEdit: false,
      layout: "layouts/blank"
    });
  },

  // POST /rotina/novo
  async create(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const { weekday, startTime, endTime, title, description, color } =
        req.body;

      await RoutineBlock.create({
        weekday: parseInt(weekday, 10),
        startTime,
        endTime,
        title: title?.trim(),
        description: description?.trim() || null,
        color: color || null,
        usuario_id: usuarioId
      });

      return res.redirect("/rotina");

    } catch (error) {
      console.error("Erro ao criar bloco:", error);
      return res.status(500).send("Erro ao criar bloco de rotina");
    }
  },

  // GET /rotina/:id/editar
  async showEditForm(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const { id } = req.params;

      const routineBlock = await RoutineBlock.findOne({
        where: { id, usuario_id: usuarioId }
      });

      if (!routineBlock) return res.redirect("/rotina");

      const plain = routineBlock.get({ plain: true });
      plain.startTime = formatTimeForView(plain.startTime);
      plain.endTime = formatTimeForView(plain.endTime);

      return res.render("rotina/form", {
        tituloPagina: "Editar bloco da rotina",
        diasSemana,
        routineBlock: plain,
        formAction: `/rotina/${id}/editar`,
        selectedWeekday: plain.weekday,
        isEdit: true,
        layout: "layouts/blank"
      });

    } catch (error) {
      console.error("Erro ao carregar edição:", error);
      return res.status(500).send("Erro ao carregar bloco");
    }
  },

  // POST /rotina/:id/editar
  async update(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const { id } = req.params;
      const { weekday, startTime, endTime, title, description, color } =
        req.body;

      const routineBlock = await RoutineBlock.findOne({
        where: { id, usuario_id: usuarioId }
      });

      if (!routineBlock) return res.redirect("/rotina");

      routineBlock.weekday = parseInt(weekday, 10);
      routineBlock.startTime = startTime;
      routineBlock.endTime = endTime;
      routineBlock.title = title?.trim();
      routineBlock.description = description?.trim() || null;
      routineBlock.color = color || null;

      await routineBlock.save();

      return res.redirect("/rotina");

    } catch (error) {
      console.error("Erro ao atualizar bloco:", error);
      return res.status(500).send("Erro ao atualizar bloco");
    }
  },

  // POST /rotina/:id/excluir
  async destroy(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const { id } = req.params;

      await RoutineBlock.destroy({
        where: { id, usuario_id: usuarioId }
      });

      return res.redirect("/rotina");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      return res.status(500).send("Erro ao excluir bloco");
    }
  },

  // POST /rotina/:id/duplicar
  async duplicate(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const { id } = req.params;
      const { targetWeekday } = req.body;

      const original = await RoutineBlock.findOne({
        where: { id, usuario_id: usuarioId }
      });

      if (!original) return res.redirect("/rotina");

      await RoutineBlock.create({
        weekday: parseInt(targetWeekday, 10),
        startTime: original.startTime,
        endTime: original.endTime,
        title: original.title,
        description: original.description,
        color: original.color,
        usuario_id: usuarioId
      });

      return res.redirect("/rotina");

    } catch (error) {
      console.error("Erro ao duplicar:", error);
      return res.status(500).send("Erro ao duplicar bloco");
    }
  },

  // POST /rotina/:id/duplicar-multiplos  ← NOVO
  async duplicateMultiple(req, res) {
    try {
      const usuarioId = getUserId(req);
      if (!usuarioId) return res.redirect("/login");

      const { id } = req.params;
      const { targetWeekdays } = req.body; // ex: "1,3,5"

      if (!targetWeekdays || targetWeekdays.trim() === "") {
        return res.redirect("/rotina");
      }

      const dias = targetWeekdays
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d !== "");

      if (dias.length === 0) return res.redirect("/rotina");

      const original = await RoutineBlock.findOne({
        where: { id, usuario_id: usuarioId }
      });

      if (!original) return res.redirect("/rotina");

      // Criar para cada dia marcado
      for (const weekday of dias) {
        await RoutineBlock.create({
          weekday: parseInt(weekday, 10),
          startTime: original.startTime,
          endTime: original.endTime,
          title: original.title,
          description: original.description,
          color: original.color,
          usuario_id: usuarioId
        });
      }

      return res.redirect("/rotina");

    } catch (error) {
      console.error("Erro ao duplicar múltiplos:", error);
      return res.status(500).send("Erro ao duplicar blocos");
    }
  }
};
