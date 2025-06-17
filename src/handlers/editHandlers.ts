import { BotContext } from "../types.js";
import {
  EditInstallmentButtons,
  handleEditInstallmentField,
  handleEditInstallmentInput,
} from "./handleEditInstallment.js";
import {
  EditDebtButtons,
  handleEditDebtField,
  handleEditDebtInput,
} from "./handleEditDebt.js";
import {
  EditOtherDebtButtons,
  handleEditOtherDebtField,
  handleEditOtherDebtInput,
} from "./handleEditOtherDebt.js";
import {
  EditIncomeButtons,
  handleEditIncomeField,
  handleEditIncomeInput,
} from "./editIncome.js";

/**
 * Handle all edit operations for different entities
 * @param ctx Bot context
 * @param text User input text
 * @returns true if handled, false otherwise
 */
export async function handleEditHandlers(
  ctx: BotContext,
  text: string
): Promise<boolean> {
  try {
    // Handle edit installment field selection
    if (Object.values(EditInstallmentButtons).includes(text)) {
      let fieldType = "";
      switch (text) {
        case EditInstallmentButtons.Comment:
          fieldType = "comment";
          break;
        case EditInstallmentButtons.TotalCost:
          fieldType = "totalCost";
          break;
        case EditInstallmentButtons.MonthlyPayment:
          fieldType = "monthlyPayment";
          break;
        case EditInstallmentButtons.StartDate:
          fieldType = "startDate";
          break;
        case EditInstallmentButtons.FinalDate:
          fieldType = "finalDate";
          break;
      }
      await handleEditInstallmentField(ctx, fieldType);
      return true;
    }

    // Handle edit debt field selection
    if (Object.values(EditDebtButtons).includes(text)) {
      let fieldType = "";
      switch (text) {
        case EditDebtButtons.BankName:
          fieldType = "bankName";
          break;
        case EditDebtButtons.Amount:
          fieldType = "amount";
          break;
        case EditDebtButtons.InterestRate:
          fieldType = "interestRate";
          break;
        case EditDebtButtons.Comment:
          fieldType = "comment";
          break;
      }
      await handleEditDebtField(ctx, fieldType);
      return true;
    }

    // Handle edit other debt field selection
    if (Object.values(EditOtherDebtButtons).includes(text)) {
      console.log("Matched EditOtherDebtButtons:", text);
      let fieldType = "";
      switch (text) {
        case EditOtherDebtButtons.CreditorName:
          fieldType = "creditorName";
          break;
        case EditOtherDebtButtons.Amount:
          fieldType = "amount";
          break;
        case EditOtherDebtButtons.Comment:
          fieldType = "comment";
          break;
      }
      await handleEditOtherDebtField(ctx, fieldType);
      return true;
    }

    // Handle edit income field selection
    if (Object.values(EditIncomeButtons).includes(text)) {
      let fieldType = "";
      switch (text) {
        case EditIncomeButtons.Source:
          fieldType = "source";
          break;
        case EditIncomeButtons.Amount:
          fieldType = "amount";
          break;
        case EditIncomeButtons.Frequency:
          fieldType = "frequency";
          break;
        case EditIncomeButtons.Date:
          fieldType = "date";
          break;
        case EditIncomeButtons.Description:
          fieldType = "description";
          break;
        case EditIncomeButtons.Cancel:
          delete ctx.session.editingIncomeId;
          delete ctx.session.editingIncomeField;
          await ctx.reply("✅ Edit cancelled.");
          return true;
      }
      await handleEditIncomeField(ctx, fieldType);
      return true;
    }

    // Handle editing input for different entities
    if (ctx.session.editingOtherDebtId && ctx.session.editingOtherDebtField) {
      console.log("Calling handleEditOtherDebtInput from edit handler");
      await handleEditOtherDebtInput(ctx, text);
      return true;
    }

    if (ctx.session.editingIncomeId && ctx.session.editingIncomeField) {
      await handleEditIncomeInput(ctx, text);
      return true;
    }

    if (ctx.session.editingDebtId && ctx.session.editingDebtField) {
      await handleEditDebtInput(ctx, text);
      return true;
    }

    if (
      ctx.session.editingInstallmentId &&
      ctx.session.editingInstallmentField
    ) {
      // Handle year input for dates
      if (
        (ctx.session.editingInstallmentField === "startDate" &&
          ctx.session.editingStartMonth !== undefined) ||
        (ctx.session.editingInstallmentField === "finalDate" &&
          ctx.session.editingFinalMonth !== undefined)
      ) {
        if (/^\d{4}$/.test(text)) {
          // Update the field type for year handling
          ctx.session.editingInstallmentField =
            ctx.session.editingInstallmentField === "startDate"
              ? "startYear"
              : "finalYear";
          await handleEditInstallmentInput(ctx, text);
          return true;
        }
      }
      await handleEditInstallmentInput(ctx, text);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in edit handlers:", error);
    await ctx.reply("❌ An error occurred while editing. Please try again.");
    return true;
  }
}
