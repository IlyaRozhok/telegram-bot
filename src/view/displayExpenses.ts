import { BotContext } from "../types.js";
import { Markup } from "telegraf";
import { BackButtons, ExpensesButtons } from "../buttons.js";
import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const displayExpenses = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Получаем пользователя для определения валюты
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      return ctx.reply("❌ User not found. Please register first.");
    }

    const userCurrency = user.currency as CurrencyCode;

    const expenses = await Expense.findAll({
      where: { telegram_id: telegramId },
    });

    // Функция для форматирования валюты
    const formatCurrency = async (amount: number) => {
      try {
        return await exchangeRateService.formatAmount(
          amount,
          "UAH",
          userCurrency
        );
      } catch (error) {
        console.error("Error formatting currency:", error);
        return `${CURRENCIES[userCurrency].symbol}${amount.toFixed(2)}`;
      }
    };

    let summaryText = `📊 Your Regular Expenses (${CURRENCIES[userCurrency].emoji} ${userCurrency}):\n\n`;
    const grouped: { [key: string]: number } = {};

    for (const exp of expenses) {
      const category = exp.get("category") as string;
      const amount = Number(exp.get("amount") || 0);
      grouped[category] = (grouped[category] || 0) + amount;
    }

    for (const [category, total] of Object.entries(grouped)) {
      summaryText += `• ${category}: ${await formatCurrency(total)}\n`;
    }

    const total = expenses.reduce(
      (sum, e) => sum + Number(e.get("amount") || 0),
      0
    );
    summaryText += `\n💰 Total: ${await formatCurrency(total)}`;

    return ctx.reply(
      summaryText,
      Markup.keyboard([
        [ExpensesButtons.DownloadCSV],
        ["📉 Add Expense", "📊 Manage Expenses"],
        [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime()
    );
  } catch (error) {
    console.error("Error in displayExpenses:", error);
    return ctx.reply("❌ Error loading expenses. Please try again later.");
  }
};
