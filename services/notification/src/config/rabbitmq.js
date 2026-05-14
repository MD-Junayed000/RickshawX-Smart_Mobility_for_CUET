const amqp = require("amqplib");
const cfg = require("./env");

let connection;
let channel;
let isConnected = false;

const connect = async () => {
  if (isConnected) return;
  try {
    connection = await amqp.connect(cfg.rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertExchange("trip_events", "topic", { durable: true });
    await channel.assertExchange("payment_events", "topic", { durable: true });
    await channel.assertExchange("ride_events", "topic", { durable: true });

    await channel.assertQueue("notification_queue", { durable: true });
    await channel.bindQueue("notification_queue", "trip_events", "#");
    await channel.bindQueue("notification_queue", "payment_events", "#");
    await channel.bindQueue("notification_queue", "ride_events", "#");

    console.log("RabbitMQ connected for notification service");
    isConnected = true;
  } catch (error) {
    console.log(
      "WARN: RabbitMQ not available (service will work without messaging):",
      error.message,
    );
    isConnected = false;
  }
};

const connectWithRetry = (onConnected, delayMs = 5000) => {
  const attempt = async () => {
    await connect();
    if (isConnected) {
      if (onConnected) {
        try {
          await onConnected();
        } catch (error) {
          console.log("Error during RabbitMQ setup:", error.message);
        }
      }
      return;
    }
    setTimeout(attempt, delayMs);
  };

  attempt();
};

const consumeEvents = async (queue, callback) => {
  try {
    if (!isConnected || !channel) {
      console.log(
        "WARN: RabbitMQ not available, skipping event consumption for:",
        queue,
      );
      return;
    }
    channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        Promise.resolve(callback(content)).catch((err) => {
          console.log("Error processing event (continuing):", err.message);
        });
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.log(
      "Error consuming events (continuing without messaging):",
      error.message,
    );
  }
};

module.exports = {
  connect,
  connectWithRetry,
  consumeEvents,
  channel: () => channel,
  isConnected: () => isConnected,
};
