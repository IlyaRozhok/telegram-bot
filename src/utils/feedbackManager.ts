import Feedback from "../models/feedback.model.js";

// Получить все отзывы
export const getAllFeedback = async () => {
  try {
    const feedback = await Feedback.findAll({
      order: [["created_at", "DESC"]],
    });
    return feedback;
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return [];
  }
};

// Получить непрочитанные отзывы
export const getUnreadFeedback = async () => {
  try {
    const feedback = await Feedback.findAll({
      where: { is_read: false },
      order: [["created_at", "DESC"]],
    });
    return feedback;
  } catch (error) {
    console.error("Error fetching unread feedback:", error);
    return [];
  }
};

// Пометить отзыв как прочитанный
export const markFeedbackAsRead = async (feedbackId: string) => {
  try {
    await Feedback.update({ is_read: true }, { where: { id: feedbackId } });
    return true;
  } catch (error) {
    console.error("Error marking feedback as read:", error);
    return false;
  }
};

// Пометить все отзывы как прочитанные
export const markAllFeedbackAsRead = async () => {
  try {
    await Feedback.update({ is_read: true }, { where: { is_read: false } });
    return true;
  } catch (error) {
    console.error("Error marking all feedback as read:", error);
    return false;
  }
};

// Получить статистику фидбека
export const getFeedbackStats = async () => {
  try {
    const total = await Feedback.count();
    const unread = await Feedback.count({ where: { is_read: false } });
    const read = total - unread;

    return {
      total,
      unread,
      read,
    };
  } catch (error) {
    console.error("Error getting feedback stats:", error);
    return { total: 0, unread: 0, read: 0 };
  }
};

// Вывести все отзывы в консоль (для быстрого просмотра)
export const displayAllFeedbackInConsole = async () => {
  try {
    const feedback = await getAllFeedback();

    console.log("\n" + "=".repeat(50));
    console.log("📝 ALL FEEDBACK MESSAGES");
    console.log("=".repeat(50));

    if (feedback.length === 0) {
      console.log("No feedback messages found.");
      return;
    }

    feedback.forEach((item, index) => {
      const isRead = item.get("is_read") ? "✅" : "🔴";
      const username = item.get("username")
        ? `@${item.get("username")}`
        : item.get("first_name") || "Unknown";

      const category = item.get("category");
      const categoryIcon =
        category === "compliment"
          ? "👍"
          : category === "bug"
          ? "👎"
          : category === "idea"
          ? "💡"
          : "📝";

      console.log(
        `\n${index + 1}. ${isRead} ${categoryIcon} ${
          category?.toUpperCase() || "GENERAL"
        } - ${username}`
      );
      console.log(`   ID: ${item.get("id")}`);
      console.log(`   Telegram ID: ${item.get("telegram_id")}`);
      console.log(
        `   Date: ${new Date(item.get("created_at") as Date).toLocaleString()}`
      );
      console.log(`   Message: "${item.get("message")}"`);
      console.log("-".repeat(40));
    });

    const stats = await getFeedbackStats();
    console.log(
      `\n📊 Stats: ${stats.total} total, ${stats.unread} unread, ${stats.read} read`
    );
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("Error displaying feedback:", error);
  }
};
