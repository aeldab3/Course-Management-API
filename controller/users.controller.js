const Users = require("../model/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const AppError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const bcrypt = require('bcrypt');
const generateJWT = require("../utils/generateJWT");
const userSchema = require("../validators/userValidator");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const sendMail = require("../config/nodemailer");
const path = require("path");

const getAllUsers = asyncWrapper(
    async (req, res, next) => {
        const query = req.query;
        const limit = query.limit || 10;
        const page = query.page || 1;
        const skip = (page - 1) * limit;
        const users = await Users.find({}, {"__v": 0}).limit(limit).skip(skip);
        return res.json({status: httpStatusText.SUCCESS, data: {users}});
});

const getUserById = asyncWrapper(
    async (req, res, next) => {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return next(new AppError("User not found", 404, httpStatusText.FAIL));
        }
        return res.json({status: httpStatusText.SUCCESS, data: {user}});
});

const updateUser = asyncWrapper(
    async (req, res, next) => {
        try {
            // Ensure the logged-in user is updating their own profile
            if (req.currentUser.id !== req.params.id) {
                if (req.file) await fs.unlink(req.file.path);
                return next(new AppError("You are not authorized to update this profile", 403));
            }
            const { error } = userSchema.validate(req.body);
            if (error) {
                if (req.file) await fs.unlink(req.file.path);
                return next(new AppError(error.message, 400, httpStatusText.FAIL));
            }

            const updateData = {...req.body};
            let profilePictureUpdated = false; // Flag to track profile picture update

            // Handle password update
            if (req.body.password) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
                updateData.password = hashedPassword;
            }

            // Handle profile picture update
            if (req.file) {
                    try {
                        const result = await cloudinary.uploader.upload(req.file.path, {
                        folder: "usersProfilePicture",
                        transformation: [{ width: 500, height: 500, crop: "limit" }],
                        });
                    
                        // Set new profile picture URL
                        updateData.profilePicture = result.secure_url;
                    
                        profilePictureUpdated = true;
                    
                        //Remove the old profile picture from Cloudinary if it exists
                        const user = await Users.findById(req.params.id);
                        if (user && user.profilePicture) {
                            const oldImagePublicId = user.profilePicture.split("/").slice(-1)[0].split(".")[0]; // Extract public ID
                            await cloudinary.uploader.destroy(`usersProfilePicture/${oldImagePublicId}`);
                        }
                }
                catch(uploadError) {
                                    // Cleanup: Remove uploaded file if upload fails
                                    await fs.unlink(req.file.path);
                                    return next(new AppError("Failed to upload profile picture", 500));
                }
                finally{
                    await fs.unlink(req.file.path);
                }
            }

            const updatedUser = await Users.findByIdAndUpdate(req.params.id, {$set: updateData}, { new: true });
            if (!updatedUser) {
                return next(new AppError("User not found", 404, httpStatusText.FAIL));
            }

            if (profilePictureUpdated) {
                // Send profile picture updated email
                const emailTemplatePath = path.resolve(__dirname, "../emails/profilePictureUpdated.html");
                const emailTemplate = (await fs.readFile(emailTemplatePath, "utf-8")).replace("{{username}}", updatedUser.username);

                await sendMail({
                    to: updatedUser.email,
                    subject: "Profile Picture Updated",
                    html: emailTemplate,
                });
            }
            return res.json({status: httpStatusText.SUCCESS, data: {user: updatedUser}});
        }
        catch (err) {
        // Cleanup: Remove uploaded file if an unexpected error occurs
        if (req.file) {
            await fs.unlink(req.file.path);
        }
        return next(err);
        }
    });

const deleteUser = asyncWrapper(
    async (req, res, next) => {
        try {
            const userDeleted = await Users.deleteOne({_id: req.params.id});
            if (!userDeleted) {
                return next(new AppError("User not found", 404, httpStatusText.FAIL));
            }
            return res.status(200).json({status: httpStatusText.SUCCESS, data: null});
        }
        catch (error) {
            return res.status(400).json({status: httpStatusText.ERROR, data: null, message: error.message});
        }
});

const register = asyncWrapper( 
    async (req, res, next) => {
        
        const { error } = userSchema.validate(req.body);
        if (error) {
            if (req.file) {
                await fs.unlink(req.file.path); // Remove the file if validation fails
            }
            return next(new AppError(error.message, 400, httpStatusText.FAIL));
        }

        const {username, email, role, password} = req.body;
        if (await Users.findOne({ $or: [{ email }, { username }] })) {
            if (req.file) {
                await fs.unlink(req.file.path); // Remove the file if user already exists
            }
            return next(new AppError("User or Email already exists", 400, httpStatusText.FAIL));
        }

        // Upload profile picture to Cloudinary
        let profilePictureUrl = null;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "usersProfilePicture",
                transformation: [{ width: 500, height: 500, crop: "limit" }]
            });
            profilePictureUrl = result.secure_url;
            await fs.unlink(req.file.path);
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // const user = await Users.create({username, email, role, password: hashedPassword, profilePicture: req.file.filename}); before upload to cloudinary
        const user = await Users.create({username, email, role, password: hashedPassword, profilePicture: profilePictureUrl});
        const token = await generateJWT({id: user._id, email: user.email, role: user.role});
        user.token = token;

        // Send registration email
        const emailTemplatePath = path.resolve(__dirname, "../emails/registration.html");
        const emailTemplate = (await fs.readFile(emailTemplatePath, "utf-8")).replace("{{username}}", username);

        await sendMail({
            to: email,
            subject: "Welcome to Our Courses Platform!",
            html: emailTemplate
        })
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

const logout = asyncWrapper(
    async (req, res, next) => {
        req.currentUser = null;
        return res.json({status: httpStatusText.SUCCESS, data: null});
});



module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    register,
    login,
    logout
}