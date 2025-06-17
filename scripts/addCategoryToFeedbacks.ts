import sequelize from "../src/config/database.js";
import { QueryInterface, DataTypes } from "sequelize";

async function addCategoryColumn() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    const queryInterface: QueryInterface = sequelize.getQueryInterface();

    console.log("Checking feedbacks table structure...");
    const tableDescription = await queryInterface.describeTable("feedbacks");
    console.log(
      "Current feedbacks table columns:",
      Object.keys(tableDescription)
    );

    if (!tableDescription.category) {
      console.log("Adding category column to feedbacks table...");

      // First create the ENUM type if it doesn't exist
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_feedbacks_category AS ENUM ('compliment', 'bug', 'idea');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Add the category column with default value
      await queryInterface.addColumn("feedbacks", "category", {
        type: DataTypes.ENUM("compliment", "bug", "idea"),
        allowNull: false,
        defaultValue: "idea",
      });

      console.log("✅ Category column added successfully to feedbacks table.");
    } else {
      console.log("✅ Category column already exists in feedbacks table.");
    }

    console.log("Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addCategoryColumn();
