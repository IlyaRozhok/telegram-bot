"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "currency", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "UAH", // По умолчанию гривна
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "currency");
  },
};
