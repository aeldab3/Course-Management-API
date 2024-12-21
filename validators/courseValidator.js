const Joi = require('joi');

const categories = ['PHP', 'Java', 'UI/UX', '.NET Development', 'NodeJS'];

const courseSchema = Joi.object({
    title: Joi.string()
        .required()
        .min(5)
        .max(50)
        .messages({
            "string.min": "Title must be at least 5 characters long.",
            "string.max": "Title cannot exceed 50 characters.",
            "any.required": "Title is required.",
        }),
    description: Joi.string()
        .max(500)
        .optional()
        .messages({
            "string.max": "Description cannot exceed 500 characters.",
        }),
    category: Joi.string()
        .valid(...categories) // Restrict to predefined values
        .required()
        .messages({
            "any.only": `Category must be one of the following: ${categories.join(', ')}.`,
            "any.required": "Category is required.",
        }),
    price: Joi.number()
        .positive()
        .required()
        .precision(2)
        .messages({
            "number.positive": "Price must be a positive number.",
            "number.precision": "Price can have up to 2 decimal places.",
            "any.required": "Price is required.",
    }),
});

module.exports = courseSchema;