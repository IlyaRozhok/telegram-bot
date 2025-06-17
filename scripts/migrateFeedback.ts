import sequelize from "../src/config/database.js";
import { QueryInterface, DataTypes } from "sequelize";

async function migrateFeedback() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    const queryInterface: QueryInterface = sequelize.getQueryInterface();

    // Check if feedback table exists
    const tables = await queryInterface.showAllTables();
    console.log("Existing tables:", tables);

    if (!tables.includes("feedback")) {
      console.log("Creating feedback table...");
      await queryInterface.createTable("feedback", {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        telegram_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        first_name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        category: {
          type: DataTypes.ENUM("compliment", "bug", "idea"),
          allowNull: false,
          defaultValue: "idea",
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      });
      console.log("✅ Feedback table created successfully.");
    } else {
      console.log("Feedback table exists. Checking for category column...");

      try {
        // Try to describe the table to see its columns
        const tableDescription = await queryInterface.describeTable("feedback");
        console.log(
          "Current feedback table structure:",
          Object.keys(tableDescription)
        );

        if (!tableDescription.category) {
          console.log("Adding category column...");
          await queryInterface.addColumn("feedback", "category", {
            type: DataTypes.ENUM("compliment", "bug", "idea"),
            allowNull: false,
            defaultValue: "idea",
          });
          console.log("✅ Category column added successfully.");
        } else {
          console.log("✅ Category column already exists.");
        }
      } catch (error) {
        console.error("Error checking/adding category column:", error);
        console.log("Attempting to sync models instead...");
        await sequelize.sync({ alter: true });
        console.log("✅ Database synced with alter option.");
      }
    }

    console.log("Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrateFeedback();
