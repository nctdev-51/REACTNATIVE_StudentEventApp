const AuditLog = require("../models/AuditLog");

function auditAdminRequest(req, res, next) {
  res.on("finish", () => {
    if (!req.user?._id || req.method === "GET") return;
    AuditLog.create({
      actorId: req.user._id,
      action: `${req.method} ${req.baseUrl}${req.path}`,
      resource: req.params.id || req.path || "/",
      statusCode: res.statusCode,
      metadata: { ip: req.ip, userAgent: req.get("user-agent") || "" },
    }).catch((error) => console.error("[Audit] Could not write audit log:", error.message));
  });
  next();
}

module.exports = { auditAdminRequest };
