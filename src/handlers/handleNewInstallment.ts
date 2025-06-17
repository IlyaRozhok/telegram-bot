import { Markup, Context } from "telegraf";

import { addDebt } from "../db.js";
import { NewDebtButtons, BackButtons } from "../buttons.js";
import Installment from "../models/installment.model.js";
interface SessionData {
  addCategory?: string;
  totalCost?: number;
  installmentAmount?: number;
  startMonth?: number;
  startYear?: number;
  finalMonth?: number;
  finalYear?: number;
  installmentComment?: string;
}

interface BotContext extends Context {
  session: SessionData;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const handleNewInstallment = async (ctx: BotContext) => {
  console.log("=== handleNewInstallment called ===");
  console.log("Session:", ctx.session);
  console.log(
    "Message text:",
    ctx.message && "text" in ctx.message ? ctx.message.text : "no text"
  );

  if (!ctx.message || !("text" in ctx.message)) {
    console.log("No text message, returning");
    return ctx.reply("Please send a text message");
  }

  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.totalCost === undefined
  ) {
    const totalCost = parseFloat(ctx.message.text.replace(",", "."));

    if (Number.isNaN(totalCost)) {
      return ctx.reply(
        "❌ **Invalid input!**\n\n⏱️ **Adding Installment**\n\n💰 **Step 1/6:** Please enter total installment amount in UAH (only numbers, e.g. 15000):",
        {
          parse_mode: "Markdown",
          reply_markup: { remove_keyboard: true },
        }
      );
    }

    ctx.session.totalCost = totalCost;
    return ctx.reply(
      "💳 **Step 2/6:** Enter monthly payment amount (number):",
      {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      }
    );
  }

  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.totalCost !== undefined &&
    ctx.session.installmentAmount === undefined
  ) {
    const amount = parseFloat(ctx.message.text.replace(",", "."));
    if (Number.isNaN(amount)) {
      return ctx.reply(
        "❌ **Invalid input!**\n\n💳 **Step 2/6:** Please enter monthly payment amount in UAH (only numbers, e.g. 1200):",
        {
          parse_mode: "Markdown",
          reply_markup: { remove_keyboard: true },
        }
      );
    }
    ctx.session.installmentAmount = amount;

    // Create month buttons - send clean names, show full current date
    const now = new Date();
    const currentDateString =
      now.toDateString().slice(0, -5) + " " + now.toTimeString().slice(0, 5); // Format: "Thu Jun 12 16:11"

    return ctx.reply(
      `📅 **Step 3/6:** Which month you started?\n\nℹ️ Today: **${currentDateString}**`,
      {
        parse_mode: "Markdown",
        ...Markup.keyboard(monthNames, { columns: 3 }).oneTime().resize(),
      }
    );
  }

  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.installmentAmount !== undefined &&
    ctx.session.startMonth === undefined
  ) {
    const monthText = ctx.message.text.trim().toLowerCase();

    console.log("Month selection debug:");
    console.log("Text received:", ctx.message.text);
    console.log(
      "Available months:",
      monthNames.map((m) => m.toLowerCase())
    );

    // Check if it's a valid month
    const monthIndex = monthNames
      .map((m) => m.toLowerCase())
      .indexOf(monthText);

    console.log("Month index found:", monthIndex);

    if (monthIndex !== -1) {
      ctx.session.startMonth = monthIndex;
      const now = new Date();
      const currentYear = now.getFullYear();
      const years = [0, 1, 2, 3].map((i) => String(now.getFullYear() - i));

      // Send clean year buttons without highlighting
      return ctx.reply(`🗓️ **Step 4/6:** Which year you started?`, {
        parse_mode: "Markdown",
        ...Markup.keyboard(years, { columns: 2 }).oneTime().resize(),
      });
    } else {
      console.log("Month not recognized, ignoring input");
    }
  }
  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.startMonth !== undefined &&
    ctx.session.startYear === undefined &&
    /^\d{4}$/.test(ctx.message.text)
  ) {
    // Extract year from text (now all years are clean)
    ctx.session.startYear = parseInt(ctx.message.text, 10);
    return ctx.reply("📅 **Step 5/6:** When final payment month?", {
      parse_mode: "Markdown",
      ...Markup.keyboard(monthNames, { columns: 3 }).oneTime().resize(),
    });
  }
  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.startYear !== undefined &&
    ctx.session.finalMonth === undefined
  ) {
    console.log("=== Step 5/6: Processing final month selection ===");
    console.log("Message text:", ctx.message.text);
    console.log("Session state:", {
      addCategory: ctx.session.addCategory,
      startYear: ctx.session.startYear,
      finalMonth: ctx.session.finalMonth,
    });

    const monthText = ctx.message.text.trim().toLowerCase();
    const monthIndex = monthNames
      .map((m) => m.toLowerCase())
      .indexOf(monthText);

    console.log("Month validation:", {
      monthText,
      monthIndex,
      availableMonths: monthNames.map((m) => m.toLowerCase()),
    });

    if (monthIndex === -1) {
      console.log("Invalid month selected");
      return ctx.reply(
        "❌ **Invalid month!**\n\n📅 **Step 5/6:** Please select a valid month from the keyboard:",
        {
          parse_mode: "Markdown",
          ...Markup.keyboard(monthNames, { columns: 3 }).oneTime().resize(),
        }
      );
    }

    console.log("Valid month selected, proceeding to step 6/6");
    // Сохраняем выбранный месяц
    ctx.session.finalMonth = monthIndex;

    // Очищаем все остальные поля, которые могут помешать переходу к следующему шагу
    delete ctx.session.finalYear;
    delete ctx.session.installmentComment;

    return ctx.reply("🗓️ **Step 6/6:** Is the final payment this year?", {
      parse_mode: "Markdown",
      ...Markup.keyboard(["Yes", "No"]).oneTime().resize(),
    });
  }
  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.finalMonth !== undefined &&
    ctx.session.finalYear === undefined
  ) {
    console.log("=== Step 6/6: Processing year selection ===");
    console.log("Message text:", ctx.message.text);
    console.log("Session state:", {
      addCategory: ctx.session.addCategory,
      finalMonth: ctx.session.finalMonth,
      finalYear: ctx.session.finalYear,
    });

    if (ctx.message.text === "Yes") {
      console.log("User selected current year");
      ctx.session.finalYear = new Date().getFullYear();
      return ctx.reply(
        "📝 **Final Step:** Enter a comment for this installment (for example: iPhone 15 Pro Max).",
        { parse_mode: "Markdown" }
      );
    }

    if (ctx.message.text === "No") {
      console.log("User selected different year, showing year options");
      const now = new Date();
      const years = [0, 1, 2, 3].map((i) => String(now.getFullYear() + i));
      return ctx.reply("🗓️ **Step 6/6:** Which year is the final payment?", {
        parse_mode: "Markdown",
        ...Markup.keyboard(years, { columns: 2 }).oneTime().resize(),
      });
    }

    if (/^\d{4}$/.test(ctx.message.text)) {
      console.log("User entered year:", ctx.message.text);
      ctx.session.finalYear = parseInt(ctx.message.text, 10);
      return ctx.reply(
        "📝 **Final Step:** Enter a comment for this installment (for example: iPhone 15 Pro Max).",
        { parse_mode: "Markdown" }
      );
    }
  }
  if (
    ctx.session.addCategory === "⏱️ Installment" &&
    ctx.session.finalYear !== undefined &&
    ctx.session.installmentComment === undefined &&
    ctx.message.text !== "Yes" &&
    ctx.message.text !== "No" &&
    !monthNames
      .map((m) => m.toLowerCase())
      .includes(ctx.message.text.trim().toLowerCase()) &&
    !/^\d{4}$/.test(ctx.message.text)
  ) {
    // Проверяем наличие всех необходимых данных перед созданием рассрочки
    if (
      !ctx.session.startYear ||
      ctx.session.startMonth === undefined ||
      ctx.session.finalMonth === undefined ||
      !ctx.session.totalCost ||
      !ctx.session.installmentAmount ||
      !ctx.from?.id
    ) {
      console.error("Missing required data for installment creation", {
        startYear: ctx.session.startYear,
        startMonth: ctx.session.startMonth,
        finalMonth: ctx.session.finalMonth,
        totalCost: ctx.session.totalCost,
        installmentAmount: ctx.session.installmentAmount,
        userId: ctx.from?.id,
      });
      return ctx.reply("❌ Error: Missing required data. Please start over.");
    }

    const startYear = ctx.session.startYear;
    const startMonth = ctx.session.startMonth;
    const finalMonth = ctx.session.finalMonth;
    const finalYear = ctx.session.finalYear;
    const totalCost = ctx.session.totalCost;
    const installmentAmount = ctx.session.installmentAmount;

    ctx.session.installmentComment = ctx.message.text;
    const monthsCount =
      (finalYear - startYear) * 12 + (finalMonth - startMonth) + 1;
    const serviceFee = (totalCost / 100) * 1.9 * monthsCount;
    const today = new Date();
    let monthsPaid =
      (today.getFullYear() - startYear) * 12 + (today.getMonth() - startMonth);
    monthsPaid = Math.max(0, monthsPaid);
    const startDate = new Date(startYear, startMonth, 1);
    const finalDate = new Date(finalYear, finalMonth + 1, 0);
    const monthsRemaining = Math.max(0, monthsCount - monthsPaid);
    const totalRemaining = monthsRemaining * installmentAmount;

    await Installment.create({
      telegram_id: ctx.from.id.toString(),
      amount_per_month: installmentAmount,
      total_cost: totalCost,
      service_fee: parseFloat(serviceFee.toFixed(2)),
      months_count: monthsCount,
      months_remaining: monthsRemaining,
      total_remaining: totalRemaining,
      comment: ctx.session.installmentComment,
      start_date: startDate.toISOString().split("T")[0],
      final_payment_date: finalDate.toISOString().split("T")[0],
    });

    return ctx.reply(
      `Added installment: ${installmentAmount} UAH/month until ${
        finalDate.toISOString().split("T")[0]
      }\nEstimated remaining: ${totalRemaining} UAH (${Math.max(
        0,
        monthsCount - monthsPaid
      )} months).\nService fee: ${serviceFee.toFixed(2)} UAH\nComment: ${
        ctx.session.installmentComment
      }`,
      Markup.keyboard([[BackButtons.BackToMainMenu]])
        .oneTime()
        .resize()
    );
  }
  return null;
};
