const Joi = require('joi');
const { validator } = require('../../../perigress');
module.exports = Joi.object().keys({
    id: Joi.number().integer(),
    transactionId: Joi.number().integer().required(),
    userId: Joi.number().integer().required()
});
