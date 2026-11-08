const express = require("express");
const router = express.Router();
const {
  getRegistrations,
  registerEvent,
  updateRegistration,
  checkIn,
  submitAppeal,
} = require("../controllers/registrationController");
const { protect } = require("../middleware/auth");

router.get("/", getRegistrations);
router.post("/", registerEvent);
router.patch("/:id", updateRegistration);
router.post("/check-in", checkIn);
router.post("/appeal", submitAppeal);

module.exports = router;
