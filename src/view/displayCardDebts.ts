import { Markup } from "telegraf";
import { BackButtons, DebtsButtons, BankDebtsButtons } from "../buttons.js";
import Debt from "../models/debt.model.js";
import User from "../models/user.model.js";
import { BotContext } from "../types.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const displayCardDebts = async (ctx: BotContext) => {
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

    const debts = await Debt.findAll({
      where: {
        telegram_id: telegramId,
        type: "bank",
      },
    });

    if (!debts.length) {
      return ctx.reply(
        "Perfecto 😇\nYou have no card debts",
        Markup.keyboard([
          [DebtsButtons.OtherDebts, DebtsButtons.Installments],
          [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
        ])
          .resize()
          .oneTime()
      );
    }

    let totalAmount = 0;
    let totalInterest = 0;
    let totalRecommendedPayment = 0;

    // Calculate totals
    debts.forEach((d) => {
      totalAmount += Number(d.get("amount")) || 0;
      totalInterest += Number(d.get("monthly_interest")) || 0;
      totalRecommendedPayment +=
        (Number(d.get("monthly_interest")) || 0) +
        Number(d.get("amount")) * 0.1;
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

    // Display summary first
    await ctx.reply(
      `📄 **Your Card Debts Summary (${
        CURRENCIES[userCurrency].emoji
      } ${userCurrency}):**

💰 **Total:** ${await formatCurrency(totalAmount)}
🏦 **Total Interest:** ${await formatCurrency(totalInterest)}/month
⚠ **Minimum Payment:** ${await formatCurrency(
        Math.round((totalInterest / 100) * 30) + totalInterest
      )}
✅ **Recommended Payment:** ${await formatCurrency(totalRecommendedPayment)}`,
      { parse_mode: "Markdown" }
    );

    // Display each debt with edit/delete buttons
    for (const debt of debts) {
      const amount = Number(debt.get("amount"));
      const interest = debt.get("interest_rate")
        ? `${debt.get("interest_rate")}%`
        : "-";
      const monthlyInterest = Number(debt.get("monthly_interest")) || 0;

      const debtText = `💳 **${debt.get("bank_name") || "Unknown Bank"}**
💵 **Amount:** ${await formatCurrency(amount)}
📈 **Rate:** ${interest}
📊 **Monthly Interest:** ${await formatCurrency(monthlyInterest)}${
        debt.get("comment") ? `\n💬 **Comment:** ${debt.get("comment")}` : ""
      }`;

      await ctx.reply(debtText, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback("✏️ Edit", `edit_debt_${debt.get("id")}`),
          Markup.button.callback("❌ Delete", `delete_debt_${debt.get("id")}`),
        ]).reply_markup,
      });
    }

    return ctx.reply(
      "💰 Manage your card debts or explore other options:",
      Markup.keyboard([
        [BankDebtsButtons.DownloadCSV],
        [DebtsButtons.OtherDebts, DebtsButtons.Installments],
        [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime()
    );
  } catch (error) {
    console.error("Error in displayCardDebts:", error);
    return ctx.reply("❌ Error loading card debts. Please try again later.");
  }
};
