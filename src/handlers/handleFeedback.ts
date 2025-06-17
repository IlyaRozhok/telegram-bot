import { Markup } from "telegraf";
import { BotContext } from "../types.js";
import {
  ProfileButtons,
  MenuButtons,
  ExploreButtons,
  DebtsButtons,
  IncomeButtons,
  BackButtons,
} from "../buttons.js";
import Feedback from "../models/feedback.model.js";

export const startFeedback = async (ctx: BotContext) => {
  // Set feedback session
  ctx.session.sendingFeedback = { step: "category" };

  const feedbackMessage = `💬 Send Feedback

What type of feedback would you like to share?

Choose a category below:`;

  return ctx.reply(feedbackMessage, {
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.button.callback("👍 Compliment", "feedback_compliment"),
        Markup.button.callback("👎 Bug", "feedback_bug"),
      ],
      [Markup.button.callback("💡 Idea", "feedback_idea")],
      [
        Markup.button.callback("👤 Back to Profile", "feedback_back_profile"),
        Markup.button.callback("↪️ Back to Main", "feedback_back_main"),
      ],
    ]).reply_markup,
  });
};

export const handleFeedbackCallback = async (ctx: BotContext) => {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

  const callbackData = ctx.callbackQuery.data;

  // Only handle feedback callbacks
  if (!callbackData.startsWith("feedback_")) return;

  let category = "";
  let categoryMessage = "";

  switch (callbackData) {
    case "feedback_compliment":
      category = "compliment";
      categoryMessage = `👍 Compliment

Thank you for choosing to share a compliment! 

Please tell me what you liked about FinFix:`;
      break;
    case "feedback_bug":
      category = "bug";
      categoryMessage = `👎 Bug Report

I appreciate you reporting a bug! This helps make FinFix better.

Please describe the issue you encountered:`;
      break;
    case "feedback_idea":
      category = "idea";
      categoryMessage = `💡 Feature Idea

Great! I love hearing new ideas for FinFix.

Please share your suggestion or feature request:`;
      break;
    case "feedback_back_main":
      // Clear feedback session and go back to main menu
      delete ctx.session.sendingFeedback;
      await ctx.answerCbQuery();
      await ctx.editMessageText("Returning to main menu...");

      // Import welcomeScreen dynamically to avoid circular dependencies
      const { welcomeScreen } = await import("../view/welcomeScreen.js");
      return welcomeScreen(ctx);
    case "feedback_back_profile":
      // Clear feedback session and go back to profile
      delete ctx.session.sendingFeedback;
      await ctx.answerCbQuery();
      await ctx.editMessageText("Returning to profile...");

      // Import displayProfile dynamically to avoid circular dependencies
      const { displayProfile } = await import("../view/displayProfile.js");
      return displayProfile(ctx);
    default:
      return;
  }

  // Update session with category and move to message step
  ctx.session.sendingFeedback = {
    step: "message",
    category: category,
  };

  // Answer the callback query
  await ctx.answerCbQuery();

  // Edit the original message to show the selected category
  await ctx.editMessageText(categoryMessage);

  // Send a new message with the back button
  return ctx.reply("Type your message below:", {
    reply_markup: Markup.keyboard([[BackButtons.BackToMainMenu]])
      .resize()
      .oneTime().reply_markup,
  });
};

export const handleFeedbackInput = async (ctx: BotContext) => {
  if (!ctx.session.sendingFeedback) return;

  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";

  // List of all navigation buttons to exclude from feedback
  const navigationButtons = [
    ...Object.values(MenuButtons),
    ...Object.values(ExploreButtons),
    ...Object.values(DebtsButtons),
    ...Object.values(IncomeButtons),
    ...Object.values(ProfileButtons),
    ...Object.values(BackButtons),
    "⏱️ Installment",
    "💳 Bank",
    "💸 Other",
  ];

  // Skip if this is a navigation button or empty text
  if (!text || navigationButtons.includes(text)) {
    return;
  }

  // This function now only handles message input, not category selection
  // Category selection is handled by callback queries in the main bot file

  // Handle message input (only if we're in message step)
  if (
    typeof ctx.session.sendingFeedback === "object" &&
    ctx.session.sendingFeedback.step === "message"
  ) {
    try {
      const userInfo = ctx.from;
      const category = ctx.session.sendingFeedback.category || "idea";

      // Save feedback to database
      const feedbackRecord = await Feedback.create({
        telegram_id: userInfo?.id?.toString() || "unknown",
        username: userInfo?.username || null,
        first_name: userInfo?.first_name || null,
        category: category,
        message: text,
        is_read: false,
      });

      // Also log to console for immediate visibility
      console.log("=== NEW FEEDBACK SAVED ===");
      console.log(
        `User: ${
          userInfo?.username
            ? `@${userInfo.username}`
            : userInfo?.first_name || "Unknown"
        }`
      );
      console.log(`Telegram ID: ${userInfo?.id}`);
      console.log(`Category: ${category}`);
      console.log(`Date: ${new Date().toLocaleString()}`);
      console.log(`Message: ${text}`);
      console.log(`Database ID: ${feedbackRecord.get("id")}`);
      console.log("========================");

      // Clear feedback session
      delete ctx.session.sendingFeedback;

      return ctx.reply(
        `✅ Feedback Received!

Thank you for your feedback! I really appreciate you taking the time to help improve FinFix.

Your message has been logged and I will review it soon.

If you need a direct response, you can also contact me:
📧 Email: i_rozhok@icloud.com
📱 Telegram: @irozho

Thanks again! 🙏`,
        {
          reply_markup: Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime().reply_markup,
        }
      );
    } catch (error) {
      console.error("Error processing feedback:", error);

      return ctx.reply(
        `❌ Error processing feedback.

Please contact me directly:
📧 Email: i_rozhok@icloud.com
📱 Telegram: @irozho

Sorry for the inconvenience!`,
        {
          reply_markup: Markup.keyboard([[BackButtons.BackToMainMenu]])
            .resize()
            .oneTime().reply_markup,
        }
      );
    }
  }
};
