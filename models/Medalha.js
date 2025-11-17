module.exports = (sequelize, DataTypes) => {
  const Medalha = sequelize.define(
    "Medalha",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      descricao: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      categoria: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      tipo_trigger: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      valor_trigger: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    },
    {
      tableName: "medalhas"
    }
  );

  // 🔥 ASSOCIAÇÃO QUE FALTAVA
  Medalha.associate = models => {
    Medalha.hasMany(models.MedalhaUsuario, {
      foreignKey: "medalha_id",
      as: "usuarios"
    });
  };

  return Medalha;
};
