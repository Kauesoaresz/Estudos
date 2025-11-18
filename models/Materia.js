module.exports = (sequelize, DataTypes) => {
  const Materia = sequelize.define(
    "Materia",
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

      nome: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    },
    {
      tableName: "materias"
    }
  );

  Materia.associate = (models) => {
    Materia.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    Materia.hasMany(models.EstudoMateriaDia, { foreignKey: "materia_id", as: "estudos" });
  };

  return Materia;
};
