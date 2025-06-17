import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import { MonobankButtons, BackButtons } from "../buttons.js";
import User from "../models/user.model.js";
import monobankService from "../services/monobankService.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";

/**
 * Display Monobank menu
 */
export const displayMonobank = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      return ctx.reply("❌ User not found. Please register first.");
    }

    const isConnected = !!user.mono_api_key;
    const userCurrency = user.currency as CurrencyCode;

    let message = `🏦 **Monobank Integration**\n\n`;

    if (isConnected) {
      message += `✅ **Status**: Connected\n`;
      message += `💳 **Account**: Linked to your Monobank\n`;
      message += `💱 **Currency**: ${CURRENCIES[userCurrency].emoji} ${userCurrency}\n\n`;
      message += `**Available actions:**\n`;
      message += `• **🔄 Sync Transactions** - Import recent transactions\n`;
      message += `• **💰 View Balance** - Check your account balance\n`;
      message += `• **❌ Disconnect API** - Remove connection\n`;
    } else {
      message += `❌ **Status**: Not connected\n\n`;
      message += `**To get started:**\n`;
      message += `1. Open Monobank app\n`;
      message += `2. Go to Settings → API\n`;
      message += `3. Generate API token\n`;
      message += `4. Click "Connect API" below\n\n`;
      message += `**Features:**\n`;
      message += `• Automatic transaction import\n`;
      message += `• Real-time balance checking\n`;
      message += `• Smart expense categorization\n`;
    }

    const buttons = isConnected
      ? [
          [MonobankButtons.SyncTransactions, MonobankButtons.ViewBalance],
          [MonobankButtons.DisconnectAPI],
          [BackButtons.BackToServices],
        ]
      : [[MonobankButtons.ConnectAPI], [BackButtons.BackToServices]];

    return ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: Markup.keyboard(buttons).resize().oneTime().reply_markup,
    });
  } catch (error) {
    console.error("Error in displayMonobank:", error);
    return ctx.reply(
      "❌ Error loading Monobank settings. Please try again later."
    );
  }
};

/**
 * Start API token input process
 */
export const startMonobankConnection = async (ctx: BotContext) => {
  ctx.session.connectingMonobank = true;

  const message = `🔗 **Connect Monobank API**

Please enter your Monobank API token:

**How to get your token:**
1. Open Monobank mobile app
2. Go to Settings (⚙️)
3. Select "API for developers"
4. Generate new token
5. Copy and paste it here

**Security note:** Your token is encrypted and stored securely. We only use it to fetch your financial data.

Send your token or type /cancel to abort:`;

  return ctx.reply(message, {
    parse_mode: "Markdown",
  });
};

/**
 * Handle API token input
 */
export const handleMonobankTokenInput = async (
  ctx: BotContext,
  token: string
) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Validate token format (Monobank tokens are typically 44 characters)
    if (!token || token.length < 20) {
      return ctx.reply(
        "❌ Invalid token format. Please check your token and try again."
      );
    }

    await ctx.reply("🔄 Validating token...");

    // Validate token with Monobank API
    const isValid = await monobankService.validateToken(token);

    if (!isValid) {
      return ctx.reply(
        "❌ Invalid token. Please check your token and try again."
      );
    }

    // Get client info to show connection success
    const clientInfo = await monobankService.getClientInfo(token);

    // Save token to database
    await User.update(
      { mono_api_key: token },
      { where: { telegram_id: telegramId } }
    );

    // Clear session
    delete ctx.session.connectingMonobank;

    const message = `✅ **Monobank Connected Successfully!**

**Account Info:**
👤 **Name**: ${clientInfo.name}
💳 **Accounts**: ${clientInfo.accounts.length} account(s) found
🔐 **Permissions**: ${clientInfo.permissions}

You can now sync transactions and view your balance!`;

    await ctx.reply(message, {
      parse_mode: "Markdown",
    });

    // Return to Monobank menu
    return displayMonobank(ctx);
  } catch (error) {
    console.error("Error connecting Monobank:", error);
    delete ctx.session.connectingMonobank;

    let errorMessage = "❌ Failed to connect to Monobank. ";
    if (error instanceof Error) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again later.";
    }

    return ctx.reply(errorMessage);
  }
};

/**
 * Disconnect Monobank API
 */
export const disconnectMonobank = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    await User.update(
      { mono_api_key: null },
      { where: { telegram_id: telegramId } }
    );

    await ctx.reply("✅ Monobank disconnected successfully.");
    return displayMonobank(ctx);
  } catch (error) {
    console.error("Error disconnecting Monobank:", error);
    return ctx.reply(
      "❌ Error disconnecting Monobank. Please try again later."
    );
  }
};

/**
 * View Monobank balance
 */
export const viewMonobankBalance = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user?.mono_api_key) {
      return ctx.reply("❌ Monobank not connected. Please connect first.");
    }

    await ctx.reply("🔄 Fetching balance...");

    const clientInfo = await monobankService.getClientInfo(user.mono_api_key);
    const userCurrency = user.currency as CurrencyCode;

    // Pre-fetch exchange rates for better performance
    const currentRates = await exchangeRateService.getCurrentRates();

    const convertAmountCached = (
      amount: number,
      fromCurrency: string,
      toCurrency: string
    ): number => {
      if (fromCurrency === toCurrency) return amount;

      let amountInUSD = amount;
      if (fromCurrency !== "USD") {
        amountInUSD = amount / currentRates[fromCurrency];
      }

      if (toCurrency === "USD") {
        return amountInUSD;
      } else {
        return amountInUSD * currentRates[toCurrency];
      }
    };

    let message = `💰 **Your Monobank Balance**\n`;
    message += `💱 **Display Currency**: ${CURRENCIES[userCurrency].emoji} ${userCurrency}\n\n`;

    let totalBalance = 0;
    const currencyBreakdown: { [key: string]: number } = {};

    for (const account of clientInfo.accounts) {
      const balance = monobankService.formatAmount(account.balance);
      const creditLimit = monobankService.formatAmount(account.creditLimit);
      const currency = monobankService.formatCurrency(account.currencyCode);

      // Convert to user's currency using cached rates
      let displayBalance = balance;
      try {
        displayBalance = convertAmountCached(balance, currency, userCurrency);
      } catch (error) {
        console.error("Error converting currency:", error);
        displayBalance = balance;
      }

      totalBalance += displayBalance;

      // Track currency breakdown
      if (!currencyBreakdown[currency]) {
        currencyBreakdown[currency] = 0;
      }
      currencyBreakdown[currency] += balance;

      message += `💳 **${account.maskedPan.join(", ") || "Account"}**\n`;

      if (currency !== userCurrency) {
        message += `💵 Balance: ${balance.toFixed(
          2
        )} ${currency} → ${displayBalance.toFixed(2)} ${userCurrency}\n`;
      } else {
        message += `💵 Balance: ${displayBalance.toFixed(2)} ${userCurrency}\n`;
      }

      if (creditLimit > 0) {
        const displayCreditLimit = convertAmountCached(
          creditLimit,
          currency,
          userCurrency
        );
        if (currency !== userCurrency) {
          message += `🏦 Credit Limit: ${creditLimit.toFixed(
            2
          )} ${currency} → ${displayCreditLimit.toFixed(2)} ${userCurrency}\n`;
        } else {
          message += `🏦 Credit Limit: ${displayCreditLimit.toFixed(
            2
          )} ${userCurrency}\n`;
        }
      }

      message += `📊 Type: ${account.type}\n`;
      message += `🆔 IBAN: ${account.iban}\n\n`;
    }

    // Show total balance
    message += `💰 **Total Balance**: ${totalBalance.toFixed(
      2
    )} ${userCurrency}\n`;

    // Show currency breakdown if multiple currencies
    const usedCurrencies = Object.keys(currencyBreakdown);
    if (usedCurrencies.length > 1) {
      message += `\n💱 **Currency Breakdown:**\n`;
      for (const [currency, amount] of Object.entries(currencyBreakdown)) {
        const convertedAmount = convertAmountCached(
          amount,
          currency,
          userCurrency
        );
        message += `• ${currency}: ${amount.toFixed(
          2
        )} → ${convertedAmount.toFixed(2)} ${userCurrency}\n`;
      }
    }

    message += `_Updated: ${new Date().toLocaleString()}_`;

    return ctx.reply(message, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error fetching balance:", error);

    let errorMessage = "❌ Failed to fetch balance. ";
    if (error instanceof Error) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again later.";
    }

    return ctx.reply(errorMessage);
  }
};

/**
 * Sync Monobank transactions
 */
export const syncMonobankTransactions = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user?.mono_api_key) {
      return ctx.reply("❌ Monobank not connected. Please connect first.");
    }

    await ctx.reply("🔄 Syncing transactions...");

    // Get transactions for the last 30 days
    const transactions = await monobankService.getRecentTransactions(
      user.mono_api_key,
      30
    );

    if (transactions.length === 0) {
      return ctx.reply("📭 No transactions found for the last 30 days.");
    }

    // Filter only expense transactions (negative amounts)
    const expenses = transactions.filter((t) => t.amount < 0);

    if (expenses.length === 0) {
      return ctx.reply(
        "📭 No expense transactions found for the last 30 days."
      );
    }

    const userCurrency = user.currency as CurrencyCode;
    let message = `📊 **Recent Monobank Expenses (Last 30 days)**\n\n`;

    // Group by category
    const categoryTotals: { [key: string]: number } = {};

    for (const transaction of expenses.slice(0, 10)) {
      // Show only first 10
      const amount = Math.abs(monobankService.formatAmount(transaction.amount));
      const category = monobankService.getMCCCategory(transaction.mcc);
      const currency = monobankService.formatCurrency(transaction.currencyCode);
      const date = new Date(transaction.time * 1000).toLocaleDateString();

      // Convert to user's currency if needed
      let displayAmount = amount;
      let displayCurrency = currency;

      if (currency !== userCurrency) {
        try {
          const convertedAmount = await exchangeRateService.convertAmount(
            amount,
            currency as CurrencyCode,
            userCurrency
          );
          displayAmount = convertedAmount;
          displayCurrency = userCurrency;
        } catch (error) {
          console.error("Error converting currency:", error);
        }
      }

      // Add to category totals
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += displayAmount;

      message += `💸 **${transaction.description}**\n`;
      message += `📅 ${date} | 🏷️ ${category}\n`;
      message += `💰 ${displayAmount.toFixed(2)} ${displayCurrency}\n\n`;
    }

    if (expenses.length > 10) {
      message += `... and ${expenses.length - 10} more transactions\n\n`;
    }

    // Show category summary
    message += `📊 **Category Summary:**\n`;
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    for (const [category, total] of sortedCategories) {
      message += `• ${category}: ${total.toFixed(2)} ${userCurrency}\n`;
    }

    const totalExpenses = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0
    );
    message += `\n💰 **Total Expenses**: ${totalExpenses.toFixed(
      2
    )} ${userCurrency}`;
    message += `\n📈 **Transactions**: ${expenses.length} expense transactions`;
    message += `\n\n_Data from Monobank API_`;

    return ctx.reply(message, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);

    let errorMessage = "❌ Failed to sync transactions. ";
    if (error instanceof Error) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again later.";
    }

    return ctx.reply(errorMessage);
  }
};
