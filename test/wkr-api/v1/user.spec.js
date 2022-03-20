const Joi = require('joi');
const { validator } = require('../../../perigress');
module.exports = Joi.object().keys({
    id: Joi.number().integer().required(),
    firstName: Joi.string().regex(validator('name', 'firstName')).required(),
    lastName: Joi.string().regex(validator('name', 'lastName')).required(),
    email: Joi.string().email().regex(validator('internet', 'email')).required(),
    phone: Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/).required(),
    birthday: Joi.date().max('1-1-2004').iso()
});
