// const {} = require("express-validator");
const Course = require("../model/course.model");
const httpStatusText = require("../utils/httpStatusText");
const asyncWrapper = require("../middlewares/asyncWrapper");
const AppError = require("../utils/appError");
const courseSchema = require("../validators/courseValidator");

const getAllCourses = asyncWrapper( 
    async (req, res, next) => {
        const query = req.query;
        const limit = query.limit || 10;
        const page = query.page || 1;
        const skip = (page - 1) * limit;
        const courses = await Course.find({}, {"__v": 0}).limit(limit).skip(skip);
        res.json({status: httpStatusText.SUCCESS, data: {courses}});
});

const getCourseById = asyncWrapper(
    //asyncWrapper automatically wraps getCourseById.
    //If an error occurs, asyncWrapper catches it and forwards it to the error handler using next(err).
    async (req, res, next) => {
        const course = await Course.findById(req.params.id);
        if (!course) {
            const error = new AppError("Course not found", 404, httpStatusText.FAIL);
            return next(error);
        }
        return res.json({status: httpStatusText.SUCCESS, data: {course}});
    }
);

const addCourse = asyncWrapper(
    async(req, res, next) => {
    const { error } = courseSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.message, 400, httpStatusText.FAIL));
    }
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     const error = new AppError(errors.array(), 400, httpStatusText.FAIL);
    //     return next(error);
    // } else {
        const newCourse = new Course(req.body);
        await newCourse.save();
        return res.status(201).json({status: httpStatusText.SUCCESS, data: {course: newCourse}});
    // }
});

const updateCourse = asyncWrapper( 
    async (req, res, next) => {
        const { error } = courseSchema.validate(req.body);
        if (error) {
            return next(new AppError(error.message, 400, httpStatusText.FAIL));
        }
        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, {$set: {...req.body}}, { new: true });
        if (!updatedCourse) {
            const error = new AppError("Course not found", 404, httpStatusText.FAIL);
            return next(error);
        }
        return res.json({status: httpStatusText.SUCCESS, data: {course: updatedCourse}});
});

const deleteCourse = asyncWrapper(
    async (req, res, next) => {
    try {
        const courseDeleted = await Course.deleteOne({_id: req.params.id});
        if (!courseDeleted) {
            const error = new AppError("Course not found", 404, httpStatusText.FAIL);
            return next(error);
        }
        return res.status(200).json({status: httpStatusText.SUCCESS, data: null});
    }
    catch (error) {
        return res.status(400).json({status: httpStatusText.ERROR, data: null, message: error.message});
    }
});

module.exports = {
    getAllCourses,
    getCourseById,
    addCourse,
    updateCourse,
    deleteCourse
};