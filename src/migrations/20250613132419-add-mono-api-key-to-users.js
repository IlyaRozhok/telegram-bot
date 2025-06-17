"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "mono_api_key", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Monobank API key for transaction sync",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "mono_api_key");
  },
};
