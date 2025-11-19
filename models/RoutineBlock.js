// models/RoutineBlock.js

module.exports = (sequelize, DataTypes) => {
  const RoutineBlock = sequelize.define(
    "RoutineBlock",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },

      // 0 = segunda ... 6 = domingo
      weekday: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      startTime: {
        type: DataTypes.TIME,
        allowNull: false
      },

      endTime: {
        type: DataTypes.TIME,
        allowNull: false
      },

      title: {
        type: DataTypes.STRING(80),
        allowNull: false
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      color: {
        type: DataTypes.STRING(20),
        allowNull: true
      },

      // segue o padrão do projeto: usuario_id (UNSIGNED)
      usuario_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      }
    },
    {
      tableName: "routine_blocks",
      underscored: true
    }
  );

  return RoutineBlock;
};
