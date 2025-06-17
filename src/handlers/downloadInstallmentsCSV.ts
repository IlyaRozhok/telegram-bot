import { BotContext } from "../types.js";
import Installment from "../models/installment.model.js";
import User from "../models/user.model.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";
import fs from "fs";
import path from "path";

export const downloadInstallmentsCSV = async (ctx: BotContext) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Get user for currency
    const user = await User.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      return ctx.reply("❌ User not found. Please register first.");
    }

    const userCurrency = user.currency as CurrencyCode;

    // Get all installments for the user
    const installments = await Installment.findAll({
      where: { telegram_id: telegramId },
      order: [["start_date", "ASC"]],
    });

    if (!installments.length) {
      return ctx.reply("❌ No installments found to export.");
    }

    // Generate CSV content
    const headers = [
      "Comment",
      "Monthly Payment (UAH)",
      `Monthly Payment (${userCurrency})`,
      "Total Cost (UAH)",
      `Total Cost (${userCurrency})`,
      "Total Remaining (UAH)",
      `Total Remaining (${userCurrency})`,
      "Service Fee (UAH)",
      `Service Fee (${userCurrency})`,
      "Months Total",
      "Months Remaining",
      "Start Date",
      "Final Payment Date",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    for (const installment of installments) {
      const comment = installment.get("comment") || "No comment";
      const monthlyPaymentUAH = Number(
        installment.get("amount_per_month") || 0
      );
      const totalCostUAH = Number(installment.get("total_cost") || 0);
      const totalRemainingUAH = Number(installment.get("total_remaining") || 0);
      const serviceFeeUAH = Number(installment.get("service_fee") || 0);
      const monthsTotal = Number(installment.get("months_count") || 0);
      const monthsRemaining = Number(installment.get("months_remaining") || 0);
      const startDate = installment.get("start_date") || "";
      const finalDate = installment.get("final_payment_date") || "";
      const createdAt = installment.get("created_at") || "";

      // Convert amounts to user currency
      let monthlyPaymentConverted = monthlyPaymentUAH.toFixed(2);
      let totalCostConverted = totalCostUAH.toFixed(2);
      let totalRemainingConverted = totalRemainingUAH.toFixed(2);
      let serviceFeeConverted = serviceFeeUAH.toFixed(2);

      try {
        if (userCurrency !== "UAH") {
          const convertedMonthly = await exchangeRateService.convertAmount(
            monthlyPaymentUAH,
            "UAH",
            userCurrency
          );
          const convertedTotal = await exchangeRateService.convertAmount(
            totalCostUAH,
            "UAH",
            userCurrency
          );
          const convertedRemaining = await exchangeRateService.convertAmount(
            totalRemainingUAH,
            "UAH",
            userCurrency
          );
          const convertedFee = await exchangeRateService.convertAmount(
            serviceFeeUAH,
            "UAH",
            userCurrency
          );

          monthlyPaymentConverted = convertedMonthly.toFixed(2);
          totalCostConverted = convertedTotal.toFixed(2);
          totalRemainingConverted = convertedRemaining.toFixed(2);
          serviceFeeConverted = convertedFee.toFixed(2);
        }
      } catch (error) {
        console.error("Error converting currency for CSV:", error);
      }

      const row = [
        `"${comment.replace(/"/g, '""')}"`, // Escape quotes in comment
        monthlyPaymentUAH.toFixed(2),
        monthlyPaymentConverted,
        totalCostUAH.toFixed(2),
        totalCostConverted,
        totalRemainingUAH.toFixed(2),
        totalRemainingConverted,
        serviceFeeUAH.toFixed(2),
        serviceFeeConverted,
        monthsTotal,
        monthsRemaining,
        startDate,
        finalDate,
        createdAt ? new Date(createdAt).toISOString().split("T")[0] : "",
      ];

      csvRows.push(row.join(","));
    }

    // Create temporary CSV file
    const csvContent = csvRows.join("\n");
    const fileName = `installments_${telegramId}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    const filePath = path.join(process.cwd(), "temp", fileName);

    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write CSV file
    fs.writeFileSync(filePath, csvContent, "utf-8");

    // Send file to user
    await ctx.replyWithDocument(
      {
        source: filePath,
        filename: fileName,
      },
      {
        caption: `📊 Your installments exported successfully!\n\n${
          installments.length
        } installments included\nCurrency: UAH → ${userCurrency}\n\nGenerated: ${new Date().toLocaleString()}`,
      }
    );

    // Clean up temporary file
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("Error cleaning up CSV file:", error);
      }
    }, 5000); // Delete after 5 seconds
  } catch (error) {
    console.error("Error generating installments CSV:", error);
    return ctx.reply("❌ Error generating CSV file. Please try again later.");
  }
};
