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

    await channel.assertExchange("ride_events", "topic", { durable: true });
    await channel.assertQueue("ride_queue", { durable: true });
    await channel.bindQueue("ride_queue", "ride_events", "#");

    console.log("RabbitMQ connected for ride service");
    isConnected = true;
  } catch (error) {
    console.log(
      "WARN: RabbitMQ not available (service will work without messaging):",
      error.message,
    );
    isConnected = false;
  }
};

const connectWithRetry = (delayMs = 5000) => {
  const attempt = async () => {
    await connect();
    if (isConnected) return;
    setTimeout(attempt, delayMs);
  };

  attempt();
};

const publishEvent = async (exchange, routingKey, message) => {
  try {
    if (!isConnected || !channel) {
      console.log(
        "WARN: RabbitMQ not available, skipping event publish:",
        exchange,
        routingKey,
      );
      return;
    }
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  } catch (error) {
    console.log(
      "Error publishing event (continuing without messaging):",
      error.message,
    );
  }
};

module.exports = {
  connect,
  connectWithRetry,
  publishEvent,
  channel: () => channel,
  isConnected: () => isConnected,
};
