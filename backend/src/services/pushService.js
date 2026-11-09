const https = require("https");
const PushToken = require("../models/PushToken");

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const VALID_TOKEN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

function postToExpo(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(messages);
    const request = https.request(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      timeout: 10000,
    }, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          if (response.statusCode >= 400) return reject(new Error(parsed.errors?.[0]?.message || `Expo push HTTP ${response.statusCode}`));
          resolve(parsed.data || []);
        } catch (error) { reject(error); }
      });
    });
    request.on("timeout", () => request.destroy(new Error("Expo push request timed out")));
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function sendPushToUser(userId, { title, body, data = {}, urgent = false }) {
  const devices = await PushToken.find({ userId, active: true }).lean();
  const valid = devices.filter((device) => VALID_TOKEN.test(device.token));
  if (!valid.length) return { attempted: 0, tickets: [] };

  const messages = valid.map((device) => ({
    to: device.token,
    title: String(title).slice(0, 120),
    body: String(body).slice(0, 500),
    sound: "default",
    priority: urgent ? "high" : "default",
    data,
  }));

  const tickets = [];
  for (let index = 0; index < messages.length; index += 100) {
    const batch = messages.slice(index, index + 100);
    const batchTickets = await postToExpo(batch);
    tickets.push(...batchTickets);
    await Promise.all(batchTickets.map((ticket, offset) => {
      if (ticket?.details?.error !== "DeviceNotRegistered") return null;
      return PushToken.updateOne({ token: valid[index + offset].token }, { $set: { active: false } });
    }));
  }
  return { attempted: messages.length, tickets };
}

module.exports = { sendPushToUser, VALID_TOKEN };
