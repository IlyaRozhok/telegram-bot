import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Income = sequelize.define("income", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  telegram_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("regular", "irregular"),
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  frequency: {
    type: DataTypes.ENUM("monthly", "weekly", "daily", "yearly", "one-time"),
    defaultValue: "one-time",
  },
  description: {
    type: DataTypes.STRING,
  },
  date_received: {
    type: DataTypes.DATE,
  },
  next_expected: {
    type: DataTypes.DATE,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Income;
