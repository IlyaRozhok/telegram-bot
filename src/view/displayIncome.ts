import { Markup } from "telegraf";
import { BackButtons, IncomeButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import Income from "../models/income.model.js";

export const displayIncome = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  // Get income statistics
  const regularIncomes = await Income.findAll({
    where: { telegram_id: telegramId, type: "regular", is_active: true },
  });

  const irregularIncomes = await Income.findAll({
    where: { telegram_id: telegramId, type: "irregular" },
  });

  const totalRegular = regularIncomes.reduce(
    (sum, income) => sum + Number(income.get("amount") || 0),
    0
  );

  const totalIrregular = irregularIncomes.reduce(
    (sum, income) => sum + Number(income.get("amount") || 0),
    0
  );

  const message = `💵 **Income Management**

📊 **Your Income Overview:**

🔄 **Regular Income:** ${Math.round(totalRegular)} UAH/month (${
    regularIncomes.length
  } sources)
💫 **Irregular Income:** ${Math.round(totalIrregular)} UAH total (${
    irregularIncomes.length
  } entries)

💰 **Monthly Estimate:** ${Math.round(totalRegular)} UAH

What would you like to do?`;

  return ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: Markup.keyboard([
      [IncomeButtons.AddRegular],
      [IncomeButtons.AddIrregular],
      [IncomeButtons.ViewAll],
      [BackButtons.BackToExplore],
    ])
      .resize()
      .oneTime().reply_markup,
  });
};
