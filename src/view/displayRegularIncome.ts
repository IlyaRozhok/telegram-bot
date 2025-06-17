import { Markup } from "telegraf";
import { BackButtons, IncomeButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import Income from "../models/income.model.js";

export const displayRegularIncome = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  const regularIncomes = await Income.findAll({
    where: { telegram_id: telegramId, type: "regular", is_active: true },
    order: [["amount", "DESC"]],
  });

  if (!regularIncomes.length) {
    return ctx.reply(
      "🔄 **Regular Income**\n\n📭 You have no regular income sources yet.\n\nAdd your first regular income to start tracking your monthly earnings!",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.keyboard([
          [IncomeButtons.AddRegular],
          [BackButtons.BackToExplore],
        ])
          .resize()
          .oneTime().reply_markup,
      }
    );
  }

  const totalMonthly = regularIncomes.reduce(
    (sum, income) => sum + Number(income.get("amount") || 0),
    0
  );

  // Display summary
  await ctx.reply(
    `🔄 **Regular Income Summary**

💰 **Total Monthly:** ${Math.round(totalMonthly)} UAH
📊 **Active Sources:** ${regularIncomes.length}
💵 **Annual Estimate:** ${Math.round(totalMonthly * 12)} UAH`,
    { parse_mode: "Markdown" }
  );

  // Display each income source with edit/delete buttons
  for (const income of regularIncomes) {
    const amount = Math.round(Number(income.get("amount")));
    const source = income.get("source") || "Unknown Source";
    const frequency = income.get("frequency") || "monthly";
    const description = income.get("description");

    const incomeText = `💼 **${source}**
💵 **Amount:** ${amount} UAH/${frequency}
${description ? `📝 **Description:** ${description}` : ""}`;

    await ctx.reply(incomeText, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback("✏️ Edit", `edit_income_${income.get("id")}`),
        Markup.button.callback(
          "❌ Delete",
          `delete_income_${income.get("id")}`
        ),
        Markup.button.callback("⏸️ Pause", `pause_income_${income.get("id")}`),
      ]).reply_markup,
    });
  }

  return ctx.reply(
    "🔄 Manage your regular income sources:",
    Markup.keyboard([
      [IncomeButtons.AddRegular, IncomeButtons.AddIrregular],
      [BackButtons.BackToExplore],
    ])
      .resize()
      .oneTime()
  );
};
