import { BotContext } from "../types.js";
import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import { CURRENCIES, CurrencyCode } from "../constants/currencies.js";
import exchangeRateService from "../services/exchangeRateService.js";
import fs from "fs";
import path from "path";

export const downloadExpensesCSV = async (ctx: BotContext) => {
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

    // Get all expenses for the user
    const expenses = await Expense.findAll({
      where: { telegram_id: telegramId },
      order: [["created_at", "ASC"]],
    });

    if (!expenses.length) {
      return ctx.reply("❌ No expenses found to export.");
    }

    // Generate CSV content
    const headers = [
      "Category",
      "Amount (UAH)",
      `Amount (${userCurrency})`,
      "Comment",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    for (const expense of expenses) {
      const category = expense.get("category") || "Uncategorized";
      const amountUAH = Number(expense.get("amount") || 0);
      const comment = expense.get("comment") || "";
      const createdAt = expense.get("created_at") || "";

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

      const row = [
        `"${category.replace(/"/g, '""')}"`, // Escape quotes
        amountUAH.toFixed(2),
        amountConverted,
        `"${comment.replace(/"/g, '""')}"`, // Escape quotes
        createdAt ? new Date(createdAt).toISOString().split("T")[0] : "",
      ];

      csvRows.push(row.join(","));
    }

    // Create temporary CSV file
    const csvContent = csvRows.join("\n");
    const fileName = `expenses_${telegramId}_${
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
        caption: `📊 Your expenses exported successfully!\n\n${
          expenses.length
        } expenses included\nCurrency: UAH → ${userCurrency}\n\nGenerated: ${new Date().toLocaleString()}`,
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
    console.error("Error generating expenses CSV:", error);
    return ctx.reply("❌ Error generating CSV file. Please try again later.");
  }
};
