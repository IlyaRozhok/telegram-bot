import User from "../models/user.model.js";
import { BotContext } from "../types.js";
import { welcomeScreen } from "../view/welcomeScreen.js";
import { handleRegistration } from "./handleRegistration.js";

export const handleUserInit = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  const user = await User.findOne({ where: { telegram_id: telegramId } });

  if (!user) {
    // Начинаем процесс регистрации
    return handleRegistration(ctx);
  }

  return welcomeScreen(ctx);
};
