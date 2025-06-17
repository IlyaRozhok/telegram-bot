import { Markup } from "telegraf";

import { CURRENCY_BUTTONS } from "../constants/currencies.js";
import { BotContext } from "../types.js";
import User from "../models/user.model.js";

export const handleRegistration = async (ctx: BotContext) => {
  if (!ctx.message || !("text" in ctx.message)) {
    return ctx.reply("Please send a text message");
  }

  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    return ctx.reply("Error: Could not identify user");
  }

  // Если это первый шаг - запрашиваем имя
  if (!ctx.session.awaitingName && !ctx.session.awaitingCurrency) {
    ctx.session.awaitingName = true;
    return ctx.reply("👋 Welcome to FinFix!\n\nPlease enter your name:", {
      parse_mode: "Markdown",
    });
  }

  // Если это второй шаг - сохраняем имя и запрашиваем валюту
  if (ctx.session.awaitingName && !ctx.session.awaitingCurrency) {
    const name = ctx.message.text.trim();
    if (name.length < 2) {
      return ctx.reply(
        "❌ Name is too short. Please enter a valid name (at least 2 characters):"
      );
    }

    ctx.session.username = name;
    ctx.session.awaitingCurrency = true;
    delete ctx.session.awaitingName;

    return ctx.reply(
      `Nice to meet you, ${name}! 👋\n\n💱 Please select your preferred currency:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("🇺🇦 UAH (₴)", "register_currency_UAH"),
            Markup.button.callback("🇺🇸 USD ($)", "register_currency_USD"),
          ],
          [
            Markup.button.callback("🇪🇺 EUR (€)", "register_currency_EUR"),
            Markup.button.callback("🇵🇱 PLN (zł)", "register_currency_PLN"),
          ],
        ]),
      }
    );
  }

  return null;
};

export const handleCurrencySelection = async (
  ctx: BotContext,
  currencyCode: string
) => {
  if (!ctx.session.username || !ctx.from?.id) {
    return ctx.reply("❌ Error: Please start registration from the beginning");
  }

  try {
    await User.create({
      telegram_id: ctx.from.id.toString(),
      username: ctx.session.username,
      currency: currencyCode,
    });

    // Очищаем сессию
    const username = ctx.session.username;
    delete ctx.session.username;
    delete ctx.session.awaitingName;
    delete ctx.session.awaitingCurrency;

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✅ Registration completed!\n\nWelcome, ${username}! Your currency is set to ${currencyCode}.`
    );

    // Показываем главное меню
    setTimeout(() => {
      ctx.reply(
        "🏦 **FinFix** - Personal Finance Manager\n\nWhat would you like to do?",
        {
          parse_mode: "Markdown",
          ...Markup.keyboard([["💸 New Debt", "📊 Explore"], ["👤 Profile"]])
            .resize()
            .oneTime(),
        }
      );
    }, 1000);
  } catch (error) {
    console.error("Error during registration:", error);
    return ctx.reply("❌ Error during registration. Please try again.");
  }
};
