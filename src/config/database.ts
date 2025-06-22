import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const {
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_HOST = "localhost",
  DB_PORT = "5432",
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Missing required PostgreSQL environment variables");
}
const port = process.env.DB_PORT || "10000";
const sequelize = new Sequelize({
  dialect: "postgres",
  host: DB_HOST,
  port: parseInt(port, 10),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true,
  },
});

export default sequelize;
