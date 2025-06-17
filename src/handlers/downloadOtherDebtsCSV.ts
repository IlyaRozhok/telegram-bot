import { BotContext } from "../types.js";
import Debt from "../models/debt.model.js";
import User from "../models/user.model.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";
import fs from "fs";
import path from "path";

export const downloadOtherDebtsCSV = async (ctx: BotContext) => {
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

    // Get all other debts for the user
    const otherDebts = await Debt.findAll({
      where: { telegram_id: telegramId, type: "other" },
      order: [["created_at", "ASC"]],
    });

    if (!otherDebts.length) {
      return ctx.reply("❌ No other debts found to export.");
    }

    // Generate CSV content
    const headers = [
      "Creditor Name",
      "Amount (UAH)",
      `Amount (${userCurrency})`,
      "Comment/Due Date",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    for (const debt of otherDebts) {
      const creditorName = debt.get("creditor_name") || "Unknown";
      const amountUAH = Number(debt.get("amount") || 0);
      const comment = debt.get("comment") || "";
      const createdAt = debt.get("created_at") || "";

      // Convert amount to user currency
      let amountConverted = amountUAH.toFixed(2);

      try {
        if (userCurrency !== "UAH") {
          const converted = await exchangeRateService.convertAmount(
            amountUAH,
            "UAH",
            userCurrency
          );
          amountConverted = converted.toFixed(2);
        }
      } catch (error) {
        console.error("Error converting currency for CSV:", error);
      }

      // Parse due date from comment if available
      let formattedComment = comment;
      if (comment && comment.includes("Due by") && comment.includes("T")) {
        try {
          const dateMatch = comment.match(
            /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/
          );
          if (dateMatch) {
            const date = new Date(dateMatch[1]);
            const formattedDate = date.toLocaleDateString("en-GB");
            formattedComment = comment.replace(dateMatch[1], formattedDate);
          }
        } catch (error) {
          console.error("Error parsing date in comment:", error);
        }
      }

      const row = [
        `"${creditorName.replace(/"/g, '""')}"`, // Escape quotes
        amountUAH.toFixed(2),
        amountConverted,
        `"${formattedComment.replace(/"/g, '""')}"`, // Escape quotes
        createdAt ? new Date(createdAt).toISOString().split("T")[0] : "",
      ];

      csvRows.push(row.join(","));
    }

    // Create temporary CSV file
    const csvContent = csvRows.join("\n");
    const fileName = `other_debts_${telegramId}_${
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
        caption: `📊 Your other debts exported successfully!\n\n${
          otherDebts.length
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
    console.error("Error generating other debts CSV:", error);
    return ctx.reply("❌ Error generating CSV file. Please try again later.");
  }
};
