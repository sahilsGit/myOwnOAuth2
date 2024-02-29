const { MongoClient } = require("mongodb");

const uri = process.env.MONGO;
const client = new MongoClient(uri);
const db = client.db("test");

async function connect() {
  try {
    await client.connect(); // Connect
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.log(error.message);
    console.log("Failed to connect!");
  }
}

module.exports = { connect, db };
