import Income from "../models/income.model.js";

export const deleteIncomeById = async (incomeId?: string) => {
  if (!incomeId) return false;

  try {
    const result = await Income.destroy({
      where: { id: incomeId },
    });

    return result > 0;
  } catch (error) {
    console.error("Error deleting income:", error);
    return false;
  }
};
