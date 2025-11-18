module.exports = (sequelize, DataTypes) => {
  const Medalha = sequelize.define(
    "Medalha",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      nome: DataTypes.STRING,
      descricao: DataTypes.STRING,
      categoria: DataTypes.STRING,
      tipo_trigger: DataTypes.STRING,
      valor_trigger: DataTypes.INTEGER
    },
    {
      tableName: "medalhas"
    }
  );

  Medalha.associate = (models) => {
    Medalha.hasMany(models.MedalhaUsuario, {
      foreignKey: "medalha_id",
      as: "usuarios"
    });
  };

  return Medalha;
};
