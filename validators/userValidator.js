const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string()
        .alphanum() // Ensures only alphanumeric characters
        .min(3) // Minimum 3 characters long
        .required()
        .messages({
            "string.alphanum": "Name must contain only alphanumeric characters.",
            "string.min": "Name must be at least 3 characters long.",
            "any.required": "Username is required.",
        }),
    email: Joi.string()
        .email() // Validates email format
        .required()
        .messages({
            "string.email": "Please provide a valid email address.",
            "any.required": "Email is required.",
        }),
    password: Joi.string()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) // Password validation regex
        .required()
        .messages({
            "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 8 characters long.",
            "any.required": "Password is required.",
        }),
    role: Joi.string()
        .valid("manager", "admin", "student") // Restrict to specific values
        .default("student") // Default value
        .messages({
            "any.only": "Role must be either 'manager', 'admin' or 'student'.",
        }),
});

module.exports = userSchema;