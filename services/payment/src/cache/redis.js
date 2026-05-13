let isConnected = false;

const connect = async () => {
  console.log("WARN: Redis disabled - service will work without caching");
  isConnected = false;
};

const get = async () => null;
const set = async () => undefined;
const del = async () => undefined;
const exists = async () => false;

module.exports = {
  connect,
  get,
  set,
  del,
  exists,
  client: () => null,
  isConnected: () => isConnected,
};
