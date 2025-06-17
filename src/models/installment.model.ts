import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Installment = sequelize.define("installment", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  telegram_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount_per_month: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  total_cost: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  service_fee: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  months_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  months_remaining: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_remaining: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  comment: {
    type: DataTypes.STRING,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  final_payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Installment;
