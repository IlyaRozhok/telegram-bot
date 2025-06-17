import { Markup } from "telegraf";
import { BackButtons, DebtsButtons } from "../buttons.js";
import { BotContext } from "../types.js";

export const displayDebts = async (ctx: BotContext) => {
  const message = `💳 **Debts Management**

Choose the type of debt you want to view:

• **💸 Other Debts** - Personal loans and other debts
• **💳 Bank Debts** - Credit cards and bank loans  
• **⏱️ Installments** - Payment plans and installments

Select an option below:`;

  return ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: Markup.keyboard([
      [DebtsButtons.OtherDebts],
      [DebtsButtons.BankDebts],
      [DebtsButtons.Installments],
      [BackButtons.BackToExplore],
    ])
      .resize()
      .oneTime().reply_markup,
  });
};
