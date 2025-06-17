import { NewDebtButtons, BackButtons } from "../buttons.js";
import Debt from "../models/debt.model.js";
import { Markup } from "telegraf";
import { BotContext } from "../types.js";

export const handleNewBankDebt = async (ctx: BotContext) => {
  if (!ctx.message || !("text" in ctx.message)) {
    console.log("No text message, returning");
    return ctx.reply("Please send a text message");
  }

  ctx.session = ctx.session || {};
  ctx.session.cardDebt = ctx.session.cardDebt || {};

  // Step 1: Bank name
  if (
    ctx.session.addCategory === "💳 Bank Debt" &&
    !ctx.session.cardDebt.bankName
  ) {
    const bankName = ctx.message.text.trim();
    if (bankName.length <= 3) {
      return ctx.reply(
        "💳 **Adding Bank Debt**\n\n🏦 **Step 1/3:** Enter bank name (min 4 symbols):",
        { parse_mode: "Markdown" }
      );
    }
    ctx.session.cardDebt.bankName = bankName;
    return ctx.reply("💰 **Step 2/3:** Enter total debt amount (number):", {
      parse_mode: "Markdown",
    });
  }

  // Step 2: Total debt
  if (
    ctx.session.addCategory === "💳 Bank Debt" &&
    !ctx.session.cardDebt.totalDebt
  ) {
    const totalDebt = parseFloat(ctx.message.text.replace(",", "."));
    if (Number.isNaN(totalDebt)) {
      return ctx.reply(
        "💰 **Step 2/3:** Please enter a valid number for total debt amount:",
        { parse_mode: "Markdown" }
      );
    }
    ctx.session.cardDebt.totalDebt = totalDebt;
    return ctx.reply(
      "📈 **Step 3/3:** Enter monthly interest rate in % (e.g. 3.49):",
      { parse_mode: "Markdown" }
    );
  }

  // Step 3: Monthly interest rate
  if (
    ctx.session.addCategory === "💳 Bank Debt" &&
    !ctx.session.cardDebt.interestRate
  ) {
    const rate = parseFloat(ctx.message.text.replace(",", "."));
    if (Number.isNaN(rate) || rate <= 0) {
      return ctx.reply(
        "📈 **Step 3/3:** Enter a valid percentage (e.g. 3.49):",
        { parse_mode: "Markdown" }
      );
    }

    ctx.session.cardDebt.interestRate = rate;

    const monthlyInterest = (ctx.session.cardDebt.totalDebt * rate) / 100;

    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) throw new Error("No telegram ID");

    const newCardDebt = {
      telegram_id: telegramId,
      type: "bank",
      bank_name: ctx.session.cardDebt.bankName,
      amount: ctx.session.cardDebt.totalDebt,
      interest_rate: rate,
      monthly_interest: parseFloat(monthlyInterest.toFixed(2)),
      created_at: new Date(),
    };

    await Debt.create(newCardDebt);

    delete ctx.session.cardDebt;

    return ctx.reply(
      `✅ **Bank Debt Added Successfully!**\n\n🏦 ${newCardDebt.bank_name}\n💵 ${newCardDebt.amount} UAH total\n📈 ${newCardDebt.interest_rate}% monthly rate\n📊 ~${newCardDebt.monthly_interest} UAH/month interest`,
      {
        parse_mode: "Markdown",
        ...Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime(),
      }
    );
  }
};
