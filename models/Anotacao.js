const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Anotacao = sequelize.define("Anotacao", {
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  importante: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
}

});

module.exports = Anotacao;
