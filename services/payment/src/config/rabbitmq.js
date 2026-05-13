const amqp = require("amqplib");
const cfg = require("./env");

let connection;
let channel;
let isConnected = false;

const connect = async () => {
  try {
    connection = await amqp.connect(cfg.rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertExchange("trip_events", "topic", { durable: true });
    await channel.assertExchange("payment_events", "topic", { durable: true });

    await channel.assertQueue("payment_trip_queue", { durable: true });
    await channel.bindQueue("payment_trip_queue", "trip_events", "#");

    console.log("RabbitMQ connected for payment service");
    isConnected = true;
  } catch (error) {
    console.log(
      "WARN: RabbitMQ not available (service will work without messaging):",
      error.message,
    );
    isConnected = false;
  }
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
  publishEvent,
  consumeEvents,
  channel: () => channel,
  isConnected: () => isConnected,
};
