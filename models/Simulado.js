module.exports = (sequelize, DataTypes) => {
  const Simulado = sequelize.define(
    "Simulado",
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

      resultado_resumo: DataTypes.TEXT,
      tempo_total_minutos: DataTypes.INTEGER,

      acertos_linguagens: DataTypes.INTEGER,
      acertos_humanas: DataTypes.INTEGER,
      acertos_naturezas: DataTypes.INTEGER,
      acertos_matematica: DataTypes.INTEGER,

      area_que_mais_errou: DataTypes.STRING(100),
      principal_dificuldade: DataTypes.STRING(100)
    },
    {
      tableName: "simulados"
    }
  );

  Simulado.associate = (models) => {
    Simulado.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    Simulado.belongsTo(models.Dia, { foreignKey: "dia_id", as: "dia" });
  };

  return Simulado;
};
