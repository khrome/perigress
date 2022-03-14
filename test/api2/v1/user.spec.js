const Joi = require('joi');

module.exports = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    something: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/).required()
});
