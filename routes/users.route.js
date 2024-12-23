const express = require("express");
const router = express.Router();
const usersController = require("../controller/users.controller");
const authorizeToken = require("../middlewares/authorizeToken");
const allowedTo = require("../middlewares/allowedTo");
const userRole = require("../utils/userRoles");
const upload = require("../middlewares/upload");


router.route("/")
                .get(authorizeToken, allowedTo(userRole.MANAGER, userRole.ADMIN), usersController.getAllUsers)

router.route("/register")
                .post(upload.single("profilePicture"), usersController.register)

router.route("/login")
                .post(usersController.login)

router.route("/logout")
                .post(authorizeToken, usersController.logout)

router.route("/:id")
                .get(authorizeToken, allowedTo(userRole.MANAGER, userRole.ADMIN), usersController.getUserById)
                .patch(authorizeToken, upload.single("profilePicture"), usersController.updateUser)
                .delete(authorizeToken, allowedTo(userRole.MANAGER), usersController.deleteUser)

module.exports = router;