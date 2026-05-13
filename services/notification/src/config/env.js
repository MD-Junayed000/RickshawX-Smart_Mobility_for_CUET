require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3005,
  mongoUrl:
    process.env.MONGO_URL || "mongodb://localhost:27017/notification_db",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost:5672",
};
