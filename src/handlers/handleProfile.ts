import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import db from "../models/index.js";
import { CURRENCIES } from "../constants/currencies.js";
import { ProfileButtons, SettingsButtons } from "../buttons.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const handleProfile = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    return ctx.reply("❌ Error: Could not identify user");
  }

  try {
    const user = await db.User.findOne({ where: { telegram_id: telegramId } });
    if (!user) {
      return ctx.reply(
        "❌ Error: User not found. Please try registering again."
      );
    }

    // Получаем все долги пользователя
    const debts = await db.Debt.findAll({
      where: { telegram_id: telegramId },
    });

    // Получаем все рассрочки пользователя
    const installments = await db.Installment.findAll({
      where: { telegram_id: telegramId },
    });

    // Считаем общую сумму долгов (в UAH)
    const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.amount), 0);
    const totalInstallments = installments.reduce(
      (sum, inst) => sum + Number(inst.total_remaining),
      0
    );

    const userCurrency = user.currency as any;

    try {
      // Конвертируем суммы в валюту пользователя
      const formattedTotalDebt = await exchangeRateService.formatAmount(
        totalDebt,
        "UAH",
        userCurrency
      );
      const formattedTotalInstallments = await exchangeRateService.formatAmount(
        totalInstallments,
        "UAH",
        userCurrency
      );
      const formattedTotal = await exchangeRateService.formatAmount(
        totalDebt + totalInstallments,
        "UAH",
        userCurrency
      );

      const message = `
👤 *Profile*

*Name:* ${user.username}
*Currency:* ${CURRENCIES[userCurrency].emoji} ${userCurrency}

💳 *Total Debt:* ${formattedTotalDebt}
⏱️ *Total Installments:* ${formattedTotalInstallments}
💰 *Total Amount:* ${formattedTotal}

_Last updated: ${new Date().toLocaleString()}_
`;

      return ctx.reply(message, {
        parse_mode: "Markdown",
        ...Markup.keyboard([
          [ProfileButtons.Feedback, ProfileButtons.Services],
          [ProfileButtons.Settings],
          [ProfileButtons.BackToMain],
        ])
          .resize()
          .oneTime(),
      });
    } catch (exchangeError) {
      console.error("Error converting currencies:", exchangeError);
      // Fallback: показываем в UAH
      const message = `
👤 *Profile*

*Name:* ${user.username}
*Currency:* ${CURRENCIES[userCurrency].emoji} ${userCurrency}

💳 *Total Debt:* ₴${totalDebt.toFixed(2)}
⏱️ *Total Installments:* ₴${totalInstallments.toFixed(2)}
💰 *Total Amount:* ₴${(totalDebt + totalInstallments).toFixed(2)}

_Last updated: ${new Date().toLocaleString()}_
_Note: Showing amounts in UAH due to conversion error_
`;

      return ctx.reply(message, {
        parse_mode: "Markdown",
        ...Markup.keyboard([
          [ProfileButtons.Feedback, ProfileButtons.Services],
          [ProfileButtons.Settings],
          [ProfileButtons.BackToMain],
        ])
          .resize()
          .oneTime(),
      });
    }
  } catch (error) {
    console.error("Error in handleProfile:", error);
    return ctx.reply(
      "❌ Error: Could not load profile. Please try again later."
    );
  }
};

export const handleChangeCurrency = async (ctx: BotContext) => {
  try {
    // Получаем текущие курсы для отображения
    const rates = await exchangeRateService.getCurrentRates();

    const rateInfo = `
💱 *Select your preferred currency:*

Current exchange rates (1 USD = ):
🇺🇦 UAH: ${rates.UAH?.toFixed(2) || "N/A"}
🇪🇺 EUR: ${rates.EUR?.toFixed(4) || "N/A"}
🇵🇱 PLN: ${rates.PLN?.toFixed(2) || "N/A"}

_Rates updated: ${new Date().toLocaleString()}_
`;

    return ctx.reply(rateInfo, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("🇺🇦 UAH (₴)", "set_currency_UAH"),
          Markup.button.callback("🇺🇸 USD ($)", "set_currency_USD"),
        ],
        [
          Markup.button.callback("🇪🇺 EUR (€)", "set_currency_EUR"),
          Markup.button.callback("🇵🇱 PLN (zł)", "set_currency_PLN"),
        ],
        [Markup.button.callback("🔙 Back to Settings", "back_to_settings")],
      ]),
    });
  } catch (error) {
    console.error("Error in handleChangeCurrency:", error);
    return ctx.reply("💱 Select your preferred currency:", {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("🇺🇦 UAH (₴)", "set_currency_UAH"),
          Markup.button.callback("🇺🇸 USD ($)", "set_currency_USD"),
        ],
        [
          Markup.button.callback("🇪🇺 EUR (€)", "set_currency_EUR"),
          Markup.button.callback("🇵🇱 PLN (zł)", "set_currency_PLN"),
        ],
        [Markup.button.callback("🔙 Back to Settings", "back_to_settings")],
      ]),
    });
  }
};

export const handleSetCurrency = async (
  ctx: BotContext,
  currencyCode: string
) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    return ctx.reply("❌ Error: Could not identify user");
  }

  try {
    const user = await db.User.findOne({ where: { telegram_id: telegramId } });
    if (!user) {
      return ctx.reply("❌ Error: User not found");
    }

    await user.update({ currency: currencyCode });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✅ Currency updated to ${
        CURRENCIES[currencyCode as any].emoji
      } ${currencyCode}\n\nReturning to settings...`
    );

    // Показываем обновленные настройки
    setTimeout(() => {
      handleSettings(ctx);
    }, 1000);
  } catch (error) {
    console.error("Error in handleSetCurrency:", error);
    return ctx.reply("❌ Error: Could not update currency");
  }
};

export const handleSettings = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    return ctx.reply("❌ Error: Could not identify user");
  }

  try {
    const user = await db.User.findOne({ where: { telegram_id: telegramId } });
    if (!user) {
      return ctx.reply("❌ Error: User not found");
    }

    const message = `
⚙️ *Settings*

*Current Name:* ${user.username}
*Current Currency:* ${CURRENCIES[user.currency as any].emoji} ${user.currency}

Choose what you want to change:
`;

    return ctx.reply(message, {
      parse_mode: "Markdown",
      ...Markup.keyboard([
        [SettingsButtons.ChangeCurrency, SettingsButtons.ChangeName],
        [SettingsButtons.BackToProfile],
      ])
        .resize()
        .oneTime(),
    });
  } catch (error) {
    console.error("Error in handleSettings:", error);
    return ctx.reply("❌ Error: Could not load settings");
  }
};

export const handleChangeAccountName = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    return ctx.reply("❌ Error: Could not identify user");
  }

  try {
    const user = await db.User.findOne({ where: { telegram_id: telegramId } });
    if (!user) {
      return ctx.reply("❌ Error: User not found");
    }

    const message = `
✏️ *Change Name*

*Current name:* ${user.username}

Please enter your new name:
`;

    // Устанавливаем состояние ожидания нового имени
    if (ctx.session) {
      ctx.session.waitingForNewName = true;
    }

    return ctx.reply(message, {
      parse_mode: "Markdown",
      ...Markup.keyboard([[SettingsButtons.BackToProfile]])
        .resize()
        .oneTime(),
    });
  } catch (error) {
    console.error("Error in handleChangeAccountName:", error);
    return ctx.reply("❌ Error: Could not load name change");
  }
};

export const handleNewAccountName = async (
  ctx: BotContext,
  newName: string
) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    return ctx.reply("❌ Error: Could not identify user");
  }

  try {
    // Валидация имени
    if (!newName || newName.trim().length < 2) {
      return ctx.reply(
        "❌ Name must be at least 2 characters long. Please try again:"
      );
    }

    if (newName.trim().length > 50) {
      return ctx.reply(
        "❌ Name must be less than 50 characters. Please try again:"
      );
    }

    const user = await db.User.findOne({ where: { telegram_id: telegramId } });
    if (!user) {
      return ctx.reply("❌ Error: User not found");
    }

    const trimmedName = newName.trim();
    await user.update({ username: trimmedName });

    // Сбрасываем состояние ожидания
    if (ctx.session) {
      ctx.session.waitingForNewName = false;
    }

    const message = `✅ Account name updated successfully!

*New name:* ${trimmedName}

Returning to settings...`;

    await ctx.reply(message, {
      parse_mode: "Markdown",
    });

    // Показываем обновленные настройки
    setTimeout(() => {
      handleSettings(ctx);
    }, 1000);
  } catch (error) {
    console.error("Error in handleNewAccountName:", error);
    return ctx.reply("❌ Error: Could not update account name");
  }
};
