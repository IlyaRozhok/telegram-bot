import { BotContext } from "../types.js";
import Debt from "../models/debt.model.js";
import User from "../models/user.model.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";
import fs from "fs";
import path from "path";

export const downloadCardDebtsCSV = async (ctx: BotContext) => {
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

    // Get all bank debts for the user
    const bankDebts = await Debt.findAll({
      where: { telegram_id: telegramId, type: "bank" },
      order: [["created_at", "ASC"]],
    });

    if (!bankDebts.length) {
      return ctx.reply("❌ No bank debts found to export.");
    }

    // Generate CSV content
    const headers = [
      "Bank Name",
      "Amount (UAH)",
      `Amount (${userCurrency})`,
      "Interest Rate (%)",
      "Monthly Interest (UAH)",
      `Monthly Interest (${userCurrency})`,
      "Comment",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    for (const debt of bankDebts) {
      const bankName = debt.get("bank_name") || "Unknown Bank";
      const amountUAH = Number(debt.get("amount") || 0);
      const interestRate = Number(debt.get("interest_rate") || 0);
      const monthlyInterestUAH = Number(debt.get("monthly_interest") || 0);
      const comment = debt.get("comment") || "";
      const createdAt = debt.get("created_at") || "";

      // Convert amounts to user currency
      let amountConverted = amountUAH.toFixed(2);
      let monthlyInterestConverted = monthlyInterestUAH.toFixed(2);

      try {
        if (userCurrency !== "UAH") {
          const convertedAmount = await exchangeRateService.convertAmount(
            amountUAH,
            "UAH",
            userCurrency
          );
          const convertedMonthlyInterest =
            await exchangeRateService.convertAmount(
              monthlyInterestUAH,
              "UAH",
              userCurrency
            );

          amountConverted = convertedAmount.toFixed(2);
          monthlyInterestConverted = convertedMonthlyInterest.toFixed(2);
        }
      } catch (error) {
        console.error("Error converting currency for CSV:", error);
      }

      const row = [
        `"${bankName.replace(/"/g, '""')}"`, // Escape quotes
        amountUAH.toFixed(2),
        amountConverted,
        interestRate.toFixed(2),
        monthlyInterestUAH.toFixed(2),
        monthlyInterestConverted,
        `"${comment.replace(/"/g, '""')}"`, // Escape quotes
        createdAt ? new Date(createdAt).toISOString().split("T")[0] : "",
      ];

      csvRows.push(row.join(","));
    }

    // Create temporary CSV file
    const csvContent = csvRows.join("\n");
    const fileName = `bank_debts_${telegramId}_${
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
        caption: `📊 Your bank debts exported successfully!\n\n${
          bankDebts.length
        } debts included\nCurrency: UAH → ${userCurrency}\n\nGenerated: ${new Date().toLocaleString()}`,
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
    console.error("Error generating bank debts CSV:", error);
    return ctx.reply("❌ Error generating CSV file. Please try again later.");
  }
};
