import { Model, DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/database.js";

interface UserAttributes {
  id?: number;
  telegram_id: string;
  username?: string;
  currency: string;
  mono_api_key?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public telegram_id!: string;
  public username!: string;
  public currency!: string;
  public mono_api_key?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    // define associations here
  }
}

User.init(
  {
    telegram_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "UAH",
      validate: {
        isIn: [["UAH", "USD", "EUR", "PLN"]],
      },
    },
    mono_api_key: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Monobank API key for transaction sync",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
  }
);

export default User;
