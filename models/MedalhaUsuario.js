module.exports = (sequelize, DataTypes) => {
  const MedalhaUsuario = sequelize.define(
    "MedalhaUsuario",
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

      medalha_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },

      data_conquista: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "medalhas_usuario",
      timestamps: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em"
    }
  );

  MedalhaUsuario.associate = models => {
    MedalhaUsuario.belongsTo(models.Usuario, {
      foreignKey: "usuario_id",
      as: "usuario"
    });

    MedalhaUsuario.belongsTo(models.Medalha, {
      foreignKey: "medalha_id",
      as: "medalha"
    });
  };

  return MedalhaUsuario;
};
