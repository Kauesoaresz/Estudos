// models/index.js
"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// IMPORT MODELS
const DiaModel = require("./Dia");
const MateriaModel = require("./Materia");
const EstudoMateriaDiaModel = require("./EstudoMateriaDia");
const SimuladoModel = require("./Simulado");
const MedalhaModel = require("./Medalha");
const MedalhaUsuarioModel = require("./MedalhaUsuario");


// INIT MODELS
const Dia = DiaModel(sequelize, DataTypes);
const Materia = MateriaModel(sequelize, DataTypes);
const EstudoMateriaDia = EstudoMateriaDiaModel(sequelize, DataTypes);
const Simulado = SimuladoModel(sequelize, DataTypes);
const Medalha = MedalhaModel(sequelize, DataTypes);
const MedalhaUsuario = MedalhaUsuarioModel(sequelize, DataTypes);


// ===============================
// ASSOCIAÇÕES
// ===============================

// Dia 1:N EstudoMateriaDia
Dia.hasMany(EstudoMateriaDia, {
  foreignKey: "dia_id",
  as: "estudos_materias"
});
EstudoMateriaDia.belongsTo(Dia, {
  foreignKey: "dia_id",
  as: "dia"
});

// Materia 1:N EstudoMateriaDia
Materia.hasMany(EstudoMateriaDia, {
  foreignKey: "materia_id",
  as: "estudos"
});
EstudoMateriaDia.belongsTo(Materia, {
  foreignKey: "materia_id",
  as: "materia"
});

// Dia 1:N Simulado
Dia.hasMany(Simulado, {
  foreignKey: "dia_id",
  as: "simulados"
});
Simulado.belongsTo(Dia, {
  foreignKey: "dia_id",
  as: "dia"
});

// 1 Medalha pode ser conquistada muitas vezes por usuários (futuro multiusuário)
Medalha.hasMany(MedalhaUsuario, {
  foreignKey: "medalha_id",
  as: "conquistas"
});
MedalhaUsuario.belongsTo(Medalha, {
  foreignKey: "medalha_id",
  as: "medalha"
});

// EXPORT FINAL
const db = {
  sequelize,
  Dia,
  Materia,
  EstudoMateriaDia,
  Simulado,
  Medalha,
  MedalhaUsuario
};


module.exports = db;
