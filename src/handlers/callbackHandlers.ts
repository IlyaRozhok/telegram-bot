import { Telegraf } from "telegraf";
import { BotContext } from "../types.js";
import { deleteExpenseById } from "./deleteExpenseById.js";
import { deleteInstallmentById } from "./deleteInstallmentById.js";
import { deleteDebtById } from "./deleteDebtById.js";
import { handleEditInstallment } from "./handleEditInstallment.js";
import { handleEditDebt } from "./handleEditDebt.js";
import { handleEditOtherDebt } from "./handleEditOtherDebt.js";
import { deleteIncomeById } from "./deleteIncome.js";
import { handleEditIncome } from "./editIncome.js";
import { handleFeedbackCallback } from "./handleFeedback.js";
import { handleExpenseCallback } from "./handleExpenses.js";
import { handleDebtCallback } from "./handleNewDebt.js";
import {
  handleProfile,
  handleSetCurrency,
  handleSettings,
} from "./handleProfile.js";

/**
 * Setup callback query handlers for the bot
 */
export function setupCallbackHandlers(bot: Telegraf<BotContext>): void {
  bot.on("callback_query", async (ctx: BotContext, next) => {
    console.log("=== CALLBACK QUERY RECEIVED ===");
    console.log("Data:", ctx.callbackQuery?.data);
    console.log("From:", ctx.from?.id);

    const data = (ctx.callbackQuery as any)?.data;
    if (!data) return next();

    try {
      // Expense callbacks
      if (data.startsWith("delete_expense_")) {
        const id = data.split("_").pop();
        await deleteExpenseById(id);
        await ctx.answerCbQuery("Expense deleted");
        return ctx.editMessageText("✅ Expense deleted.");
      }

      if (data.startsWith("edit_expense_")) {
        const id = data.split("_").pop();
        ctx.session.editingExpenseId = id;
        await ctx.answerCbQuery();
        return ctx.reply("Enter new amount:");
      }

      // Installment callbacks
      if (data.startsWith("delete_installment_")) {
        const id = data.split("_").pop();
        await deleteInstallmentById(id);
        await ctx.answerCbQuery("Installment deleted");
        return ctx.editMessageText("✅ Installment deleted.");
      }

      if (data.startsWith("edit_installment_")) {
        const id = data.split("_").pop();
        await ctx.answerCbQuery();
        return handleEditInstallment(ctx, id);
      }

      // Debt callbacks
      if (data.startsWith("delete_debt_")) {
        const id = data.split("_").pop();
        await deleteDebtById(id);
        await ctx.answerCbQuery("Debt deleted");
        return ctx.editMessageText("✅ Debt deleted.");
      }

      if (data.startsWith("edit_debt_")) {
        const id = data.split("_").pop();
        await ctx.answerCbQuery();
        return handleEditDebt(ctx, id);
      }

      // Other debt callbacks
      if (data.startsWith("delete_otherdebt_")) {
        const id = data.split("_").pop();
        await deleteDebtById(id);
        await ctx.answerCbQuery("Other debt deleted");
        return ctx.editMessageText("✅ Other debt deleted.");
      }

      if (data.startsWith("edit_od_")) {
        const fieldType = data.replace("edit_od_", "");
        console.log("CALLBACK: edit_od_ called with field:", fieldType);

        if (!ctx.session?.editingOtherDebtId) {
          await ctx.answerCbQuery("Session expired. Please try again.");
          return ctx.reply("❌ Session expired. Please click Edit again.");
        }

        ctx.session.editingOtherDebtField = fieldType;
        await ctx.answerCbQuery();

        let prompt = "";
        switch (fieldType) {
          case "creditor":
            prompt = "Enter the new creditor name:";
            break;
          case "amount":
            prompt = "Enter the new amount (UAH):";
            break;
          case "comment":
            prompt = "Enter the new comment:";
            break;
        }

        return ctx.reply(prompt);
      }

      if (data.startsWith("edit_otherdebt_")) {
        const id = data.split("_").pop();
        console.log("CALLBACK: edit_otherdebt_ called with ID:", id);
        await ctx.answerCbQuery();
        return handleEditOtherDebt(ctx, id);
      }

      if (data === "cancel_edit_od") {
        ctx.session = ctx.session || {};
        delete ctx.session.editingOtherDebtId;
        delete ctx.session.editingOtherDebtField;
        await ctx.answerCbQuery("Edit cancelled");
        return ctx.reply("✅ Edit cancelled.");
      }

      // Income callbacks
      if (data.startsWith("delete_income_")) {
        const id = data.split("_").pop();
        const success = await deleteIncomeById(id);
        if (success) {
          await ctx.answerCbQuery("Income deleted");
          return ctx.editMessageText("✅ Income deleted.");
        } else {
          await ctx.answerCbQuery("Error deleting income");
          return ctx.reply("❌ Error deleting income. Please try again.");
        }
      }

      if (data.startsWith("edit_income_")) {
        const id = data.split("_").pop();
        await ctx.answerCbQuery();
        return handleEditIncome(ctx, id);
      }

      // Feature-specific callbacks
      if (data.startsWith("feedback_")) {
        return handleFeedbackCallback(ctx);
      }

      if (data.startsWith("expense_")) {
        return handleExpenseCallback(ctx);
      }

      if (data.startsWith("debt_")) {
        return handleDebtCallback(ctx);
      }

      // Currency callbacks
      if (data.startsWith("set_currency_")) {
        const currency = data.replace("set_currency_", "");
        return handleSetCurrency(ctx, currency);
      }

      if (data === "back_to_profile") {
        await ctx.answerCbQuery();
        return handleProfile(ctx);
      }

      if (data === "back_to_settings") {
        await ctx.answerCbQuery();
        return handleSettings(ctx);
      }

      return next();
    } catch (error) {
      console.error("Error in callback handler:", error);
      await ctx.answerCbQuery("An error occurred");
      return ctx.reply("❌ An error occurred. Please try again.");
    }
  });
}
