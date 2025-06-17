import Installment from "../models/installment.model.js";

export const deleteInstallmentById = async (id: string | number) => {
  await Installment.destroy({ where: { id } });
};
