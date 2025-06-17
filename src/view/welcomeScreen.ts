// const MenuButtonsArray = {
//   Explore: "📊 Explore",
//   NewDebt: "💳 New Debt",
//   Expenses: "💸 Expenses",
// };
import { Markup } from "telegraf";
import { MenuButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import User from "../models/user.model.js";

const MenuButtonsArray = [
  MenuButtons.Explore,
  MenuButtons.NewDebt,
  MenuButtons.Profile,
];
const mainMenuKeyboard = Markup.keyboard([
  [MenuButtons.Explore, MenuButtons.NewDebt],
  [MenuButtons.Profile],
])
  .resize()
  .oneTime();
export const welcomeScreen = async (ctx: BotContext) => {
  // Clear only specific session data when returning to main menu, but preserve structure
  ctx.session = ctx.session || {};
  // Clear editing states
  delete ctx.session.editingExpenseId;
  delete ctx.session.editingInstallmentId;
  delete ctx.session.editingInstallmentField;
  delete ctx.session.editingDebtId;
  delete ctx.session.editingDebtField;
  delete ctx.session.editingOtherDebtId;
  delete ctx.session.editingOtherDebtField;
  delete ctx.session.addCategory;
  delete ctx.session.selectedExpenseCategory;

  const telegramId = ctx.from?.id?.toString();
  console.log("telegramId", telegramId);
  const user = await User.findOne({ where: { telegram_id: telegramId } });

  const welcomeMessage = `🏦 **FinFix** - Personal Finance Manager

👋 Welcome${user?.username ? `, ${user.username}` : ""}!

**What you can do:**
• 📊 **Explore** - View comprehensive financial overview
• 💳 **New Debt** - Add installments, bank debts, or other debts
• 📉 **Track Expenses** - Manage your monthly expenses
• 🧮 **Calculate Fees** - Automatic interest and payment calculations
• 📈 **Dashboards & graphs** - Monitor your spending periods patterns (in progress)
...

Choose an option below to get started 💡`;

  ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: mainMenuKeyboard.reply_markup,
  });
};
