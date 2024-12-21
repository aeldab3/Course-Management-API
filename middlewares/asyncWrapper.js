/* The asyncWrapper() function (higher-order function):
Accepts an async controller function (asyncFn) as an argument.
Wraps it in a function that automatically catches errors.
Passes those errors to Express's error-handling middleware via next(). */

module.exports = (asyncFn) => {
    return (req, res, next) => {
        asyncFn(req, res, next).catch((err) => {
            next(err);
        });
    }
};