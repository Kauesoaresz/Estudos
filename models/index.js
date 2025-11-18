// models/index.js
"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// IMPORT DE TODOS OS MODELS
const UsuarioModel = require("./Usuario");
const DiaModel = require("./Dia");
const MateriaModel = require("./Materia");
const EstudoMateriaDiaModel = require("./EstudoMateriaDia");
const SimuladoModel = require("./Simulado");
const MedalhaModel = require("./Medalha");
const MedalhaUsuarioModel = require("./MedalhaUsuario");

// INICIALIZA OS MODELS
const Usuario = UsuarioModel(sequelize, DataTypes);
const Dia = DiaModel(sequelize, DataTypes);
const Materia = MateriaModel(sequelize, DataTypes);
const EstudoMateriaDia = EstudoMateriaDiaModel(sequelize, DataTypes);
const Simulado = SimuladoModel(sequelize, DataTypes);
const Medalha = MedalhaModel(sequelize, DataTypes);
const MedalhaUsuario = MedalhaUsuarioModel(sequelize, DataTypes);

// ===============================
// ASSOCIAÇÕES ENTRE OS MODELS
// ===============================

// ---- USUÁRIO x DIA ----
// 1 usuário tem vários dias
Usuario.hasMany(Dia, {
  foreignKey: "usuario_id",
  as: "dias"
});
Dia.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario"
});

// ---- USUÁRIO x MATÉRIA ----
Usuario.hasMany(Materia, {
  foreignKey: "usuario_id",
  as: "materias"
});
Materia.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario"
});

// ---- USUÁRIO x ESTUDO_MATERIA_DIA ----
Usuario.hasMany(EstudoMateriaDia, {
  foreignKey: "usuario_id",
  as: "estudos"
});
EstudoMateriaDia.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario"
});

// ---- USUÁRIO x SIMULADO ----
Usuario.hasMany(Simulado, {
  foreignKey: "usuario_id",
  as: "simulados"
});
Simulado.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario"
});

// ---- USUÁRIO x MEDALHA_USUARIO ----
Usuario.hasMany(MedalhaUsuario, {
  foreignKey: "usuario_id",
  as: "medalhas_usuario"
});
MedalhaUsuario.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario"
});

// ---- DIA x ESTUDO_MATERIA_DIA ----
Dia.hasMany(EstudoMateriaDia, {
  foreignKey: "dia_id",
  as: "estudos_materias"
});
EstudoMateriaDia.belongsTo(Dia, {
  foreignKey: "dia_id",
  as: "dia"
});

// ---- MATÉRIA x ESTUDO_MATERIA_DIA ----
Materia.hasMany(EstudoMateriaDia, {
  foreignKey: "materia_id",
  as: "estudos"
});
EstudoMateriaDia.belongsTo(Materia, {
  foreignKey: "materia_id",
  as: "materia"
});

// ---- DIA x SIMULADO ----
Dia.hasMany(Simulado, {
  foreignKey: "dia_id",
  as: "simulados"
});
Simulado.belongsTo(Dia, {
  foreignKey: "dia_id",
  as: "dia"
});

// ---- MEDALHA x MEDALHA_USUARIO ----
Medalha.hasMany(MedalhaUsuario, {
  foreignKey: "medalha_id",
  as: "conquistas"
});
MedalhaUsuario.belongsTo(Medalha, {
  foreignKey: "medalha_id",
  as: "medalha"
});

// ===============================
// EXPORTA TUDO
// ===============================
const db = {
  sequelize,
  Usuario,
  Dia,
  Materia,
  EstudoMateriaDia,
  Simulado,
  Medalha,
  MedalhaUsuario
};

module.exports = db;
