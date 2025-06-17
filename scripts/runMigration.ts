import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "finfix",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    dialect: "postgres",
    logging: console.log,
  }
);

async function runMigration() {
  try {
    console.log("🔌 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    console.log("🔄 Running migration: add mono_api_key to users...");

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'mono_api_key'
    `);

    if (results.length > 0) {
      console.log("⚠️ Column mono_api_key already exists, skipping migration.");
      return;
    }

    // Add the column
    await sequelize.getQueryInterface().addColumn("users", "mono_api_key", {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Monobank API key for transaction sync",
    });

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
