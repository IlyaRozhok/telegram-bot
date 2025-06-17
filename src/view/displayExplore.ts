import { Markup } from "telegraf";
import Debt from "../models/debt.model.js";
import Installment from "../models/installment.model.js";
import Expense from "../models/expense.model.js";
import Income from "../models/income.model.js";
import User from "../models/user.model.js";
import { BackButtons, ExploreButtons } from "../buttons.js";
import { BotContext } from "../types.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

export const ExploreButtonsArray = [
  ExploreButtons.Debts,
  ExploreButtons.Expenses,
  ExploreButtons.Incomes,
];

export const displayExplore = async (ctx: BotContext) => {
  const userTelegramId = ctx.chat?.id?.toString();
  if (!userTelegramId) return;

  try {
    // Get user for currency determination
    const user = await User.findOne({
      where: { telegram_id: userTelegramId },
    });

    if (!user) {
      return ctx.reply("❌ User not found. Please register first.");
    }

    const userCurrency = user.currency as CurrencyCode;

    // Get data from database
    const [allDebts, installments, expenses, incomes] = await Promise.all([
      Debt.findAll({ where: { telegram_id: userTelegramId } }),
      Installment.findAll({ where: { telegram_id: userTelegramId } }),
      Expense.findAll({ where: { telegram_id: userTelegramId } }),
      Income.findAll({ where: { telegram_id: userTelegramId } }),
    ]);

    // Check if user has any data
    if (
      !allDebts.length &&
      !installments.length &&
      !expenses.length &&
      !incomes.length
    ) {
      return ctx.reply(
        "🌟 Welcome to FinFix!\n\nYou haven't added any financial data yet. Start by adding your first income, expense, or debt to see your personalized financial overview here!\n\n💡 Tip: Use the menu below to get started.",
        Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime()
      );
    }

    // Simple calculations
    const totalDebts = allDebts.reduce(
      (sum, debt) => sum + Number(debt.get("amount") || 0),
      0
    );
    const totalInstallments = installments.reduce(
      (sum, inst) => sum + Number(inst.get("total_remaining") || 0),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.get("amount") || 0),
      0
    );
    const totalIncomes = incomes.reduce(
      (sum, inc) => sum + Number(inc.get("amount") || 0),
      0
    );

    // Next monthly payment calculation
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 1. Total monthly installment payments
    const monthlyInstallmentPayments = installments.reduce(
      (sum, inst) => sum + Number(inst.get("amount_per_month") || 0),
      0
    );

    // 2. Total bank interest from bank debts
    const bankDebts = allDebts.filter((debt) => debt.get("type") === "bank");
    const totalBankInterest = bankDebts.reduce(
      (sum, debt) => sum + Number(debt.get("monthly_interest") || 0),
      0
    );

    // 3. Other debts due in current month
    const otherDebts = allDebts.filter((debt) => debt.get("type") === "other");
    const otherDebtsThisMonth = otherDebts.filter((debt) => {
      const comment = debt.get("comment");
      if (
        !comment ||
        typeof comment !== "string" ||
        !comment.includes("Due by")
      ) {
        return false;
      }

      try {
        const dateMatch = comment.match(
          /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/
        );
        if (dateMatch) {
          const dueDate = new Date(dateMatch[1]);
          return (
            dueDate.getMonth() === currentMonth &&
            dueDate.getFullYear() === currentYear
          );
        }
      } catch (error) {
        console.error("Error parsing due date:", error);
      }
      return false;
    });

    const totalOtherDebtsThisMonth = otherDebtsThisMonth.reduce(
      (sum, debt) => sum + Number(debt.get("amount") || 0),
      0
    );

    // 4. Calculate next monthly payment
    const nextMonthlyPayment =
      totalExpenses +
      monthlyInstallmentPayments +
      totalBankInterest +
      totalOtherDebtsThisMonth;

    // Format currency function
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

    // Simple status function
    const getStatusEmoji = (hasData: boolean) => (hasData ? "✅" : "⚪");

    const message = `🎯 *Your Financial Dashboard*

📊 *Quick Overview*
${getStatusEmoji(allDebts.length > 0)} Debts: ${
      allDebts.length
    } items (${await formatCurrency(totalDebts)})
${getStatusEmoji(installments.length > 0)} Installments: ${
      installments.length
    } items (${await formatCurrency(totalInstallments)})
${getStatusEmoji(expenses.length > 0)} Expenses: ${
      expenses.length
    } items (${await formatCurrency(totalExpenses)})
${getStatusEmoji(incomes.length > 0)} Incomes: ${
      incomes.length
    } items (${await formatCurrency(totalIncomes)})

💰 *Summary*
• Total Income: ${await formatCurrency(totalIncomes)}
• Total Obligations: ${await formatCurrency(
      totalDebts + totalInstallments + totalExpenses
    )}
• Next Monthly Payment: ${await formatCurrency(nextMonthlyPayment)}

_Click the buttons below to explore each category in detail._`;

    return ctx.reply(message, {
      parse_mode: "Markdown",
      ...Markup.keyboard([ExploreButtonsArray, [BackButtons.BackToMainMenu]])
        .resize()
        .oneTime(),
    });
  } catch (error) {
    console.error("Error in displayExplore:", error);
    return ctx.reply(
      "❌ Error loading financial data. Please try again later."
    );
  }
};
