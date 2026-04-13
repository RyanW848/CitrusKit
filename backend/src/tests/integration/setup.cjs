const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

async function setup() {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    process.env.JWT_SECRET = "integration-test-secret";
}

async function teardown() {
    await mongoose.disconnect();
    await mongod.stop();
}

module.exports = { setup, teardown };
