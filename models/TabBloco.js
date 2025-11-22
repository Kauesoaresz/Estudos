// models/TabBloco.js

module.exports = (sequelize, DataTypes) => {
  const TabBloco = sequelize.define(
    "TabBloco",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      usuarioId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },

      anoProva: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },

      area: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      blocoPosicao: {
        // AGORA: valores como "91-105", "136-150", etc.
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      provaEtiqueta: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: "tab_blocos",
      underscored: true,
      timestamps: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em",
    }
  );

  TabBloco.associate = (models) => {
    TabBloco.belongsTo(models.Usuario, {
      foreignKey: "usuarioId",
      as: "usuario",
    });

    TabBloco.hasMany(models.TabErro, {
      foreignKey: "blocoId",
      as: "erros",
      onDelete: "CASCADE",
    });
  };

  return TabBloco;
};
