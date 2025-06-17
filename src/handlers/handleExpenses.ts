import { Markup } from "telegraf";
import { BackButtons } from "../buttons.js";
import Expense from "../models/expense.model.js";
import { BotContext } from "../types.js";
import { format } from "date-fns";

const expenseCategories = [
  "Rent",
  "House utilities",
  "Investments",
  "Family",
  "Subscriptions",
  "Food",
  "Sport",
  "Telecommunications",
  "Entertainment",
  "Donats",
];
export const expenseMenuKeyboard = Markup.keyboard([
  ["📉 Add Expense", "📊 Manage Expenses"],
  [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
])
  .resize()
  .oneTime();

const expensesBackKeyboard = Markup.keyboard([
  [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
])
  .resize()
  .oneTime();

export const handleExpenses = async (ctx: BotContext, mode = "add") => {
  ctx.session = ctx.session || {};

  if (mode === "add") {
    delete ctx.session.expenseCategory;

    const expenseMessage = `📉 Add Expense

Choose the expense category:

Select a category below:`;

    return ctx.reply(expenseMessage, {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Rent", "expense_Rent")],
        [
          Markup.button.callback(
            "🔌 House utilities",
            "expense_House utilities"
          ),
        ],
        [Markup.button.callback("📈 Investments", "expense_Investments")],
        [Markup.button.callback("👨‍👩‍👧‍👦 Family", "expense_Family")],
        [Markup.button.callback("📱 Subscriptions", "expense_Subscriptions")],
        [Markup.button.callback("🍕 Food", "expense_Food")],
        [Markup.button.callback("⚽ Sport", "expense_Sport")],
        [
          Markup.button.callback(
            "📞 Telecommunications",
            "expense_Telecommunications"
          ),
        ],
        [Markup.button.callback("🎬 Entertainment", "expense_Entertainment")],
        [Markup.button.callback("💝 Donats", "expense_Donats")],
        [
          Markup.button.callback("📊 Back to Explore", "expense_back_explore"),
          Markup.button.callback("↪️ Back to Main", "expense_back_main"),
        ],
      ]).reply_markup,
    });
  }

  if (mode === "show") {
    const telegramId = ctx.from?.id?.toString();
    const expenses = await Expense.findAll({
      where: { telegram_id: telegramId },
    });

    if (expenses.length === 0) {
      return ctx.reply("You don't have any saved expenses yet.");
    }
    await ctx.reply("💰 *Your expenses:*", { parse_mode: "Markdown" });

    for (const expense of expenses) {
      await ctx.reply(
        `📌 ${expense.get("category")}: ${expense.get(
          "amount"
        )} UAH\n🗓 ${format(
          new Date(expense.get("createdAt") as Date),
          "dd.MM.yyyy"
        )}`,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "✏️ Edit",
            `edit_expense_${expense.get("id")}`
          ),
          Markup.button.callback(
            "❌ Delete",
            `delete_expense_${expense.get("id")}`
          ),
        ])
      );
    }

    await ctx.reply(
      "💰Manage your expenses or go back to main menu",
      expensesBackKeyboard
    );
  }
};

export const handleExpenseCallback = async (ctx: BotContext) => {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

  const callbackData = ctx.callbackQuery.data;

  // Only handle expense callbacks
  if (!callbackData.startsWith("expense_")) return;

  // Answer the callback query
  await ctx.answerCbQuery();

  if (callbackData === "expense_back_explore") {
    // Clear expense session and go back to explore
    delete ctx.session.expenseCategory;
    await ctx.editMessageText("Returning to explore menu...");

    // Import displayExplore dynamically to avoid circular dependencies
    const { displayExplore } = await import("../view/displayExplore.js");
    return displayExplore(ctx);
  }

  if (callbackData === "expense_back_main") {
    // Clear expense session and go back to main menu
    delete ctx.session.expenseCategory;
    await ctx.editMessageText("Returning to main menu...");

    // Import welcomeScreen dynamically to avoid circular dependencies
    const { welcomeScreen } = await import("../view/welcomeScreen.js");
    return welcomeScreen(ctx);
  }

  // Handle category selection
  if (callbackData.startsWith("expense_")) {
    const category = callbackData.replace("expense_", "");

    // Validate category
    if (!expenseCategories.includes(category)) {
      return ctx.reply("Invalid category selected. Please try again.");
    }

    // Set the selected category in session
    ctx.session.expenseCategory = category;

    // Edit the original message to show selection
    await ctx.editMessageText(`📉 ${category} Expense

You selected: ${category}

Please enter the amount in UAH:`);

    // Send a new message with back buttons for amount input
    return ctx.reply("Type the amount below:", {
      reply_markup: Markup.keyboard([
        [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime().reply_markup,
    });
  }
};
