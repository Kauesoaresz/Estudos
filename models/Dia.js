module.exports = (sequelize, DataTypes) => {
  const Dia = sequelize.define(
    "Dia",
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

      data: { type: DataTypes.DATEONLY, allowNull: false },

      hora_acordou: DataTypes.TIME,
      hora_dormiu: DataTypes.TIME,
      horas_sono_total: DataTypes.DECIMAL(5,2),
      qualidade_sono_nota: DataTypes.INTEGER,
      tirou_soneca: DataTypes.BOOLEAN,
      minutos_soneca: DataTypes.INTEGER,

      horas_estudo_liquidas: DataTypes.DECIMAL(5,2),
      questoes_feitas_total: DataTypes.INTEGER,
      questoes_acertos_total: DataTypes.INTEGER,

      erros_do_dia: DataTypes.TEXT,
      melhorar_amanha: DataTypes.TEXT,
      ponto_alto_dia: DataTypes.TEXT,
      maior_vacilo_dia: DataTypes.TEXT,

      meta_principal_dia: DataTypes.TEXT,
      status_meta: DataTypes.ENUM("SIM", "NAO", "PARCIAL"),

      nivel_foco: DataTypes.INTEGER,
      nivel_energia: DataTypes.INTEGER,
      humor: DataTypes.ENUM("BOM","OK","RUIM")
    },
    {
      tableName: "dias"
    }
  );

  Dia.associate = (models) => {
    Dia.belongsTo(models.Usuario, { foreignKey: "usuario_id", as: "usuario" });
    Dia.hasMany(models.EstudoMateriaDia, { foreignKey: "dia_id", as: "estudos_materias" });
    Dia.hasMany(models.Simulado, { foreignKey: "dia_id", as: "simulados" });
  };

  return Dia;
};
