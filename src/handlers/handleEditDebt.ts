import { Markup } from "telegraf";
import { BackButtons } from "../buttons.js";
import Debt from "../models/debt.model.js";
import { BotContext } from "../types.js";

const EditDebtButtons = {
  BankName: "🏦 Edit Bank Name",
  Amount: "💰 Edit Amount",
  InterestRate: "📈 Edit Interest Rate",
  Comment: "💬 Edit Comment",
};

export const handleEditDebt = async (ctx: BotContext, debtId: string) => {
  try {
    const debt = await Debt.findByPk(debtId);

    if (!debt) {
      return ctx.reply("❌ Debt not found.");
    }

    // Check if user owns this debt
    if (debt.get("telegram_id") !== ctx.from?.id?.toString()) {
      return ctx.reply("❌ You can only edit your own debts.");
    }

    // Check if it's a bank debt
    if (debt.get("type") !== "bank") {
      return ctx.reply("❌ This function is only for bank debts.");
    }

    ctx.session.editingDebtId = debtId;
    delete ctx.session.editingDebtField;

    const debtInfo = `✏️ **Editing Bank Debt:**

🏦 **Bank:** ${debt.get("bank_name") || "Not specified"}
💰 **Amount:** ${Math.round(Number(debt.get("amount")))} UAH
📈 **Interest Rate:** ${
      debt.get("interest_rate")
        ? `${debt.get("interest_rate")}%`
        : "Not specified"
    }
📊 **Monthly Interest:** ${
      debt.get("monthly_interest")
        ? `${Math.round(Number(debt.get("monthly_interest")))} UAH`
        : "Not calculated"
    }
💬 **Comment:** ${debt.get("comment") || "No comment"}

**What would you like to edit?**`;

    return ctx.reply(debtInfo, {
      parse_mode: "Markdown",
      reply_markup: Markup.keyboard([
        [EditDebtButtons.BankName, EditDebtButtons.Amount],
        [EditDebtButtons.InterestRate],
        [EditDebtButtons.Comment],
        [BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime().reply_markup,
    });
  } catch (error) {
    console.error("Error editing debt:", error);
    return ctx.reply("❌ Error editing debt. Please try again.");
  }
};

export const handleEditDebtField = async (
  ctx: BotContext,
  fieldType: string
) => {
  if (!ctx.session.editingDebtId) {
    return ctx.reply("❌ No debt being edited.");
  }

  try {
    const debt = await Debt.findByPk(ctx.session.editingDebtId);
    if (!debt) {
      return ctx.reply("❌ Debt not found.");
    }

    ctx.session.editingDebtField = fieldType;

    switch (fieldType) {
      case "bankName":
        return ctx.reply(
          `Current bank: "${
            debt.get("bank_name") || "Not specified"
          }"\n\nEnter new bank name:`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      case "amount":
        return ctx.reply(
          `Current amount: ${Math.round(
            Number(debt.get("amount"))
          )} UAH\n\nEnter new amount:`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      case "interestRate":
        return ctx.reply(
          `Current interest rate: ${
            debt.get("interest_rate")
              ? `${debt.get("interest_rate")}%`
              : "Not specified"
          }\n\nEnter new interest rate (e.g., 3.5):`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      case "comment":
        return ctx.reply(
          `Current comment: "${
            debt.get("comment") || "No comment"
          }"\n\nEnter new comment:`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      default:
        return ctx.reply("❌ Invalid field type.");
    }
  } catch (error) {
    console.error("Error handling field edit:", error);
    return ctx.reply("❌ Error processing edit. Please try again.");
  }
};

export const handleEditDebtInput = async (ctx: BotContext, input: string) => {
  if (!ctx.session.editingDebtId || !ctx.session.editingDebtField) {
    return ctx.reply("❌ No debt field being edited.");
  }

  try {
    const debt = await Debt.findByPk(ctx.session.editingDebtId);
    if (!debt) {
      return ctx.reply("❌ Debt not found.");
    }

    const fieldType = ctx.session.editingDebtField;
    let updateData: any = {};
    let success = false;

    switch (fieldType) {
      case "bankName":
        if (input.trim().length < 2) {
          return ctx.reply("❌ Bank name must be at least 2 characters long.");
        }
        updateData.bank_name = input.trim();
        success = true;
        break;

      case "amount":
        const amount = parseFloat(input.replace(",", "."));
        if (isNaN(amount) || amount <= 0) {
          return ctx.reply(
            "❌ Please enter a valid positive number for amount."
          );
        }
        updateData.amount = amount;

        // Recalculate monthly interest if interest rate exists
        const interestRate = debt.get("interest_rate");
        if (interestRate) {
          updateData.monthly_interest = parseFloat(
            ((amount * interestRate) / 100).toFixed(2)
          );
        }
        success = true;
        break;

      case "interestRate":
        const rate = parseFloat(input.replace(",", "."));
        if (isNaN(rate) || rate < 0) {
          return ctx.reply(
            "❌ Please enter a valid non-negative number for interest rate."
          );
        }
        updateData.interest_rate = rate;

        // Recalculate monthly interest
        const debtAmount = Number(debt.get("amount"));
        updateData.monthly_interest = parseFloat(
          ((debtAmount * rate) / 100).toFixed(2)
        );
        success = true;
        break;

      case "comment":
        updateData.comment = input.trim();
        success = true;
        break;
    }

    if (success) {
      await Debt.update(updateData, {
        where: { id: ctx.session.editingDebtId },
      });

      // Clear editing session
      delete ctx.session.editingDebtId;
      delete ctx.session.editingDebtField;

      let successMessage = "✅ Debt updated successfully!";

      // Add specific success info for amount/rate changes
      if (fieldType === "amount" || fieldType === "interestRate") {
        const newMonthlyInterest = updateData.monthly_interest;
        if (newMonthlyInterest !== undefined) {
          successMessage += `\n\n📊 New monthly interest: ${Math.round(
            newMonthlyInterest
          )} UAH`;
        }
      }

      return ctx.reply(
        successMessage,
        Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime()
      );
    }
  } catch (error) {
    console.error("Error updating debt:", error);
    return ctx.reply("❌ Error updating debt. Please try again.");
  }
};

// Export the edit buttons for use in text handlers
export { EditDebtButtons };
