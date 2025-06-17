import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import LocalSession from "telegraf-session-local";
import db from "./models/index.js";
import { BotContext } from "./types.js";
import { setupCallbackHandlers } from "./handlers/callbackHandlers.js";
import { setupTextHandlers } from "./handlers/textHandlers.js";
import { setupActionHandlers } from "./handlers/actionHandlers.js";
import { handleUserInit } from "./handlers/handleUserInit.js";

// Load environment variables
dotenv.config();

/**
 * Initialize database connection and sync models
 */
async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔌 Attempting to connect to database...");
    await db.sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    console.log("🔄 Synchronizing database models...");
    await db.sequelize.sync();
    console.log("✅ Database models synchronized successfully.");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

/**
 * Initialize Telegram bot with middleware and handlers
 */
async function initializeBot(): Promise<void> {
  try {
    const token = process.env.TELEGRAM_API_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "TELEGRAM_API_ACCESS_TOKEN is not defined in environment variables"
      );
    }

    console.log("🤖 Initializing bot...");
    const bot = new Telegraf<BotContext>(token);

    // Setup session middleware
    console.log("📝 Setting up session middleware...");
    const localSession = new LocalSession<BotContext>({
      database: "session-db.json",
    });
    bot.use(localSession.middleware());

    // Ensure session is initialized
    bot.use((ctx, next) => {
      if (!ctx.session) {
        console.log("⚠️ Session not initialized, creating empty session");
        ctx.session = {};
      }
      return next();
    });

    // Setup handlers
    bot.start(async (ctx) => {
      console.log("🚀 Bot started by user:", ctx.from?.id);
      await handleUserInit(ctx);
    });

    // Setup modular handlers
    setupCallbackHandlers(bot);
    setupTextHandlers(bot);
    setupActionHandlers(bot);

    console.log("🚀 Starting bot...");
    await bot.launch();
    console.log("✅ Bot started successfully!");

    // Enable graceful stop
    process.once("SIGINT", () => {
      console.log("🛑 Received SIGINT, stopping bot...");
      bot.stop("SIGINT");
    });
    process.once("SIGTERM", () => {
      console.log("🛑 Received SIGTERM, stopping bot...");
      bot.stop("SIGTERM");
    });
  } catch (error) {
    console.error("❌ Bot initialization failed:", error);
    throw error;
  }
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    console.log("🌟 Starting FinFix Telegram Bot...");
    await initializeDatabase();
    await initializeBot();
  } catch (error) {
    console.error("💥 Application failed to start:", error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
