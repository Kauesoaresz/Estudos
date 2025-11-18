module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      nome: {
        type: DataTypes.STRING,
        allowNull: false
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      senha_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },

      foto: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      tableName: "usuarios",
      timestamps: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em"
    }
  );

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Dia, { foreignKey: "usuario_id", as: "dias" });
    Usuario.hasMany(models.Materia, { foreignKey: "usuario_id", as: "materias" });
    Usuario.hasMany(models.EstudoMateriaDia, { foreignKey: "usuario_id", as: "estudos" });
    Usuario.hasMany(models.Simulado, { foreignKey: "usuario_id", as: "simulados" });
    Usuario.hasMany(models.MedalhaUsuario, { foreignKey: "usuario_id", as: "medalhas_usuario" });
  };

  return Usuario;
};
