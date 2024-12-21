const express = require("express");
const router = express.Router();
const usersController = require("../controller/users.controller");
const authorizeToken = require("../middlewares/authorizeToken");
const allowedTo = require("../middlewares/allowedTo");
const userRole = require("../utils/userRoles");
const multer = require("multer");
const path = require("path");
const AppError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");


const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `user-${Date.now()}${ext}`;
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname));
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    else {
        return cb(new AppError("Invalid file type, allowed: jpeg, jpg, png, gif", 400, httpStatusText.FAIL), false);
    }
}

const upload = multer({ storage: diskStorage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});



router.route("/")
                .get(authorizeToken, allowedTo(userRole.ADMIN), usersController.getAllUsers)

router.route("/register")
                .post(upload.single("profilePicture"), usersController.register)

router.route("/login")
                .post(usersController.login)


module.exports = router;