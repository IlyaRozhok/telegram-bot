import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import { BackButtons } from "../buttons.js";
import User from "../models/user.model.js";
import monobankService from "../services/monobankService.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

/**
 * Display Monobank expenses analysis
 */
export const displayMonoExpenses = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      return ctx.reply("❌ User not found. Please register first.");
    }

    if (!user.mono_api_key) {
      const message = `🏦 **Mono Expenses**

❌ **Monobank not connected**

To view your Monobank expenses, you need to connect your account first.

**Steps to connect:**
1. Go to Profile → Services → Sync Monobank
2. Click "Connect API"
3. Enter your Monobank API token
4. Return here to view your expenses

**Features you'll get:**
• Automatic expense categorization
• Real-time transaction analysis
• Smart spending insights
• Currency conversion`;

      return ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: Markup.keyboard([[BackButtons.BackToExplore]])
          .resize()
          .oneTime().reply_markup,
      });
    }

    await ctx.reply("🔄 Loading Monobank expenses...");

    // Get transactions for the last 30 days
    const transactions = await monobankService.getRecentTransactions(
      user.mono_api_key,
      30
    );

    if (transactions.length === 0) {
      return ctx.reply("📭 No transactions found for the last 30 days.", {
        reply_markup: Markup.keyboard([[BackButtons.BackToExplore]])
          .resize()
          .oneTime().reply_markup,
      });
    }

    // Filter only expense transactions (negative amounts)
    const expenses = transactions.filter((t) => t.amount < 0);

    if (expenses.length === 0) {
      return ctx.reply(
        "📭 No expense transactions found for the last 30 days.",
        {
          reply_markup: Markup.keyboard([[BackButtons.BackToExplore]])
            .resize()
            .oneTime().reply_markup,
        }
      );
    }

    const userCurrency = user.currency as CurrencyCode;

    // Pre-fetch exchange rates once for better performance
    console.log("🔄 Pre-fetching exchange rates for currency conversion...");
    const currentRates = await exchangeRateService.getCurrentRates();

    // Create a currency conversion cache for this session
    const conversionCache: { [key: string]: number } = {};

    const convertAmountCached = (
      amount: number,
      fromCurrency: string,
      toCurrency: string
    ): number => {
      if (fromCurrency === toCurrency) return amount;

      const cacheKey = `${fromCurrency}_${toCurrency}`;
      if (!conversionCache[cacheKey]) {
        // Calculate conversion rate once and cache it
        let amountInUSD = amount;
        if (fromCurrency !== "USD") {
          amountInUSD = amount / currentRates[fromCurrency];
        }

        if (toCurrency === "USD") {
          conversionCache[cacheKey] =
            1 / (fromCurrency === "USD" ? 1 : currentRates[fromCurrency]);
        } else {
          conversionCache[cacheKey] =
            (fromCurrency === "USD" ? 1 : 1 / currentRates[fromCurrency]) *
            currentRates[toCurrency];
        }
      }

      return amount * conversionCache[cacheKey];
    };

    // Group by category and calculate totals
    const categoryTotals: { [key: string]: number } = {};
    const dailyTotals: { [key: string]: number } = {};
    const currencyBreakdown: { [key: string]: number } = {};

    for (const transaction of expenses) {
      const amount = Math.abs(monobankService.formatAmount(transaction.amount));
      const category = monobankService.getMCCCategory(transaction.mcc);
      const currency = monobankService.formatCurrency(transaction.currencyCode);
      const date = new Date(transaction.time * 1000)
        .toISOString()
        .split("T")[0]; // YYYY-MM-DD

      // Convert to user's currency using cached rates
      let displayAmount = amount;
      try {
        displayAmount = convertAmountCached(amount, currency, userCurrency);
      } catch (error) {
        console.error("Error converting currency:", error);
        // Fallback: use original amount if conversion fails
        displayAmount = amount;
      }

      // Track currency breakdown
      if (!currencyBreakdown[currency]) {
        currencyBreakdown[currency] = 0;
      }
      currencyBreakdown[currency] += amount; // Original amount in original currency

      // Add to category totals
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += displayAmount;

      // Add to daily totals
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += displayAmount;
    }

    // Calculate statistics
    const totalExpenses = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const averageDaily = totalExpenses / 30;
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    // Find highest spending day
    const highestDay = Object.entries(dailyTotals).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Get unique currencies used in transactions
    const usedCurrencies = Object.keys(currencyBreakdown);
    const hasMultipleCurrencies = usedCurrencies.length > 1;

    let message = `🏦 **Mono Expenses Analysis**\n`;
    message += `📅 **Period**: Last 30 days\n`;
    message += `💱 **Display Currency**: ${CURRENCIES[userCurrency].emoji} ${userCurrency}\n`;

    if (hasMultipleCurrencies) {
      message += `🌍 **Multi-Currency**: ${usedCurrencies.length} currencies detected\n`;
    }
    message += `\n`;

    message += `📊 **Summary:**\n`;
    message += `💰 Total Spent: ${totalExpenses.toFixed(2)} ${userCurrency}\n`;
    message += `📈 Transactions: ${expenses.length} expenses\n`;
    message += `📅 Daily Average: ${averageDaily.toFixed(2)} ${userCurrency}\n`;

    if (highestDay) {
      const highestDate = new Date(highestDay[0]).toLocaleDateString();
      message += `🔥 Highest Day: ${highestDate} (${highestDay[1].toFixed(
        2
      )} ${userCurrency})\n`;
    }

    // Show currency breakdown if multiple currencies
    if (hasMultipleCurrencies) {
      message += `\n💱 **Currency Breakdown:**\n`;
      for (const [currency, amount] of Object.entries(currencyBreakdown)) {
        const convertedAmount = convertAmountCached(
          amount,
          currency,
          userCurrency
        );
        const percentage = ((convertedAmount / totalExpenses) * 100).toFixed(1);
        message += `• ${currency}: ${amount.toFixed(
          2
        )} → ${convertedAmount.toFixed(2)} ${userCurrency} (${percentage}%)\n`;
      }
    }
    message += `\n`;

    message += `🏷️ **Top Categories:**\n`;
    for (const [category, total] of topCategories) {
      const percentage = ((total / totalExpenses) * 100).toFixed(1);
      message += `• ${category}: ${total.toFixed(
        2
      )} ${userCurrency} (${percentage}%)\n`;
    }

    message += `\n💡 **Recent Transactions:**\n`;

    // Show last 5 transactions
    const recentExpenses = expenses.slice(0, 5);
    for (const transaction of recentExpenses) {
      const amount = Math.abs(monobankService.formatAmount(transaction.amount));
      const category = monobankService.getMCCCategory(transaction.mcc);
      const currency = monobankService.formatCurrency(transaction.currencyCode);
      const date = new Date(transaction.time * 1000).toLocaleDateString();

      // Convert to user's currency using cached conversion
      let displayAmount = amount;
      try {
        displayAmount = convertAmountCached(amount, currency, userCurrency);
      } catch (error) {
        console.error("Error converting currency:", error);
        displayAmount = amount;
      }

      message += `💸 ${transaction.description.substring(0, 25)}${
        transaction.description.length > 25 ? "..." : ""
      }\n`;

      // Show original currency if different from display currency
      if (currency !== userCurrency) {
        message += `   ${date} • ${category}\n`;
        message += `   ${amount.toFixed(
          2
        )} ${currency} → ${displayAmount.toFixed(2)} ${userCurrency}\n\n`;
      } else {
        message += `   ${date} • ${category} • ${displayAmount.toFixed(
          2
        )} ${userCurrency}\n\n`;
      }
    }

    if (expenses.length > 5) {
      message += `... and ${expenses.length - 5} more transactions\n\n`;
    }

    // Add exchange rate info if multiple currencies were used
    if (hasMultipleCurrencies) {
      message += `\n📈 **Exchange Rates Used:**\n`;
      for (const currency of usedCurrencies) {
        if (currency !== userCurrency) {
          const rate = conversionCache[`${currency}_${userCurrency}`] || 1;
          message += `• 1 ${currency} = ${rate.toFixed(4)} ${userCurrency}\n`;
        }
      }
      message += `\n`;
    }

    message += `_Data synced from Monobank API_\n`;
    message += `_Rates cached for performance_\n`;
    message += `_Updated: ${new Date().toLocaleString()}_`;

    return ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: Markup.keyboard([
        ["🔄 Refresh Data"],
        [BackButtons.BackToExplore],
      ])
        .resize()
        .oneTime().reply_markup,
    });
  } catch (error) {
    console.error("Error in displayMonoExpenses:", error);

    let errorMessage = "❌ Failed to load Monobank expenses. ";
    if (error instanceof Error) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again later.";
    }

    return ctx.reply(errorMessage, {
      reply_markup: Markup.keyboard([[BackButtons.BackToExplore]])
        .resize()
        .oneTime().reply_markup,
    });
  }
};
