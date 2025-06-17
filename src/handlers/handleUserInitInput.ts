import User from "../models/user.model.js";
import { BotContext } from "../types.js";
import { welcomeScreen } from "../view/welcomeScreen.js";
import { handleRegistration } from "./handleRegistration.js";

export const handleUserInitInput = async (ctx: BotContext) => {
  // Если пользователь находится в процессе регистрации, передаем управление обработчику регистрации
  if (ctx.session.awaitingName || ctx.session.awaitingCurrency) {
    return handleRegistration(ctx);
  }

  // Если это не процесс регистрации, игнорируем
  return null;
};
