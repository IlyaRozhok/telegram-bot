import {
  displayAllFeedbackInConsole,
  markAllFeedbackAsRead,
} from "../src/utils/feedbackManager.js";
import db from "../src/models/index.js";

async function main() {
  try {
    console.log("Connecting to database...");
    await db.sequelize.authenticate();
    console.log("Database connected successfully.");

    // Синхронизируем модели
    await db.sequelize.sync();

    const args = process.argv.slice(2);

    if (args.includes("--mark-read")) {
      console.log("Marking all feedback as read...");
      await markAllFeedbackAsRead();
      console.log("✅ All feedback marked as read.");
    }

    // Показываем все отзывы
    await displayAllFeedbackInConsole();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

main();
