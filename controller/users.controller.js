const Users = require("../model/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const AppError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const bcrypt = require('bcrypt');
const generateJWT = require("../utils/generateJWT");
const userSchema = require("../validators/userValidator");

const getAllUsers = asyncWrapper(
    async (req, res, next) => {
        const query = req.query;
        const limit = query.limit || 10;
        const page = query.page || 1;
        const skip = (page - 1) * limit;
        const users = await Users.find({}, {"__v": 0}).limit(limit).skip(skip);
        return res.json({status: httpStatusText.SUCCESS, data: {users}});
});

const register = asyncWrapper( 
    async (req, res, next) => {
        
        const { error } = userSchema.validate(req.body);
        if (error) {
            return next(new AppError(error.message, 400, httpStatusText.FAIL));
        }

        const {username, email, role, password } = req.body;
        if (await Users.findOne({ $or: [{ email }, { username }] })) {
            const error = new AppError("User or Email already exists", 400, httpStatusText.FAIL);
            return next(error);
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await Users.create({username, email, role, password: hashedPassword, profilePicture: req.file.filename});
        const token = await generateJWT({id: user._id, email: user.email, role: user.role});
        user.token = token;
        return res.status(201).json({status: httpStatusText.SUCCESS, data: {user}});
});

const login = asyncWrapper( 
    async (req, res, next) => {
        const {email, password} = req.body;
        const user = await Users.findOne({email});
        if (!user) {
            const error = new AppError("User not found", 404, httpStatusText.FAIL);
            return next(error);
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            const error = new AppError("Invalid password", 401, httpStatusText.FAIL);
            return next(error);
        }
        const token = await generateJWT({id: user._id, email: user.email, role: user.role});
        return res.json({status: httpStatusText.SUCCESS, data: {token}});
});


module.exports = {
    getAllUsers,
    register,
    login
}