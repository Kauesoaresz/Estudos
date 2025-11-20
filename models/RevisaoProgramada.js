// models/RevisaoProgramada.js
module.exports = (sequelize, DataTypes) => {
  const RevisaoProgramada = sequelize.define(
    "RevisaoProgramada",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      usuario_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      materia_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      data_programada: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      tipo_ciclo: {
        type: DataTypes.ENUM("R1", "R2", "R3", "R4", "R5"),
        allowNull: false
      },
      origem_id: {
        // estudo que gerou essa revisão
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("pendente", "feito", "ignorado"),
        allowNull: false,
        defaultValue: "pendente"
      }
    },
    {
      tableName: "revisoes_programadas",
      timestamps: false,
      underscored: true
    }
  );

  return RevisaoProgramada;
};
