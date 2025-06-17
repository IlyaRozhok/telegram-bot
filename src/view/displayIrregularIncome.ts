import { Markup } from "telegraf";
import { BackButtons, IncomeButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import Income from "../models/income.model.js";

export const displayIrregularIncome = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  const irregularIncomes = await Income.findAll({
    where: { telegram_id: telegramId, type: "irregular" },
    order: [["date_received", "DESC"]],
  });

  if (!irregularIncomes.length) {
    return ctx.reply(
      "💫 **Irregular Income**\n\n📭 You have no irregular income entries yet.\n\nAdd your first irregular income to track bonuses, freelance work, or one-time earnings!",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.keyboard([
          [IncomeButtons.AddIrregular],
          [BackButtons.BackToExplore],
        ])
          .resize()
          .oneTime().reply_markup,
      }
    );
  }

  const totalIrregular = irregularIncomes.reduce(
    (sum, income) => sum + Number(income.get("amount") || 0),
    0
  );

  // Display summary
  await ctx.reply(
    `💫 **Irregular Income Summary**

💰 **Total Earned:** ${Math.round(totalIrregular)} UAH
📊 **Total Entries:** ${irregularIncomes.length}
📅 **Latest Entry:** ${
      irregularIncomes[0]
        ? new Date(
            irregularIncomes[0].get("date_received") as Date
          ).toLocaleDateString("uk-UA")
        : "N/A"
    }`,
    { parse_mode: "Markdown" }
  );

  // Display each income entry with edit/delete buttons
  for (const income of irregularIncomes) {
    const amount = Math.round(Number(income.get("amount")));
    const source = income.get("source") || "Unknown Source";
    const description = income.get("description");
    const dateReceived = income.get("date_received")
      ? new Date(income.get("date_received") as Date).toLocaleDateString(
          "uk-UA"
        )
      : "No date";

    const incomeText = `💼 **${source}**
💵 **Amount:** ${amount} UAH
📅 **Date:** ${dateReceived}
${description ? `📝 **Description:** ${description}` : ""}`;

    await ctx.reply(incomeText, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback("✏️ Edit", `edit_income_${income.get("id")}`),
        Markup.button.callback(
          "❌ Delete",
          `delete_income_${income.get("id")}`
        ),
      ]).reply_markup,
    });
  }

  return ctx.reply(
    "💫 Manage your irregular income entries:",
    Markup.keyboard([
      [IncomeButtons.AddIrregular, IncomeButtons.AddRegular],
      [BackButtons.BackToExplore],
    ])
      .resize()
      .oneTime()
  );
};
