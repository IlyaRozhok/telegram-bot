import { Markup } from "telegraf";
import { BackButtons } from "../buttons.js";
import Debt from "../models/debt.model.js";
import { BotContext } from "../types.js";

const EditOtherDebtButtons = {
  CreditorName: "👤 Edit Creditor",
  Amount: "💰 Edit Amount",
  Comment: "💬 Edit Comment",
};

export const handleEditOtherDebt = async (ctx: BotContext, debtId: string) => {
  try {
    const debt = await Debt.findByPk(debtId);

    if (!debt) {
      return ctx.reply("❌ Debt not found.");
    }

    // Check if user owns this debt
    if (debt.get("telegram_id") !== ctx.from?.id?.toString()) {
      return ctx.reply("❌ You can only edit your own debts.");
    }

    // Check if it's an other debt
    if (debt.get("type") !== "other") {
      return ctx.reply("❌ This function is only for other debts.");
    }

    // Ensure session is properly initialized
    ctx.session = ctx.session || {};
    ctx.session.editingOtherDebtId = debtId;
    delete ctx.session.editingOtherDebtField;

    // Also set a test flag to verify session persistence
    ctx.session.testFlag = "session_working";

    console.log("EDIT_HANDLER: Set editingOtherDebtId to:", debtId);
    console.log("EDIT_HANDLER: Session after setting:", ctx.session);

    const debtInfo = `✏️ **Editing Other Debt:**

👤 **Creditor:** ${debt.get("creditor_name") || "Not specified"}
💰 **Amount:** ${Math.round(Number(debt.get("amount")))} UAH
💬 **Comment:** ${debt.get("comment") || "No comment"}

**What would you like to edit?**`;

    // Store the debt ID in session and use short callback data
    ctx.session.editingOtherDebtId = debtId;

    return ctx.reply(debtInfo, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("👤 Creditor Name", `edit_od_creditor`),
          Markup.button.callback("💰 Amount", `edit_od_amount`),
        ],
        [Markup.button.callback("💬 Comment", `edit_od_comment`)],
        [Markup.button.callback("❌ Cancel", `cancel_edit_od`)],
      ]).reply_markup,
    });
  } catch (error) {
    console.error("Error editing other debt:", error);
    return ctx.reply("❌ Error editing debt. Please try again.");
  }
};

export const handleEditOtherDebtField = async (
  ctx: BotContext,
  fieldType: string
) => {
  console.log("FIELD_HANDLER: Called with fieldType:", fieldType);
  console.log("FIELD_HANDLER: Current session:", ctx.session);
  console.log(
    "FIELD_HANDLER: editingOtherDebtId:",
    ctx.session?.editingOtherDebtId
  );
  console.log("FIELD_HANDLER: testFlag:", ctx.session?.testFlag);

  if (!ctx.session || !ctx.session.editingOtherDebtId) {
    console.log(
      "ERROR: Missing editingOtherDebtId in session. Full session:",
      ctx.session
    );
    return ctx.reply(
      "❌ No debt being edited. Please try clicking Edit again."
    );
  }

  try {
    const debt = await Debt.findByPk(ctx.session.editingOtherDebtId);
    if (!debt) {
      return ctx.reply("❌ Debt not found.");
    }

    ctx.session.editingOtherDebtField = fieldType;

    switch (fieldType) {
      case "creditor":
        return ctx.reply(
          `Current creditor: "${
            debt.get("creditor_name") || "Not specified"
          }"\n\nEnter new creditor name:`,
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

export const handleEditOtherDebtInput = async (
  ctx: BotContext,
  input: string
) => {
  console.log("handleEditOtherDebtInput called with:", {
    input,
    editingOtherDebtId: ctx.session.editingOtherDebtId,
    editingOtherDebtField: ctx.session.editingOtherDebtField,
    fullSession: ctx.session,
  });

  if (!ctx.session.editingOtherDebtId || !ctx.session.editingOtherDebtField) {
    console.log("Missing session data for other debt editing");
    return ctx.reply("❌ No debt field being edited.");
  }

  try {
    const debt = await Debt.findByPk(ctx.session.editingOtherDebtId);
    if (!debt) {
      return ctx.reply("❌ Debt not found.");
    }

    const fieldType = ctx.session.editingOtherDebtField;
    let updateData: any = {};
    let success = false;

    switch (fieldType) {
      case "creditor":
        if (input.trim().length < 2) {
          return ctx.reply(
            "❌ Creditor name must be at least 2 characters long."
          );
        }
        updateData.creditor_name = input.trim();
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
        success = true;
        break;

      case "comment":
        updateData.comment = input.trim();
        success = true;
        break;
    }

    if (success) {
      await Debt.update(updateData, {
        where: { id: ctx.session.editingOtherDebtId },
      });

      // Clear editing session
      delete ctx.session.editingOtherDebtId;
      delete ctx.session.editingOtherDebtField;

      return ctx.reply(
        "✅ Other debt updated successfully!",
        Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime()
      );
    }
  } catch (error) {
    console.error("Error updating other debt:", error);
    return ctx.reply("❌ Error updating debt. Please try again.");
  }
};

// Export the edit buttons for use in text handlers
export { EditOtherDebtButtons };
