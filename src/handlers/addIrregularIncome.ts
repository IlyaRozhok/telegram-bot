import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import { BackButtons } from "../buttons.js";
import Income from "../models/income.model.js";

export const addIrregularIncome = async (ctx: BotContext) => {
  // Clear any existing income session data
  delete ctx.session.addingRegularIncome;
  delete ctx.session.addingIrregularIncome;

  ctx.session.addingIrregularIncome = {
    step: "source",
  };

  return ctx.reply(
    "💫 **Adding Irregular Income**\n\n💼 **Step 1/4:** Enter the income source name\n\n*Examples: Bonus, Freelance Project, Gift, Sale, etc.*",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.keyboard([[BackButtons.BackToExplore]])
        .resize()
        .oneTime().reply_markup,
    }
  );
};

export const handleIrregularIncomeInput = async (ctx: BotContext) => {
  if (!ctx.session.addingIrregularIncome) return;

  // Skip if user is creating debt/installment
  if (ctx.session.addCategory) return;

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

  const step = ctx.session.addingIrregularIncome.step;

  switch (step) {
    case "source":
      if (!text || text.length < 2) {
        return ctx.reply(
          "❌ Please enter a valid income source name (at least 2 characters)."
        );
      }
      ctx.session.addingIrregularIncome.source = text;
      ctx.session.addingIrregularIncome.step = "amount";
      return ctx.reply(
        "💵 **Step 2/4:** Enter the income amount (in UAH)\n\n*Example: 5000*",
        { parse_mode: "Markdown" }
      );

    case "amount":
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return ctx.reply(
          "❌ Please enter a valid positive number for the amount."
        );
      }
      ctx.session.addingIrregularIncome.amount = amount;
      ctx.session.addingIrregularIncome.step = "date";
      return ctx.reply(
        "📅 **Step 3/4:** Enter the date when you received this income\n\n*Format: DD/MM/YYYY or type 'today' for today's date*\n*Example: 15/03/2024*",
        {
          parse_mode: "Markdown",
          reply_markup: Markup.keyboard([
            ["Today"],
            [BackButtons.BackToExplore],
          ])
            .resize()
            .oneTime().reply_markup,
        }
      );

    case "date":
      let date: Date;
      if (text.toLowerCase() === "today") {
        date = new Date();
      } else {
        // Parse DD/MM/YYYY format
        const dateMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!dateMatch) {
          return ctx.reply(
            "❌ Please enter a valid date in DD/MM/YYYY format or type 'today'."
          );
        }
        const [, day, month, year] = dateMatch;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (isNaN(date.getTime()) || date > new Date()) {
          return ctx.reply(
            "❌ Please enter a valid date that is not in the future."
          );
        }
      }

      ctx.session.addingIrregularIncome.date = date;
      ctx.session.addingIrregularIncome.step = "description";
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
          type: "irregular",
          source: ctx.session.addingIrregularIncome.source,
          amount: ctx.session.addingIrregularIncome.amount,
          frequency: "one-time",
          description: description,
          date_received: ctx.session.addingIrregularIncome.date,
        });

        // Clear session
        delete ctx.session.addingIrregularIncome;

        await ctx.reply(
          "✅ **Irregular Income Added Successfully!**\n\n💫 Your income entry has been saved and added to your financial records.",
          { parse_mode: "Markdown" }
        );

        return ctx.reply("Income added! Use /start to return to main menu.");
      } catch (error) {
        console.error("Error saving irregular income:", error);
        return ctx.reply("❌ Error saving income. Please try again.");
      }
  }
};
