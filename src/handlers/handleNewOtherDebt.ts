import Debt from "../models/debt.model.js";
import { BackButtons } from "../buttons.js";
import { Markup } from "telegraf";
import { BotContext } from "../types.js";

export const handleNewOtherDebt = async (ctx: BotContext) => {
  if (!ctx.message || !("text" in ctx.message)) {
    console.log("No text message, returning");
    return ctx.reply("Please send a text message");
  }

  ctx.session = ctx.session || {};
  ctx.session.otherDebt = ctx.session.otherDebt || {};

  if (
    ctx.session.addCategory === "💸 Other Debt" &&
    !ctx.session.otherDebt.who
  ) {
    const creditorName = ctx.message.text.trim();
    if (creditorName.length < 2) {
      return ctx.reply(
        "💸 **Adding Other Debt**\n\n👤 **Step 1/3:** Enter who gave you the money (e.g. 'friend Name, something else') - min 2 characters:",
        { parse_mode: "Markdown" }
      );
    }
    ctx.session.otherDebt.who = creditorName;
    return ctx.reply("💰 **Step 2/3:** Enter total debt amount (number):", {
      parse_mode: "Markdown",
    });
  }

  if (
    ctx.session.addCategory === "💸 Other Debt" &&
    !ctx.session.otherDebt.amount
  ) {
    const amount = parseFloat(ctx.message.text.replace(",", "."));
    if (Number.isNaN(amount)) {
      return ctx.reply("💰 **Step 2/3:** Enter total amount (number):", {
        parse_mode: "Markdown",
      });
    }

    ctx.session.otherDebt.amount = amount;
    return ctx.reply(
      "📅 **Step 3/3:** Enter the due date in format YYYY/MM/DD:",
      { parse_mode: "Markdown" }
    );
  }

  if (
    ctx.session.addCategory === "💸 Other Debt" &&
    !ctx.session.otherDebt.dueDate
  ) {
    const due = ctx.message.text.trim();
    const isValid =
      /^\d{4}\/\d{2}\/\d{2}$/.test(due) &&
      !isNaN(Date.parse(due.replace(/\//g, "-")));

    if (!isValid) {
      return ctx.reply(
        "📅 **Step 3/3:** Enter estimated due date in format YYYY/MM/DD:",
        { parse_mode: "Markdown" }
      );
    }

    // Convert YYYY/MM/DD to YYYY-MM-DD for Date parsing
    const dateForParsing = due.replace(/\//g, "-");
    ctx.session.otherDebt.dueDate = new Date(dateForParsing).toISOString();

    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) throw new Error("No telegram ID");

    const newDebt = {
      telegram_id: telegramId,
      type: "other",
      amount: ctx.session.otherDebt.amount,
      creditor_name: ctx.session.otherDebt.who,
      comment: `Due by ${ctx.session.otherDebt.dueDate}`,
      created_at: new Date(),
    };

    await Debt.create(newDebt);
    delete ctx.session.otherDebt;

    return ctx.reply(
      `✅ **Other Debt Added Successfully!**\n\n👤 ${newDebt.creditor_name}\n💵 ${newDebt.amount} UAH\n🗓 Due by: ${due}`,
      {
        parse_mode: "Markdown",
        ...Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime(),
      }
    );
  }
};
