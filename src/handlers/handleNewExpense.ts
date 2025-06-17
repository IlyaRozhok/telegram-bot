import Expense from "../models/expense.model.js";
import { expenseMenuKeyboard } from "./handleExpenses.js";
import { BotContext } from "../types.js";

export const handleNewExpense = async (ctx: BotContext) => {
  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  const amount = Number(text);
  const category = ctx.session.expenseCategory;
  const telegramId = ctx.from?.id?.toString();

  if (!category || isNaN(amount)) {
    return ctx.reply("❌ Invalid category or amount.");
  }

  await Expense.create({
    telegram_id: telegramId,
    category,
    amount,
    date: new Date(),
  });

  delete ctx.session.expenseCategory;
  return ctx.reply(`✅ Saved ${amount} UAH for "${category}"`, {
    reply_markup: expenseMenuKeyboard.reply_markup,
  });
};
