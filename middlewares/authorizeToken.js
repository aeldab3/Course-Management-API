const jwt = require("jsonwebtoken");
const httpStatusText = require("../utils/httpStatusText");
const AppError = require("../utils/appError");

const authorizeToken = (req, res, next) => {
    try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                const error = new AppError("Token not found", 401, httpStatusText.FAIL);
                return next(error);
            }
            const token = authHeader.split(" ")[1];
            const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY)
            req.currentUser = currentUser;
            next();
    }
    catch (e) {
        const error = new AppError("Invalid token", 401, httpStatusText.ERROR);
        return next(error);
    }
}
module.exports = authorizeToken;