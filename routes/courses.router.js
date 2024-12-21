const express = require("express");
const router = express.Router();
const coursesController = require("../controller/courses.controller");
// const {validationSchema} = require("../middlewares/validationSchema");
const authorizeToken = require("../middlewares/authorizeToken");
const allowedTo = require("../middlewares/allowedTo");
const userRole = require("../utils/userRoles");


router.route("/")
                .get(coursesController.getAllCourses)
                .post(authorizeToken, allowedTo(userRole.ADMIN), coursesController.addCourse);

router.route("/:id")
                .get(coursesController.getCourseById)
                .patch(authorizeToken, allowedTo(userRole.ADMIN),coursesController.updateCourse)
                .delete(authorizeToken, allowedTo(userRole.ADMIN), coursesController.deleteCourse);

module.exports = router;