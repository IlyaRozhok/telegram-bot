import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import { BackButtons } from "../buttons.js";
import Income from "../models/income.model.js";

export const addRegularIncome = async (ctx: BotContext) => {
  // Clear any existing income session data
  delete ctx.session.addingRegularIncome;
  delete ctx.session.addingIrregularIncome;

  ctx.session.addingRegularIncome = {
    step: "source",
  };

  return ctx.reply(
    "🔄 **Adding Regular Income**\n\n💼 **Step 1/4:** Enter the income source name\n\n*Examples: Salary, Freelance Contract, Rental Income, etc.*",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.keyboard([[BackButtons.BackToExplore]])
        .resize()
        .oneTime().reply_markup,
    }
  );
};

export const handleRegularIncomeInput = async (ctx: BotContext) => {
  console.log("=== handleRegularIncomeInput called ===");
  console.log("addingRegularIncome:", !!ctx.session.addingRegularIncome);
  console.log("addCategory:", ctx.session.addCategory);

  if (!ctx.session.addingRegularIncome) {
    console.log("No addingRegularIncome session, returning");
    return;
  }

  // Skip if user is creating debt/installment
  if (ctx.session.addCategory) {
    console.log("User is creating debt/installment, skipping income handler");
    return;
  }

  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";

  // Skip if this is a button press, command, or navigation
  if (
    !text ||
    text.startsWith("/") ||
    text.includes("💵") ||
    text.includes("💳") ||
    text.includes("📊") ||
    text.includes("🔄") ||
    text.includes("💫") ||
    text.includes("📱") ||
    text.includes("Add") ||
    text.includes("Back to") ||
    text.includes("Explore") ||
    text.includes("New Debt") ||
    text.includes("View All") ||
    text.includes("Income") ||
    text.includes("Debt") ||
    text.includes("Expense")
  ) {
    return;
  }

  const step = ctx.session.addingRegularIncome.step;

  switch (step) {
    case "source":
      if (!text || text.length < 2) {
        return ctx.reply(
          "❌ Please enter a valid income source name (at least 2 characters)."
        );
      }
      ctx.session.addingRegularIncome.source = text;
      ctx.session.addingRegularIncome.step = "amount";
      return ctx.reply(
        "💵 **Step 2/4:** Enter the income amount (in UAH)\n\n*Example: 25000*",
        { parse_mode: "Markdown" }
      );

    case "amount":
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return ctx.reply(
          "❌ Please enter a valid positive number for the amount."
        );
      }
      ctx.session.addingRegularIncome.amount = amount;
      ctx.session.addingRegularIncome.step = "frequency";
      return ctx.reply("📅 **Step 3/4:** Select payment frequency:", {
        parse_mode: "Markdown",
        reply_markup: Markup.keyboard([
          ["Monthly", "Weekly"],
          ["Daily", "Yearly"],
          [BackButtons.BackToExplore],
        ])
          .resize()
          .oneTime().reply_markup,
      });

    case "frequency":
      const validFrequencies = ["monthly", "weekly", "daily", "yearly"];
      const frequency = text.toLowerCase();
      if (!validFrequencies.includes(frequency)) {
        return ctx.reply(
          "❌ Please select a valid frequency from the buttons."
        );
      }
      ctx.session.addingRegularIncome.frequency = frequency;
      ctx.session.addingRegularIncome.step = "description";
      return ctx.reply(
        "📝 **Step 4/4:** Enter a description (optional)\n\n*You can skip this step by typing 'skip'*",
        {
          parse_mode: "Markdown",
          reply_markup: Markup.keyboard([["Skip"], [BackButtons.BackToExplore]])
            .resize()
            .oneTime().reply_markup,
        }
      );

    case "description":
      const description = text.toLowerCase() === "skip" ? null : text;

      // Save to database
      try {
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) throw new Error("No telegram ID");

        await Income.create({
          telegram_id: telegramId,
          type: "regular",
          source: ctx.session.addingRegularIncome.source,
          amount: ctx.session.addingRegularIncome.amount,
          frequency: ctx.session.addingRegularIncome.frequency,
          description: description,
          is_active: true,
        });

        // Clear session
        delete ctx.session.addingRegularIncome;

        await ctx.reply(
          "✅ **Regular Income Added Successfully!**\n\n🔄 Your new income source has been saved and will be included in your monthly calculations.",
          { parse_mode: "Markdown" }
        );

        return ctx.reply("Income added! Use /start to return to main menu.");
      } catch (error) {
        console.error("Error saving regular income:", error);
        return ctx.reply("❌ Error saving income. Please try again.");
      }
  }
};
