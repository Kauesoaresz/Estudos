module.exports = (sequelize, DataTypes) => {
  const Dia = sequelize.define(
    "Dia",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      data: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      // Sono e rotina
      hora_acordou: {
        type: DataTypes.TIME,
        allowNull: true
      },
      hora_dormiu: {
        type: DataTypes.TIME,
        allowNull: true
      },
      horas_sono_total: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      qualidade_sono_nota: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      tirou_soneca: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      minutos_soneca: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      // Estudos gerais
      horas_estudo_liquidas: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      questoes_feitas_total: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      questoes_acertos_total: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      // Reflexão
      erros_do_dia: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      melhorar_amanha: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ponto_alto_dia: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      maior_vacilo_dia: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Meta
      meta_principal_dia: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status_meta: {
        type: DataTypes.ENUM("SIM", "NAO", "PARCIAL"),
        allowNull: true
      },

      // Estado mental
      nivel_foco: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      nivel_energia: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      humor: {
        type: DataTypes.ENUM("BOM", "OK", "RUIM"),
        allowNull: true
      }
    },
    {
      tableName: "dias"
    }
  );

  return Dia;
};
