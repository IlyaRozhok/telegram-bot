// commands/start.ts
import { Context } from "telegraf";
import { handleUserInit } from "../handlers/handleUserInit.js";

export const startCommand = (ctx: Context) => {
  console.log("Bot started by user:", ctx.from?.id);
  handleUserInit(ctx);
};
