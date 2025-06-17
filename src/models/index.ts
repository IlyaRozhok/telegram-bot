import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import Debt from "./debt.model.js";
import Income from "./income.model.js";
import Feedback from "./feedback.model.js";
import Installment from "./installment.model.js";
import Expense from "./expense.model.js";

interface Db {
  sequelize: Sequelize;
  User: typeof User;
  Debt: typeof Debt;
  Income: typeof Income;
  Feedback: typeof Feedback;
  Installment: typeof Installment;
  Expense: typeof Expense;
  [key: string]: any;
}

const db: Db = {
  sequelize,
  User,
  Debt,
  Income,
  Feedback,
  Installment,
  Expense,
};

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
