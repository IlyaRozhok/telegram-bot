import Expense from "../models/expense.model.js";

export const deleteExpenseById = async (id: string | number) => {
  await Expense.destroy({ where: { id } });
};
