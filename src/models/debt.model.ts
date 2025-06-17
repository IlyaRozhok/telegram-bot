import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Debt = sequelize.define("debt", {
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
    type: DataTypes.ENUM("bank", "other"),
    allowNull: false,
  },
  bank_name: {
    type: DataTypes.STRING,
  },
  creditor_name: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  interest_rate: {
    type: DataTypes.DECIMAL(5, 2),
  },
  monthly_interest: {
    type: DataTypes.DECIMAL(10, 2),
  },
  comment: {
    type: DataTypes.STRING,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Debt;
