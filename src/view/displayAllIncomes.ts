import { Markup } from "telegraf";
import { BackButtons, IncomeButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import Income from "../models/income.model.js";
import User from "../models/user.model.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const displayAllIncomes = async (ctx: BotContext) => {
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

    const regularIncomes = await Income.findAll({
      where: { telegram_id: telegramId, type: "regular", is_active: true },
      order: [["amount", "DESC"]],
    });

    const irregularIncomes = await Income.findAll({
      where: { telegram_id: telegramId, type: "irregular" },
      order: [["date_received", "DESC"]],
      limit: 10, // Show only last 10 irregular incomes
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

    let message = `💵 **All Your Incomes (${CURRENCIES[userCurrency].emoji} ${userCurrency})**\n\n`;

    // Regular incomes section
    if (regularIncomes.length > 0) {
      message += "🔄 **Regular Income Sources:**\n";
      for (const income of regularIncomes) {
        const amount = Number(income.get("amount"));
        const source = income.get("source") || "Unknown";
        const frequency = income.get("frequency") || "monthly";
        message += `• ${source}: ${await formatCurrency(
          amount
        )}/${frequency}\n`;
      }
      message += "\n";
    }

    // Irregular incomes section
    if (irregularIncomes.length > 0) {
      message += "💫 **Recent Irregular Income:**\n";
      for (const income of irregularIncomes) {
        const amount = Number(income.get("amount"));
        const source = income.get("source") || "Unknown";
        const date = income.get("date_received")
          ? new Date(income.get("date_received") as Date).toLocaleDateString(
              "uk-UA"
            )
          : "No date";
        message += `• ${source}: ${await formatCurrency(amount)} (${date})\n`;
      }
      message += "\n";
    }

    if (regularIncomes.length === 0 && irregularIncomes.length === 0) {
      message +=
        "📭 No income records found.\n\nStart by adding your first income source!";
    }

    // Show detailed income with edit buttons
    if (regularIncomes.length > 0 || irregularIncomes.length > 0) {
      await ctx.reply(message, { parse_mode: "Markdown" });

      // Show regular incomes with edit buttons
      for (const income of regularIncomes) {
        const amount = Number(income.get("amount"));
        const source = income.get("source") || "Unknown Source";
        const frequency = income.get("frequency") || "monthly";
        const description = income.get("description");

        const incomeText = `🔄 **${source}**
💵 **Amount:** ${await formatCurrency(amount)}/${frequency}
${description ? `📝 **Description:** ${description}` : ""}`;

        await ctx.reply(incomeText, {
          parse_mode: "Markdown",
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback(
              "✏️ Edit",
              `edit_income_${income.get("id")}`
            ),
            Markup.button.callback(
              "❌ Delete",
              `delete_income_${income.get("id")}`
            ),
          ]).reply_markup,
        });
      }

      // Show irregular incomes with edit buttons
      for (const income of irregularIncomes) {
        const amount = Number(income.get("amount"));
        const source = income.get("source") || "Unknown Source";
        const description = income.get("description");
        const dateReceived = income.get("date_received")
          ? new Date(income.get("date_received") as Date).toLocaleDateString(
              "uk-UA"
            )
          : "No date";

        const incomeText = `💫 **${source}**
💵 **Amount:** ${await formatCurrency(amount)}
📅 **Date:** ${dateReceived}
${description ? `📝 **Description:** ${description}` : ""}`;

        await ctx.reply(incomeText, {
          parse_mode: "Markdown",
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback(
              "✏️ Edit",
              `edit_income_${income.get("id")}`
            ),
            Markup.button.callback(
              "❌ Delete",
              `delete_income_${income.get("id")}`
            ),
          ]).reply_markup,
        });
      }
    } else {
      await ctx.reply(message, { parse_mode: "Markdown" });
    }

    return ctx.reply(
      "💵 Manage your incomes:",
      Markup.keyboard([
        [IncomeButtons.AddRegular, IncomeButtons.AddIrregular],
        [BackButtons.BackToExplore],
      ])
        .resize()
        .oneTime()
    );
  } catch (error) {
    console.error("Error in displayAllIncomes:", error);
    return ctx.reply("❌ Error loading incomes. Please try again later.");
  }
};
