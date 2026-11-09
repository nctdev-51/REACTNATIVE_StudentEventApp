require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

async function main() {
  const file = process.argv[2];
  if (!file || process.argv[3] !== "--confirm") {
    throw new Error("Usage: npm run restore -- <backup-file> --confirm");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required for restore");
  const snapshot = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  if (snapshot.version !== 1 || !snapshot.collections) throw new Error("Unsupported backup file");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  for (const [name, documents] of Object.entries(snapshot.collections)) {
    const collection = database.collection(name);
    await collection.deleteMany({});
    if (documents.length) await collection.insertMany(documents);
  }
  console.log(`Restored backup created at ${snapshot.createdAt}`);
  await mongoose.disconnect();
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
