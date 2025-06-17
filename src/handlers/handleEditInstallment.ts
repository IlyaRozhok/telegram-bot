import { Markup } from "telegraf";
import { BackButtons } from "../buttons.js";
import Installment from "../models/installment.model.js";
import { BotContext } from "../types.js";

const EditInstallmentButtons = {
  Comment: "📝 Edit Comment",
  TotalCost: "💰 Edit Total Cost",
  MonthlyPayment: "💵 Edit Monthly Payment",
  StartDate: "📅 Edit Start Date",
  FinalDate: "🗓 Edit Final Date",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const handleEditInstallment = async (
  ctx: BotContext,
  installmentId: string
) => {
  try {
    const installment = await Installment.findByPk(installmentId);

    if (!installment) {
      return ctx.reply("❌ Installment not found.");
    }

    // Check if user owns this installment
    if (installment.get("telegram_id") !== ctx.from?.id?.toString()) {
      return ctx.reply("❌ You can only edit your own installments.");
    }

    ctx.session.editingInstallmentId = installmentId;
    delete ctx.session.editingInstallmentField;

    const installmentInfo = `✏️ **Editing Installment:**

📝 **Comment:** ${installment.get("comment") || "No comment"}
💰 **Total Cost:** ${Math.round(installment.get("total_cost"))} UAH
💵 **Monthly Payment:** ${Math.round(installment.get("amount_per_month"))} UAH
📅 **Start Date:** ${installment.get("start_date")}
🗓 **Final Date:** ${installment.get("final_payment_date")}
🔢 **Months Remaining:** ${installment.get("months_remaining")}
💸 **Service Fee:** ${Number(installment.get("service_fee")).toFixed(2)} UAH

**What would you like to edit?**`;

    return ctx.reply(installmentInfo, {
      parse_mode: "Markdown",
      reply_markup: Markup.keyboard([
        [EditInstallmentButtons.Comment, EditInstallmentButtons.TotalCost],
        [EditInstallmentButtons.MonthlyPayment],
        [EditInstallmentButtons.StartDate, EditInstallmentButtons.FinalDate],
        [BackButtons.BackToMainMenu],
      ])
        .resize()
        .oneTime().reply_markup,
    });
  } catch (error) {
    console.error("Error editing installment:", error);
    return ctx.reply("❌ Error editing installment. Please try again.");
  }
};

export const handleEditInstallmentField = async (
  ctx: BotContext,
  fieldType: string
) => {
  if (!ctx.session.editingInstallmentId) {
    return ctx.reply("❌ No installment being edited.");
  }

  try {
    const installment = await Installment.findByPk(
      ctx.session.editingInstallmentId
    );
    if (!installment) {
      return ctx.reply("❌ Installment not found.");
    }

    ctx.session.editingInstallmentField = fieldType;

    switch (fieldType) {
      case "comment":
        return ctx.reply(
          `Current comment: "${
            installment.get("comment") || "No comment"
          }"\n\nEnter new comment:`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      case "totalCost":
        return ctx.reply(
          `Current total cost: ${Math.round(
            installment.get("total_cost")
          )} UAH\n\nEnter new total cost:`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      case "monthlyPayment":
        return ctx.reply(
          `Current monthly payment: ${Math.round(
            installment.get("amount_per_month")
          )} UAH\n\nEnter new monthly payment:`,
          Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime()
        );

      case "startDate":
        return ctx.reply(
          `Current start date: ${installment.get(
            "start_date"
          )}\n\nSelect new start month:`,
          Markup.keyboard(monthNames, { columns: 3 }).oneTime().resize()
        );

      case "finalDate":
        return ctx.reply(
          `Current final date: ${installment.get(
            "final_payment_date"
          )}\n\nSelect new final month:`,
          Markup.keyboard(monthNames, { columns: 3 }).oneTime().resize()
        );

      default:
        return ctx.reply("❌ Invalid field type.");
    }
  } catch (error) {
    console.error("Error handling field edit:", error);
    return ctx.reply("❌ Error processing edit. Please try again.");
  }
};

export const handleEditInstallmentInput = async (
  ctx: BotContext,
  input: string
) => {
  if (
    !ctx.session.editingInstallmentId ||
    !ctx.session.editingInstallmentField
  ) {
    return ctx.reply("❌ No installment field being edited.");
  }

  try {
    const installment = await Installment.findByPk(
      ctx.session.editingInstallmentId
    );
    if (!installment) {
      return ctx.reply("❌ Installment not found.");
    }

    const fieldType = ctx.session.editingInstallmentField;
    let updateData: any = {};
    let success = false;

    switch (fieldType) {
      case "comment":
        updateData.comment = input;
        success = true;
        break;

      case "totalCost":
        const totalCost = parseFloat(input.replace(",", "."));
        if (isNaN(totalCost) || totalCost <= 0) {
          return ctx.reply(
            "❌ Please enter a valid positive number for total cost."
          );
        }
        updateData.total_cost = totalCost;
        // Recalculate service fee
        const monthsCount = installment.get("months_count");
        updateData.service_fee = (totalCost / 100) * 1.9 * monthsCount;
        success = true;
        break;

      case "monthlyPayment":
        const monthlyAmount = parseFloat(input.replace(",", "."));
        if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
          return ctx.reply(
            "❌ Please enter a valid positive number for monthly payment."
          );
        }
        updateData.amount_per_month = monthlyAmount;
        // Recalculate total remaining
        const monthsRemaining = installment.get("months_remaining");
        updateData.total_remaining = monthsRemaining * monthlyAmount;
        success = true;
        break;

      case "startDate":
        if (
          !monthNames.map((m) => m.toLowerCase()).includes(input.toLowerCase())
        ) {
          return ctx.reply("❌ Please select a valid month from the keyboard.");
        }
        ctx.session.editingStartMonth = monthNames
          .map((m) => m.toLowerCase())
          .indexOf(input.toLowerCase());
        const now = new Date();
        const years = [0, 1, 2, 3].map((i) => String(now.getFullYear() - i));
        return ctx.reply(
          "Which year for the start date?",
          Markup.keyboard(years, { columns: 2 }).oneTime().resize()
        );

      case "finalDate":
        if (
          !monthNames.map((m) => m.toLowerCase()).includes(input.toLowerCase())
        ) {
          return ctx.reply("❌ Please select a valid month from the keyboard.");
        }
        ctx.session.editingFinalMonth = monthNames
          .map((m) => m.toLowerCase())
          .indexOf(input.toLowerCase());
        const currentYear = new Date().getFullYear();
        const futureYears = [0, 1, 2, 3].map((i) => String(currentYear + i));
        return ctx.reply(
          "Which year for the final date?",
          Markup.keyboard(futureYears, { columns: 2 }).oneTime().resize()
        );

      case "startYear":
        const startYear = parseInt(input);
        if (isNaN(startYear) || !/^\d{4}$/.test(input)) {
          return ctx.reply("❌ Please enter a valid 4-digit year.");
        }
        const startMonth = ctx.session.editingStartMonth;
        const startDate = new Date(startYear, startMonth, 1);
        updateData.start_date = startDate.toISOString().split("T")[0];

        // Recalculate months and totals
        const finalDate = new Date(installment.get("final_payment_date"));
        const newMonthsCount =
          (finalDate.getFullYear() - startYear) * 12 +
          (finalDate.getMonth() - startMonth) +
          1;
        const today = new Date();
        let newMonthsPaid = Math.max(
          0,
          (today.getFullYear() - startYear) * 12 +
            (today.getMonth() - startMonth)
        );
        const newMonthsRemaining = Math.max(0, newMonthsCount - newMonthsPaid);

        updateData.months_count = newMonthsCount;
        updateData.months_remaining = newMonthsRemaining;
        updateData.total_remaining =
          newMonthsRemaining * installment.get("amount_per_month");
        updateData.service_fee =
          (installment.get("total_cost") / 100) * 1.9 * newMonthsCount;

        delete ctx.session.editingStartMonth;
        success = true;
        break;

      case "finalYear":
        const finalYear = parseInt(input);
        if (isNaN(finalYear) || !/^\d{4}$/.test(input)) {
          return ctx.reply("❌ Please enter a valid 4-digit year.");
        }
        const finalMonth = ctx.session.editingFinalMonth;
        const newFinalDate = new Date(finalYear, finalMonth + 1, 0);
        updateData.final_payment_date = newFinalDate
          .toISOString()
          .split("T")[0];

        // Recalculate months and totals
        const currentStartDate = new Date(installment.get("start_date"));
        const newMonthsCountFinal =
          (finalYear - currentStartDate.getFullYear()) * 12 +
          (finalMonth - currentStartDate.getMonth()) +
          1;
        const todayFinal = new Date();
        let newMonthsPaidFinal = Math.max(
          0,
          (todayFinal.getFullYear() - currentStartDate.getFullYear()) * 12 +
            (todayFinal.getMonth() - currentStartDate.getMonth())
        );
        const newMonthsRemainingFinal = Math.max(
          0,
          newMonthsCountFinal - newMonthsPaidFinal
        );

        updateData.months_count = newMonthsCountFinal;
        updateData.months_remaining = newMonthsRemainingFinal;
        updateData.total_remaining =
          newMonthsRemainingFinal * installment.get("amount_per_month");
        updateData.service_fee =
          (installment.get("total_cost") / 100) * 1.9 * newMonthsCountFinal;

        delete ctx.session.editingFinalMonth;
        success = true;
        break;
    }

    if (success) {
      await Installment.update(updateData, {
        where: { id: ctx.session.editingInstallmentId },
      });

      // Clear editing session
      delete ctx.session.editingInstallmentId;
      delete ctx.session.editingInstallmentField;

      return ctx.reply(
        "✅ Installment updated successfully!",
        Markup.keyboard([[BackButtons.BackToMainMenu]])
          .resize()
          .oneTime()
      );
    }
  } catch (error) {
    console.error("Error updating installment:", error);
    return ctx.reply("❌ Error updating installment. Please try again.");
  }
};

// Export the edit buttons for use in text handlers
export { EditInstallmentButtons };
