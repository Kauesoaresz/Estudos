module.exports = (sequelize, DataTypes) => {
  const Simulado = sequelize.define(
    "Simulado",
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

      // Resultado geral em texto (TRI, nota, resumo etc.)
      resultado_resumo: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Tempo total de prova (em minutos)
      tempo_total_minutos: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      // Acertos por área do ENEM
      acertos_linguagens: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      acertos_humanas: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      acertos_naturezas: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      acertos_matematica: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      // Anotações qualitativas
      area_que_mais_errou: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      principal_dificuldade: {
        type: DataTypes.STRING(100),
        allowNull: true
      }
    },
    {
      tableName: "simulados"
    }
  );

  return Simulado;
};
