require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required for backup");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  const snapshot = { version: 1, createdAt: new Date().toISOString(), collections: {} };
  for (const { name } of await database.listCollections().toArray()) {
    snapshot.collections[name] = await database.collection(name).find({}).toArray();
  }
  const backupDir = path.resolve(__dirname, "..", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const output = path.join(backupDir, `studentevent-${snapshot.createdAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(output, JSON.stringify(snapshot, null, 2));
  console.log(`Backup created: ${output}`);
  await mongoose.disconnect();
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
