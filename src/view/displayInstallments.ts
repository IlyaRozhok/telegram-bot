import { Markup } from "telegraf";
import { BackButtons, DebtsButtons, InstallmentsButtons } from "../buttons.js";
import Installment from "../models/installment.model.js";
import User from "../models/user.model.js";
import { BotContext } from "../types.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const displayInstallments = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Получаем пользователя для определения валюты
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      return ctx.reply("❌ User not found. Please register first.");
    }

    const userCurrency = user.currency as CurrencyCode;

    const installments = await Installment.findAll({
      where: { telegram_id: telegramId },
      order: [["final_payment_date", "ASC"]],
    });

    if (!installments.length) {
      return ctx.reply(
        "You have no installments.",
        Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime()
      );
    }

    const totalMonthlyPayments = installments.reduce(
      (sum, d) => sum + Number(d.get("amount_per_month") || 0),
      0
    );

    let totalFee = 0;
    let totalRemaining = 0;

    // Display summary first
    installments.forEach((d) => {
      const serviceFee = Number(d.get("service_fee") || 0);
      const remaining = Number(d.get("total_remaining") || 0);
      totalFee += serviceFee;
      totalRemaining += remaining;
    });

    // Функция для форматирования валюты
    const formatCurrency = async (amount: number) => {
      try {
        return await exchangeRateService.formatAmount(
          amount,
          "UAH",
          userCurrency
        );
      } catch (error) {
        console.error("Error formatting currency:", error);
        return `${CURRENCIES[userCurrency].symbol}${amount.toFixed(2)}`;
      }
    };

    await ctx.reply(
      `📋 *Your Installments Summary (${
        CURRENCIES[userCurrency].emoji
      } ${userCurrency}):*

🗓 Monthly Payments: ${await formatCurrency(totalMonthlyPayments)}
💸 Total Fee: ${await formatCurrency(totalFee)}
💵 Total Left: ${await formatCurrency(totalRemaining)}`,
      { parse_mode: "Markdown" }
    );

    // Display each installment with edit/delete buttons
    for (const installment of installments) {
      const serviceFee = Number(installment.get("service_fee") || 0);
      const remaining = Number(installment.get("total_remaining") || 0);
      const monthlyPayment = Number(installment.get("amount_per_month") || 0);
      const monthsRemaining = Number(installment.get("months_remaining") || 0);
      const finalPaymentDate = installment.get("final_payment_date");
      const formattedDate =
        finalPaymentDate && typeof finalPaymentDate === "string"
          ? finalPaymentDate.split("T")[0]
          : "Not set";

      const installmentText = `💲 ${installment.get("comment") || "-"}
💵 Monthly payment: ${await formatCurrency(monthlyPayment)}
🗓 Total left: ${await formatCurrency(remaining)} (${monthsRemaining} months)
🧾 Last payment: ${formattedDate}
💸 Service fee: ${await formatCurrency(serviceFee)}`;

      await ctx.reply(
        installmentText,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "✏️ Edit",
            `edit_installment_${installment.get("id")}`
          ),
          Markup.button.callback(
            "❌ Delete",
            `delete_installment_${installment.get("id")}`
          ),
        ])
      );
    }

    return ctx.reply(
      "💰 Manage your installments or explore other options:",
      Markup.keyboard([
        [InstallmentsButtons.DownloadCSV],
        [DebtsButtons.OtherDebts, DebtsButtons.BankDebts],
        [BackButtons.BackToExplore, BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime()
    );
  } catch (error) {
    console.error("Error in displayInstallments:", error);
    return ctx.reply("❌ Error loading installments. Please try again later.");
  }
};
