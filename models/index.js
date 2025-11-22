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
const RoutineBlockModel = require("./RoutineBlock");
const RevisaoProgramadaModel = require("./RevisaoProgramada");

// 🟩 MODELS NOVOS DA TÉCNICA TAB
const TabBlocoModel = require("./TabBloco");
const TabErroModel = require("./TabErro");

// INICIALIZA TODOS OS MODELS
const Usuario = UsuarioModel(sequelize, DataTypes);
const Dia = DiaModel(sequelize, DataTypes);
const Materia = MateriaModel(sequelize, DataTypes);
const EstudoMateriaDia = EstudoMateriaDiaModel(sequelize, DataTypes);
const Simulado = SimuladoModel(sequelize, DataTypes);
const Medalha = MedalhaModel(sequelize, DataTypes);
const MedalhaUsuario = MedalhaUsuarioModel(sequelize, DataTypes);
const RoutineBlock = RoutineBlockModel(sequelize, DataTypes);
const RevisaoProgramada = RevisaoProgramadaModel(sequelize, DataTypes);

// 🟩 INICIALIZAÇÃO DOS MODELS DO TAB
const TabBloco = TabBlocoModel(sequelize, DataTypes);
const TabErro = TabErroModel(sequelize, DataTypes);

// =============================================================
//  ASSOCIAÇÕES COMPLETAS DO SISTEMA
// =============================================================

// ---- USUÁRIO x DIA ----
Usuario.hasMany(Dia, { foreignKey: "usuario_id", as: "dias" });
Dia.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

// ---- USUÁRIO x MATÉRIA ----
Usuario.hasMany(Materia, { foreignKey: "usuario_id", as: "materias" });
Materia.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

// ---- USUÁRIO x ESTUDO_MATERIA_DIA ----
Usuario.hasMany(EstudoMateriaDia, { foreignKey: "usuario_id", as: "estudos" });
EstudoMateriaDia.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

// ---- USUÁRIO x SIMULADO ----
Usuario.hasMany(Simulado, { foreignKey: "usuario_id", as: "simulados" });
Simulado.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

// ---- USUÁRIO x MEDALHA_USUARIO ----
Usuario.hasMany(MedalhaUsuario, { foreignKey: "usuario_id", as: "medalhas_usuario" });
MedalhaUsuario.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

// ---- DIA x ESTUDO_MATERIA_DIA ----
Dia.hasMany(EstudoMateriaDia, { foreignKey: "dia_id", as: "estudos_materias" });
EstudoMateriaDia.belongsTo(Dia, { foreignKey: "dia_id", as: "dia" });

// ---- MATÉRIA x ESTUDO_MATERIA_DIA ----
Materia.hasMany(EstudoMateriaDia, { foreignKey: "materia_id", as: "estudos" });
EstudoMateriaDia.belongsTo(Materia, { foreignKey: "materia_id", as: "materia" });

// ---- DIA x SIMULADO ----
Dia.hasMany(Simulado, { foreignKey: "dia_id", as: "simulados" });
Simulado.belongsTo(Dia, { foreignKey: "dia_id", as: "dia" });

// ---- MEDALHA x MEDALHA_USUARIO ----
Medalha.hasMany(MedalhaUsuario, { foreignKey: "medalha_id", as: "conquistas" });
MedalhaUsuario.belongsTo(Medalha, { foreignKey: "medalha_id", as: "medalha" });

// ---- USUÁRIO x ROUTINE_BLOCK ----
Usuario.hasMany(RoutineBlock, { foreignKey: "usuario_id", as: "routine_blocks" });
RoutineBlock.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

// =============================================================
//  REVISÕES PROGRAMADAS – ASSOCIAÇÕES
// =============================================================
Usuario.hasMany(RevisaoProgramada, {
  foreignKey: "usuario_id",
  as: "revisoes_programadas"
});
RevisaoProgramada.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario"
});

Materia.hasMany(RevisaoProgramada, {
  foreignKey: "materia_id",
  as: "revisoes_programadas"
});
RevisaoProgramada.belongsTo(Materia, {
  foreignKey: "materia_id",
  as: "materia"
});

EstudoMateriaDia.hasMany(RevisaoProgramada, {
  foreignKey: "origem_id",
  as: "revisoes_geradas"
});
RevisaoProgramada.belongsTo(EstudoMateriaDia, {
  foreignKey: "origem_id",
  as: "estudo_origem"
});

// =============================================================
//  🔥 ASSOCIAÇÕES DA TÉCNICA TAB
// =============================================================

// USUÁRIO x TAB_BLOCO
Usuario.hasMany(TabBloco, {
  foreignKey: "usuarioId",
  as: "tab_blocos"
});
TabBloco.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario"
});

// TAB_BLOCO x TAB_ERRO
TabBloco.hasMany(TabErro, {
  foreignKey: "blocoId",
  as: "erros",
  onDelete: "CASCADE"
});
TabErro.belongsTo(TabBloco, {
  foreignKey: "blocoId",
  as: "bloco"
});

// =============================================================
//  EXPORTA TUDO
// =============================================================
const db = {
  sequelize,
  Usuario,
  Dia,
  Materia,
  EstudoMateriaDia,
  Simulado,
  Medalha,
  MedalhaUsuario,
  RoutineBlock,
  RevisaoProgramada,

  // 🔥 EXPORTA OS MODELS DA TAB
  TabBloco,
  TabErro
};

module.exports = db;
