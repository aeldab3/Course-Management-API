const httpStatusText = require("../utils/httpStatusText");

const errorHandler = (error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        status: error.statusText || httpStatusText.ERROR,
        message: error.message || "Something went wrong",
        code: error.statusCode || 500,
        data: null
    });
};

module.exports = errorHandler;