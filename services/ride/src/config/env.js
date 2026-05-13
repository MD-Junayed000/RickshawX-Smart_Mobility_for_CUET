require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3002,
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/ride_db",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  jwtSecret: process.env.JWT_SECRET || "devSecret",
};
