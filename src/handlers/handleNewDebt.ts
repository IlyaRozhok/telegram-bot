import { Markup } from "telegraf";
import { BotContext } from "../types.js";

export const handleNewDebt = (ctx: BotContext) => {
  delete ctx.session.addCategory;
  delete ctx.session.installmentAmount;
  delete ctx.session.startMonth;
  delete ctx.session.startYear;

  const debtMessage = `💸 New Debt

What type of debt would you like to add?

Choose a category below:`;

  return ctx.reply(debtMessage, {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⏱️ Installment", "debt_installment")],
      [Markup.button.callback("💳 Bank Debt", "debt_bank")],
      [Markup.button.callback("💸 Other Debt", "debt_other")],
      [
        Markup.button.callback("📊 Back to Explore", "debt_back_explore"),
        Markup.button.callback("↪️ Back to Main", "debt_back_main"),
      ],
    ]).reply_markup,
  });
};

export const handleDebtCallback = async (ctx: BotContext) => {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

  const callbackData = ctx.callbackQuery.data;

  // Only handle debt callbacks
  if (!callbackData.startsWith("debt_")) return;

  // Answer the callback query
  await ctx.answerCbQuery();

  if (callbackData === "debt_back_explore") {
    // Clear debt session and go back to explore
    await ctx.editMessageText("Returning to explore menu...");

    // Import displayExplore dynamically to avoid circular dependencies
    const { displayExplore } = await import("../view/displayExplore.js");
    return displayExplore(ctx);
  }

  if (callbackData === "debt_back_main") {
    // Clear debt session and go back to main menu
    await ctx.editMessageText("Returning to main menu...");

    // Import welcomeScreen dynamically to avoid circular dependencies
    const { welcomeScreen } = await import("../view/welcomeScreen.js");
    return welcomeScreen(ctx);
  }

  // Import handlers dynamically to avoid circular dependencies
  const { handleNewInstallment } = await import("./handleNewInstallment.js");
  const { handleNewBankDebt } = await import("./handleNewBankDebt.js");
  const { handleNewOtherDebt } = await import("./handleNewOtherDebt.js");

  switch (callbackData) {
    case "debt_installment":
      // Очищаем все поля сессии, связанные с рассрочкой
      delete ctx.session.totalCost;
      delete ctx.session.installmentAmount;
      delete ctx.session.startMonth;
      delete ctx.session.startYear;
      delete ctx.session.finalMonth;
      delete ctx.session.finalYear;
      delete ctx.session.installmentComment;

      // Set the category for installment handling
      ctx.session.addCategory = "⏱️ Installment";
      // Edit the original message to show selection
      await ctx.editMessageText(
        "⏱️ Installment Selected\n\n💰 Step 1/6: Enter total installment amount in UAH (only numbers, e.g. 15000):"
      );
      return;
    case "debt_bank":
      // Set the category for bank debt handling
      ctx.session.addCategory = "💳 Bank Debt";
      // Edit the original message to show selection
      await ctx.editMessageText(
        "💳 Bank Debt Selected\n\n🏦 Step 1/3: Enter bank name (min 4 symbols):"
      );
      return;
    case "debt_other":
      // Set the category for other debt handling
      ctx.session.addCategory = "💸 Other Debt";
      // Edit the original message to show selection
      await ctx.editMessageText(
        "💸 Other Debt Selected\n\n👤 Step 1/3: Enter who gave you the money (e.g. 'friend Name, something else'):"
      );
      return;
    default:
      return;
  }
};
