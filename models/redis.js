const redis = require("redis");

const client = redis.createClient();

client
    .connect()
    .then(() => console.log("connected to redis client"))
    .catch((err) => console.log("error while connecting"));

module.exports = client;
