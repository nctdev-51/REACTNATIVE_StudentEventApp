const https = require("https");

function postJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...headers },
      timeout: 10000,
    }, (response) => {
      let output = "";
      response.on("data", (chunk) => { output += chunk; });
      response.on("end", () => response.statusCode >= 400
        ? reject(new Error(`Email provider HTTP ${response.statusCode}: ${output}`))
        : resolve());
    });
    request.on("timeout", () => request.destroy(new Error("Email request timed out")));
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function sendOtpEmail({ to, code, purpose }) {
  const subject = purpose === "reset" ? "Mã đặt lại mật khẩu StudentEvent" : "Mã xác nhận đổi email StudentEvent";
  const text = `Mã xác nhận của bạn là ${code}. Mã có hiệu lực trong 15 phút.`;
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn(`[Email demo] ${subject} for ${to}: ${code}`);
    return { delivered: false, demoCode: process.env.NODE_ENV !== "production" ? code : undefined };
  }
  await postJson("https://api.resend.com/emails", {
    from: process.env.EMAIL_FROM,
    to: [to],
    subject,
    text,
  }, { Authorization: `Bearer ${process.env.RESEND_API_KEY}` });
  return { delivered: true };
}

module.exports = { sendOtpEmail };
