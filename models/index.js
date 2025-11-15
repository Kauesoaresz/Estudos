const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DiaModel = require("./Dia");
const MateriaModel = require("./Materia");
const EstudoMateriaDiaModel = require("./EstudoMateriaDia");
const SimuladoModel = require("./Simulado");

const Dia = DiaModel(sequelize, DataTypes);
const Materia = MateriaModel(sequelize, DataTypes);
const EstudoMateriaDia = EstudoMateriaDiaModel(sequelize, DataTypes);
const Simulado = SimuladoModel(sequelize, DataTypes);

// Associações

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

const db = {
  sequelize,
  Dia,
  Materia,
  EstudoMateriaDia,
  Simulado
};

module.exports = db;
