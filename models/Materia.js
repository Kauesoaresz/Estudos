module.exports = (sequelize, DataTypes) => {
  const Materia = sequelize.define(
    "Materia",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    },
    {
      tableName: "materias"
    }
  );

  return Materia;
};
