import sequelize from "../src/config/database.js";
import "../src/models/feedback.model.js"; // Import to register the model
import "../src/models/user.model.js";
import "../src/models/debt.model.js";
import "../src/models/income.model.js";

async function syncDatabase() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    console.log("Force syncing database models...");
    // Force sync will drop and recreate tables
    await sequelize.sync({ force: true });
    console.log("✅ Database models synchronized successfully.");

    console.log("Database sync completed!");
  } catch (error) {
    console.error("❌ Database sync failed:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

syncDatabase();
