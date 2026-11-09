const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const testUri = process.env.TEST_MONGO_URI;

test("MongoDB test database accepts application documents", { skip: !testUri }, async () => {
  await mongoose.connect(testUri);
  const db = mongoose.connection.db;
  const collection = db.collection("integration_probe");
  await collection.deleteMany({ suite: "student-event" });
  const result = await collection.insertOne({ suite: "student-event", createdAt: new Date() });
  assert.ok(result.insertedId);
  assert.equal(await collection.countDocuments({ suite: "student-event" }), 1);
  await collection.deleteMany({ suite: "student-event" });
  await mongoose.disconnect();
});
