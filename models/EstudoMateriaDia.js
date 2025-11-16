module.exports = (sequelize, DataTypes) => {
  const EstudoMateriaDia = sequelize.define(
    "EstudoMateriaDia",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      dia_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      materia_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },

      minutos_estudados: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      topicos_estudados: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Mantemos ENUM porque o banco já está assim
      tipo_estudo: {
        type: DataTypes.ENUM(
          "CONTEUDO_NOVO",
          "REVISAO",
          "REVISAO_ERRO"
        ),
        allowNull: true
      },

      questoes_feitas: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      questoes_certas: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      questoes_marcadas_revisao: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "estudos_materia_dia"
    }
  );

  return EstudoMateriaDia;
};
