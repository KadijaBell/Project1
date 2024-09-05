// backend/config/database.js
const config = require("./index");

module.exports = {
    development: {
      dialect: 'postgres',
      url: process.env.DB_FILE,
      seederStorage: "sequelize",
      logQueryParameters: true,
      typeValidation: true,
      define: {
        schema: process.env.SCHEMA,
      },
    },
    production: {
      use_env_variable: "DATABASE_URL",
      dialect: "postgres",
      seederStorage: "sequelize",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      define: {
        schema: process.env.SCHEMA,
      },
    },
  };
