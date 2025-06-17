import { Markup } from "telegraf";
import Debt from "../models/debt.model.js";
import User from "../models/user.model.js";
import { BackButtons, DebtsButtons, OtherDebtsButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const displayOtherDebts = async (ctx: BotContext) => {
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
      where: { telegram_id: telegramId, type: "other" },
    });

    if (!debts.length) {
      return ctx.reply(
        "🎉 You have no other debts!",
        Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime()
      );
    }

    const total = debts.reduce(
      (sum, d) => sum + Number(d.get("amount") || 0),
      0
    );

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
      `📁 **Other Debts Summary (${
        CURRENCIES[userCurrency].emoji
      } ${userCurrency}):**

💰 **Total:** ${await formatCurrency(total)}
📊 **Count:** ${debts.length} debt${debts.length > 1 ? "s" : ""}`,
      { parse_mode: "Markdown" }
    );

    // Display each debt with edit/delete buttons
    for (const debt of debts) {
      const amount = Number(debt.get("amount"));
      const creditor = debt.get("creditor_name") || "Unknown";
      const comment = debt.get("comment");

      // Format comment if it contains a date
      let formattedComment = comment;
      if (
        comment &&
        typeof comment === "string" &&
        comment.includes("Due by") &&
        comment.includes("T")
      ) {
        try {
          const dateMatch = comment.match(
            /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/
          );
          if (dateMatch) {
            const date = new Date(dateMatch[1]);
            const formattedDate = date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
            formattedComment = comment.replace(dateMatch[1], formattedDate);
          }
        } catch (error) {
          // If date parsing fails, keep original comment
          console.error("Error parsing date in comment:", error);
        }
      }

      const debtText = `🧾 **From: ${creditor}**
💵 **Amount:** ${await formatCurrency(amount)}${
        formattedComment ? `\n💬 **Note:** ${formattedComment}` : ""
      }`;

      await ctx.reply(debtText, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback("✏️ Edit", `edit_otherdebt_${debt.get("id")}`),
          Markup.button.callback(
            "❌ Delete",
            `delete_otherdebt_${debt.get("id")}`
          ),
        ]).reply_markup,
      });
    }

    return ctx.reply(
      "💰 Manage your other debts or explore other options:",
      Markup.keyboard([
        [OtherDebtsButtons.DownloadCSV],
        [DebtsButtons.BankDebts, DebtsButtons.Installments],
        [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime()
    );
  } catch (error) {
    console.error("Error in displayOtherDebts:", error);
    return ctx.reply("❌ Error loading other debts. Please try again later.");
  }
};
