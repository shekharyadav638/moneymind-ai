const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const MONGO_PROTOCOL = process.env.MONGO_PROTOCOL;
    const MONGO_HOST = process.env.MONGO_HOST;
    const MONGO_DATABASE = process.env.MONGO_DATABASE;
    const MONGO_USERNAME = process.env.MONGO_USERNAME;
    const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

    const MONGO_URI = `${MONGO_PROTOCOL}://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}`;
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
