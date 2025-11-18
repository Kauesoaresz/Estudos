module.exports = (sequelize, DataTypes) => {
  const EstudoMateriaDia = sequelize.define(
    "EstudoMateriaDia",
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

      dia_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },

      materia_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },

      minutos_estudados: DataTypes.INTEGER,
      topicos_estudados: DataTypes.TEXT,
      tipo_estudo: DataTypes.ENUM("CONTEUDO_NOVO", "REVISAO", "REVISAO_ERRO"),

      questoes_feitas: DataTypes.INTEGER,
      questoes_certas: DataTypes.INTEGER,
      questoes_marcadas_revisao: DataTypes.INTEGER
    },
    {
      tableName: "estudos_materia_dia"
    }
  );

  EstudoMateriaDia.associate = (models) => {
    EstudoMateriaDia.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    EstudoMateriaDia.belongsTo(models.Dia, { foreignKey: "dia_id", as: "dia" });
    EstudoMateriaDia.belongsTo(models.Materia, { foreignKey: "materia_id", as: "materia" });
  };

  return EstudoMateriaDia;
};
