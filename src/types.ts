import { Context } from "telegraf";

export interface SessionData {
  selectedExpenseCategory?: string;
  addCategory?: string;
  totalCost?: number;
  installmentAmount?: number;
  startMonth?: number;
  startYear?: number;
  finalMonth?: number;
  finalYear?: number;
  installmentComment?: string;
  awaitingName?: boolean;
  awaitingCurrency?: boolean;
  waitingForNewName?: boolean;
  connectingMonobank?: boolean;
  username?: string;
  cardDebt?: {
    bankName?: string;
    totalDebt?: number;
    interestRate?: number;
  };
  otherDebt?: {
    who?: string;
    amount?: number;
    dueDate?: string;
  };
  expenseCategory?: string;
  editingExpenseId?: string;
  editingInstallmentId?: string;
  editingInstallmentField?: string;
  editingStartMonth?: number;
  editingFinalMonth?: number;
  editingDebtId?: string;
  editingDebtField?: string;
  editingOtherDebtId?: string;
  editingOtherDebtField?: string;
  addingRegularIncome?: {
    step: string;
    source?: string;
    amount?: number;
    frequency?: string;
    description?: string;
  };
  addingIrregularIncome?: {
    step: string;
    source?: string;
    amount?: number;
    date?: Date;
    description?: string;
  };
  editingIncomeId?: string;
  editingIncomeField?: string;
  testFlag?: string;
  sendingFeedback?:
    | boolean
    | {
        step: string;
        category?: string;
      };
}

export interface BotContext extends Context {
  session: SessionData;
}
