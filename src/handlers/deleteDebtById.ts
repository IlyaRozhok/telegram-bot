import Debt from "../models/debt.model.js";

export const deleteDebtById = async (id: string | number) => {
  await Debt.destroy({ where: { id } });
};
