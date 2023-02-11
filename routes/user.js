const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");


router.get("/users", userController.getUsers);
router.get("/:id",userController.getUser);
router.post("/login",userController.login)
router.post("/signup",userController.addUser);
router.put("/edit",userController.updateUser);
// router.delete("/deleteUser",userController.deleteUser);
router.get("/:id/token/remove",userController.removeUserToken);
router.get("/:id/token",userController.getUserToken);
router.post("/:id/token/update",userController.updateUserToken);
router.post("/:id/password/update",userController.updateUserPassword);
router.get('/:id/reports',userController.getUserReports)
router.get('/:id/notifications',userController.getUserNotifications)
router.post('/:id/notifications',userController.pushUserNotification)
router.delete('/notifications/:id',userController.deleteUserNotification)
// router.post("")

module.exports=router;