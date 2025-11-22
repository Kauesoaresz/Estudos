// models/TabErro.js

module.exports = (sequelize, DataTypes) => {
  const TabErro = sequelize.define(
    "TabErro",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      blocoId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },

      numeroQuestao: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      tipoErro: {
        // "DESCONHECIMENTO", "LACUNA", "BANALIDADE"
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      descricao: {
        // Ex: "Lacuna em análise combinatória (princípio multiplicativo)"
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "tab_erros",
      underscored: true,
    }
  );

  TabErro.associate = (models) => {
    TabErro.belongsTo(models.TabBloco, {
      foreignKey: "blocoId",
      as: "bloco",
    });
  };

  return TabErro;
};
