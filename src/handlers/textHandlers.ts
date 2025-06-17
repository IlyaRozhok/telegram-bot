import { Telegraf } from "telegraf";
import { BotContext } from "../types.js";
import {
  MenuButtons,
  BackButtons,
  ExploreButtons,
  DebtsButtons,
  IncomeButtons,
  ProfileButtons,
  SettingsButtons,
  ServicesButtons,
  MonobankButtons,
  InstallmentsButtons,
  OtherDebtsButtons,
  BankDebtsButtons,
  ExpensesButtons,
} from "../buttons.js";
import { handleUserInitInput } from "./handleUserInitInput.js";
import { welcomeScreen } from "../view/welcomeScreen.js";
import { handleNewDebt } from "./handleNewDebt.js";
import { displayExplore } from "../view/displayExplore.js";
import { displayDebts } from "../view/displayDebts.js";
import { displayOtherDebts } from "../view/displayOtherDebts.js";
import { displayInstallments } from "../view/displayInstallments.js";
import { displayCardDebts } from "../view/displayCardDebts.js";
import { handleProfile } from "./handleProfile.js";
import { displayExpenses } from "../view/displayExpenses.js";
import { displayIncome } from "../view/displayIncome.js";
import { displayAllIncomes } from "../view/displayAllIncomes.js";
import {
  addRegularIncome,
  handleRegularIncomeInput,
} from "./addRegularIncome.js";
import {
  addIrregularIncome,
  handleIrregularIncomeInput,
} from "./addIrregularIncome.js";
import { handleExpenses } from "./handleExpenses.js";
import { handleNewExpense } from "./handleNewExpense.js";
import { handleNewInstallment } from "./handleNewInstallment.js";
import { handleNewBankDebt } from "./handleNewBankDebt.js";
import { handleNewOtherDebt } from "./handleNewOtherDebt.js";
import { startFeedback, handleFeedbackInput } from "./handleFeedback.js";
import {
  handleChangeCurrency,
  handleSettings,
  handleChangeAccountName,
  handleNewAccountName,
} from "./handleProfile.js";
import { handleEditHandlers } from "./editHandlers.js";
import { displayServices } from "./handleServices.js";
import {
  displayMonobank,
  startMonobankConnection,
  handleMonobankTokenInput,
  disconnectMonobank,
  viewMonobankBalance,
  syncMonobankTransactions,
} from "./handleMonobank.js";
import { displayMonoExpenses } from "../view/displayMonoExpenses.js";
import { downloadInstallmentsCSV } from "./downloadInstallmentsCSV.js";
import { downloadOtherDebtsCSV } from "./downloadOtherDebtsCSV.js";
import { downloadCardDebtsCSV } from "./downloadCardDebtsCSV.js";
import { downloadExpensesCSV } from "./downloadExpensesCSV.js";
import Expense from "../models/expense.model.js";

/**
 * Setup text message handlers for the bot
 */
export function setupTextHandlers(bot: Telegraf<BotContext>): void {
  bot.on("text", async (ctx: BotContext) => {
    if (!ctx.message || !("text" in ctx.message)) {
      console.log("Received non-text message");
      return;
    }

    console.log("📝 Received message:", ctx.message.text);
    const text = ctx.message.text;

    try {
      // Handle user registration
      if (ctx.session.awaitingName) {
        console.log("👤 Awaiting name");
        return await handleUserInitInput(ctx);
      }

      // Handle Monobank token input
      if (ctx.session.connectingMonobank) {
        if (text === "/cancel") {
          delete ctx.session.connectingMonobank;
          return ctx.reply("❌ Monobank connection cancelled.");
        }
        return handleMonobankTokenInput(ctx, text);
      }

      // Handle new account name input
      if (ctx.session.waitingForNewName) {
        if (text === SettingsButtons.BackToProfile) {
          delete ctx.session.waitingForNewName;
          return handleProfile(ctx);
        }
        return handleNewAccountName(ctx, text);
      }

      // Navigation handlers
      if (text === BackButtons.BackToMainMenu) {
        clearAllSessions(ctx);
        return welcomeScreen(ctx);
      }

      if (text === BackButtons.BackToDebts) {
        delete ctx.session.sendingFeedback;
        return handleNewDebt(ctx);
      }

      if (text === BackButtons.BackToExplore) {
        delete ctx.session.sendingFeedback;
        return displayExplore(ctx);
      }

      if (text === BackButtons.BackToServices) {
        return displayServices(ctx);
      }

      if (text === BackButtons.BackToProfile) {
        return handleProfile(ctx);
      }

      // Main menu handlers
      if (text === MenuButtons.Explore) {
        delete ctx.session.sendingFeedback;
        return displayExplore(ctx);
      }

      if (text === MenuButtons.NewDebt) {
        delete ctx.session.sendingFeedback;
        return handleNewDebt(ctx);
      }

      if (text === MenuButtons.Profile) {
        delete ctx.session.sendingFeedback;
        return handleProfile(ctx);
      }

      // Explore submenu handlers
      if (text === ExploreButtons.Debts) {
        return displayDebts(ctx);
      }

      if (text === ExploreButtons.Expenses) {
        return displayExpenses(ctx);
      }

      if (text === ExploreButtons.Incomes) {
        return displayIncome(ctx);
      }

      if (text === ExploreButtons.MonoExpenses) {
        return displayMonoExpenses(ctx);
      }

      // Mono expenses refresh
      if (text === "🔄 Refresh Data") {
        return displayMonoExpenses(ctx);
      }

      // Debts submenu handlers
      if (text === DebtsButtons.OtherDebts) {
        return displayOtherDebts(ctx);
      }

      if (text === DebtsButtons.Installments) {
        return displayInstallments(ctx);
      }

      if (text === DebtsButtons.BankDebts) {
        return displayCardDebts(ctx);
      }

      // Installments submenu handlers
      if (text === InstallmentsButtons.DownloadCSV) {
        return downloadInstallmentsCSV(ctx);
      }

      // Other debts submenu handlers
      if (text === OtherDebtsButtons.DownloadCSV) {
        return downloadOtherDebtsCSV(ctx);
      }

      // Bank debts submenu handlers
      if (text === BankDebtsButtons.DownloadCSV) {
        return downloadCardDebtsCSV(ctx);
      }

      // Expenses submenu handlers
      if (text === ExpensesButtons.DownloadCSV) {
        return downloadExpensesCSV(ctx);
      }

      // Income submenu handlers
      if (text === IncomeButtons.ViewAll) {
        return displayAllIncomes(ctx);
      }

      if (text === IncomeButtons.AddRegular) {
        return addRegularIncome(ctx);
      }

      if (text === IncomeButtons.AddIrregular) {
        return addIrregularIncome(ctx);
      }

      // Expense handlers
      if (text === "📉 Add Expense") {
        return handleExpenses(ctx, "add");
      }

      if (text === "📊 Manage Expenses") {
        return handleExpenses(ctx, "show");
      }

      // Profile handlers
      if (text === ProfileButtons.Feedback) {
        return startFeedback(ctx);
      }

      if (text === ProfileButtons.Services) {
        return displayServices(ctx);
      }

      if (text === ProfileButtons.Settings) {
        return handleSettings(ctx);
      }

      if (text === ProfileButtons.BackToMain) {
        return welcomeScreen(ctx);
      }

      // Settings handlers
      if (text === SettingsButtons.ChangeCurrency) {
        return handleChangeCurrency(ctx);
      }

      if (text === SettingsButtons.ChangeName) {
        return handleChangeAccountName(ctx);
      }

      if (text === SettingsButtons.BackToProfile) {
        return handleProfile(ctx);
      }

      // Services handlers
      if (text === ServicesButtons.SyncMonobank) {
        return displayMonobank(ctx);
      }

      // Monobank handlers
      if (text === MonobankButtons.ConnectAPI) {
        return startMonobankConnection(ctx);
      }

      if (text === MonobankButtons.SyncTransactions) {
        return syncMonobankTransactions(ctx);
      }

      if (text === MonobankButtons.ViewBalance) {
        return viewMonobankBalance(ctx);
      }

      if (text === MonobankButtons.DisconnectAPI) {
        return disconnectMonobank(ctx);
      }

      // Refresh data handler for Mono Expenses
      if (text === "🔄 Refresh Data") {
        return displayMonoExpenses(ctx);
      }

      // Handle editing expense amount
      if (ctx.session.editingExpenseId && !isNaN(Number(text))) {
        await Expense.update(
          { amount: Number(text) },
          { where: { id: ctx.session.editingExpenseId } }
        );
        ctx.session.editingExpenseId = undefined;
        return ctx.reply("✅ Expense updated!");
      }

      // Handle expense amount input (when category is already selected)
      if (ctx.session.expenseCategory && !isNaN(Number(text))) {
        return handleNewExpense(ctx);
      }

      // Handle debt category flows
      if (ctx.session.addCategory === "⏱️ Installment") {
        console.log("=== CALLING handleNewInstallment ===");
        return handleNewInstallment(ctx);
      }

      if (ctx.session.addCategory === "💳 Bank Debt") {
        console.log("=== CALLING handleNewBankDebt ===");
        return handleNewBankDebt(ctx);
      }

      if (ctx.session.addCategory === "💸 Other Debt") {
        console.log("=== CALLING handleNewOtherDebt ===");
        return handleNewOtherDebt(ctx);
      }

      // Handle income input flows
      if (ctx.session.addingRegularIncome) {
        return handleRegularIncomeInput(ctx);
      }

      if (ctx.session.addingIrregularIncome) {
        return handleIrregularIncomeInput(ctx);
      }

      // Handle feedback input
      if (ctx.session.sendingFeedback) {
        return handleFeedbackInput(ctx);
      }

      // Handle edit operations
      const editResult = await handleEditHandlers(ctx, text);
      if (editResult) return;

      console.log("🔍 Session state:", ctx.session);
    } catch (error) {
      console.error("❌ Error in text handler:", error);
      return ctx.reply("❌ An error occurred. Please try again.");
    }
  });
}

/**
 * Clear all session data when returning to main menu
 */
function clearAllSessions(ctx: BotContext): void {
  delete ctx.session.sendingFeedback;
  delete ctx.session.addingRegularIncome;
  delete ctx.session.addingIrregularIncome;
  delete ctx.session.addCategory;
  delete ctx.session.editingExpenseId;
  delete ctx.session.expenseCategory;
  delete ctx.session.connectingMonobank;
}
