const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "estudos",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "KaueEstudos123!",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em"
    }
  }
);

module.exports = sequelize;
