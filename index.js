// Assignment for 14/12/2024

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");  
const errorHandler = require("./middlewares/errorHandler");
const httpStatusText = require("./utils/httpStatusText");
const path = require("path");

require('dotenv').config();
const url = process.env.DATABASE_URL;

mongoose.connect(url).then(() => {
    console.log("Mongo DB Start");
})

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const coursesRouter = require("./routes/courses.router");
const usersRouter = require("./routes/users.route");

app.use("/api/courses", coursesRouter);
app.use("/api/users", usersRouter);


//When route not found
app.use('*', (req, res, next) => {
    return res.status(404).json({status: httpStatusText.ERROR, data: null, message: "This route is not found"});
});

app.use(errorHandler);

app.listen(process.env.PORT || 4000, () => {
    console.log('Server running');
})