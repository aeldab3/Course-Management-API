const multer = require("multer");
const path = require("path");
const crypto = require("crypto");


const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const hashString = crypto.randomBytes(16).toString('hex'); // Generate a random string for uniqueness
        const filename = `user-${Date.now()}-${hashString}${ext}`;
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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

module.exports = upload;