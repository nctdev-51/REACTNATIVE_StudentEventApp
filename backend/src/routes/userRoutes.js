const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const controller = require("../controllers/userController");

router.get("/", protect, authorize("admin"), controller.getUsers);
router.post("/", protect, authorize("admin"), controller.createUser);
router.get("/:id/preferences", protect, controller.getPreferences);
router.put("/:id/preferences", protect, controller.updatePreferences);
router.get("/:id", protect, controller.getUser);
router.patch("/:id", protect, authorize("admin"), controller.updateUser);
router.delete("/:id", protect, authorize("admin"), controller.deleteUser);

module.exports = router;
