import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import { ServicesButtons, BackButtons } from "../buttons.js";

/**
 * Display Services menu
 */
export const displayServices = async (ctx: BotContext) => {
  const message = `🔧 **Services**

Connect and manage external services to enhance your financial tracking:

• **🏦 Sync Monobank** - Connect your Monobank account to automatically sync transactions and view balance

Choose an option below:`;

  return ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: Markup.keyboard([
      [ServicesButtons.SyncMonobank],
      [BackButtons.BackToProfile],
    ])
      .resize()
      .oneTime().reply_markup,
  });
};
