const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

test('Feedbacks in server/db.json and src/data/db.json are consistent', (t) => {
  const serverDb = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'db.json'), 'utf8'));
  const srcDb = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'db.json'), 'utf8'));

  assert(Array.isArray(serverDb.feedbacks), 'server/db.json must contain feedbacks array');
  assert(Array.isArray(srcDb.feedbacks), 'src/data/db.json must contain feedbacks array');
  assert(serverDb.feedbacks.length > 0, 'server/db.json feedbacks should not be empty');
  assert(srcDb.feedbacks.length > 0, 'src/data/db.json feedbacks should not be empty');
  
  // Verify that all default IDs in server also exist in src
  const srcIds = new Set(srcDb.feedbacks.map(f => f.id || f._id));
  for (const f of serverDb.feedbacks) {
    const key = f.id || f._id;
    assert(srcIds.has(key), `src/data/db.json should contain feedback ${key}`);
  }
});

test('HTTP GET /api/feedbacks retrieves all persisted reviews', async () => {
  const data = await new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/feedbacks', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => reject(e));
  });

  const feedbacks = Array.isArray(data) ? data : data.data;
  assert(Array.isArray(feedbacks), 'Response should be an array of feedbacks');
  assert(feedbacks.length >= 2, `Expected at least 2 persisted feedbacks, got ${feedbacks.length}`);

  const sample = feedbacks[0];
  assert(sample.rating !== undefined, 'Feedback must have a rating');
  assert(sample.comment !== undefined, 'Feedback must have a comment');
  assert(sample.eventId !== undefined, 'Feedback must have an eventId');
  assert(sample.userId !== undefined, 'Feedback must have a userId');
});

test('Simulating POST /api/feedbacks writes to MongoDB backend and persists', async () => {
  const newReview = {
    eventId: "66f1e2020000000000000002",
    userId: "66f1a1010000000000000001",
    rating: 5,
    comment: "Tổ chức workshop rất tuyệt vời! Dữ liệu được lưu vĩnh viễn.",
    createdAt: new Date().toISOString()
  };

  const postData = JSON.stringify(newReview);

  const resJson = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedbacks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  const savedReview = resJson.data || resJson;
  const savedId = savedReview._id || savedReview.id;
  assert(savedId, 'Saved review must have an id');
  assert.strictEqual(savedReview.comment, newReview.comment);

  // Clean up test document from MongoDB so it does not pollute user database
  try {
    const mongoose = require('D:/mobile/btl/Backend_v2/Backend/node_modules/mongoose');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/studenteventapp');
    }
    await mongoose.connection.db.collection('feedbacks').deleteOne({ _id: new mongoose.Types.ObjectId(savedId) });
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
});
