import { Telegraf } from "telegraf";
import { BotContext } from "../types.js";
import { handleCurrencySelection } from "./handleRegistration.js";
import {
  handleProfile,
  handleChangeCurrency,
  handleSetCurrency,
} from "./handleProfile.js";

/**
 * Setup action handlers for the bot
 */
export function setupActionHandlers(bot: Telegraf<BotContext>): void {
  // Currency selection during registration
  bot.action(/^register_currency_(.+)$/, async (ctx) => {
    console.log("=== REGISTER CURRENCY CALLBACK ===");
    console.log("Callback data:", ctx.callbackQuery?.data);
    const currencyCode = ctx.match[1];
    console.log("Currency code:", currencyCode);
    return handleCurrencySelection(ctx, currencyCode);
  });

  // Currency selection (legacy compatibility)
  bot.action(/^currency_(.+)$/, async (ctx) => {
    const currencyCode = ctx.match[1];
    return handleCurrencySelection(ctx, currencyCode);
  });

  // Profile actions
  bot.action("profile", handleProfile);
  bot.action("change_currency", handleChangeCurrency);

  bot.action(/^set_currency_(.+)$/, async (ctx) => {
    console.log("=== SET CURRENCY CALLBACK ===");
    const currencyCode = ctx.match[1];
    return handleSetCurrency(ctx, currencyCode);
  });

  bot.action("back_to_profile", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.editMessageText("Returning to profile...");
      setTimeout(() => {
        handleProfile(ctx);
      }, 500);
    } catch (error) {
      console.error("Error in back_to_profile action:", error);
      return ctx.reply("❌ An error occurred. Please try again.");
    }
  });
}
