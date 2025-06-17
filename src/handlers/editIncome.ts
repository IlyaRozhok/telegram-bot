import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import Income from "../models/income.model.js";

export const EditIncomeButtons = {
  Source: "📝 Source Name",
  Amount: "💵 Amount",
  Frequency: "📅 Frequency", // Only for regular income
  Date: "📅 Date", // Only for irregular income
  Description: "📄 Description",
  Cancel: "❌ Cancel",
};

export const handleEditIncome = async (ctx: BotContext, incomeId?: string) => {
  if (!incomeId) return;

  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  // Find the income
  const income = await Income.findOne({
    where: { id: incomeId, telegram_id: telegramId },
  });

  if (!income) {
    return ctx.reply(
      "❌ Income not found or you don't have permission to edit it."
    );
  }

  // Store income ID in session
  ctx.session.editingIncomeId = incomeId;

  const incomeType = income.get("type");
  const source = income.get("source") || "Unknown";
  const amount = Math.round(Number(income.get("amount")));

  let buttons = [
    [EditIncomeButtons.Source, EditIncomeButtons.Amount],
    [EditIncomeButtons.Description],
  ];

  // Add type-specific buttons
  if (incomeType === "regular") {
    buttons.splice(1, 0, [EditIncomeButtons.Frequency]);
  } else {
    buttons.splice(1, 0, [EditIncomeButtons.Date]);
  }

  buttons.push([EditIncomeButtons.Cancel]);

  const message = `✏️ **Editing Income: ${source}**

💵 **Current Amount:** ${amount} UAH
${
  incomeType === "regular"
    ? `📅 **Frequency:** ${income.get("frequency") || "monthly"}`
    : `📅 **Date:** ${
        income.get("date_received")
          ? new Date(income.get("date_received") as Date).toLocaleDateString(
              "uk-UA"
            )
          : "No date"
      }`
}
📝 **Description:** ${income.get("description") || "None"}

What would you like to edit?`;

  return ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: Markup.keyboard(buttons).resize().oneTime().reply_markup,
  });
};

export const handleEditIncomeField = async (
  ctx: BotContext,
  fieldType: string
) => {
  if (!ctx.session.editingIncomeId) {
    return ctx.reply("❌ No income being edited. Please try again.");
  }

  ctx.session.editingIncomeField = fieldType;

  let prompt = "";
  switch (fieldType) {
    case "source":
      prompt = "📝 Enter the new source name:";
      break;
    case "amount":
      prompt = "💵 Enter the new amount (UAH):";
      break;
    case "frequency":
      return ctx.reply("📅 Select new frequency:", {
        reply_markup: Markup.keyboard([
          ["Monthly", "Weekly"],
          ["Daily", "Yearly"],
          [EditIncomeButtons.Cancel],
        ])
          .resize()
          .oneTime().reply_markup,
      });
    case "date":
      prompt = "📅 Enter the new date (DD/MM/YYYY) or type 'today':";
      break;
    case "description":
      prompt = "📄 Enter the new description (or type 'none' to remove):";
      break;
  }

  return ctx.reply(prompt);
};

export const handleEditIncomeInput = async (ctx: BotContext, text: string) => {
  if (!ctx.session.editingIncomeId || !ctx.session.editingIncomeField) {
    return ctx.reply("❌ No income field being edited. Please try again.");
  }

  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  const income = await Income.findOne({
    where: { id: ctx.session.editingIncomeId, telegram_id: telegramId },
  });

  if (!income) {
    return ctx.reply("❌ Income not found.");
  }

  const fieldType = ctx.session.editingIncomeField;
  let updateData: any = {};

  try {
    switch (fieldType) {
      case "source":
        if (!text || text.length < 2) {
          return ctx.reply(
            "❌ Please enter a valid source name (at least 2 characters)."
          );
        }
        updateData.source = text;
        break;

      case "amount":
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) {
          return ctx.reply(
            "❌ Please enter a valid positive number for the amount."
          );
        }
        updateData.amount = amount;
        break;

      case "frequency":
        const validFrequencies = ["monthly", "weekly", "daily", "yearly"];
        const frequency = text.toLowerCase();
        if (!validFrequencies.includes(frequency)) {
          return ctx.reply(
            "❌ Please select a valid frequency from the buttons."
          );
        }
        updateData.frequency = frequency;
        break;

      case "date":
        let date: Date;
        if (text.toLowerCase() === "today") {
          date = new Date();
        } else {
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
        updateData.date_received = date;
        break;

      case "description":
        updateData.description = text.toLowerCase() === "none" ? null : text;
        break;
    }

    // Update the income
    await Income.update(updateData, {
      where: { id: ctx.session.editingIncomeId, telegram_id: telegramId },
    });

    // Clear session
    delete ctx.session.editingIncomeId;
    delete ctx.session.editingIncomeField;

    await ctx.reply("✅ **Income Updated Successfully!**", {
      parse_mode: "Markdown",
    });

    return ctx.reply("Income updated! Use /start to return to main menu.");
  } catch (error) {
    console.error("Error updating income:", error);
    return ctx.reply("❌ Error updating income. Please try again.");
  }
};
