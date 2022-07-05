const Joi = require('joi');
const { validator } = require('../../../perigress');
module.exports = Joi.object().keys({
    id: Joi.number().integer(),
    transaction_id: Joi.number().integer().required(),
    user_id: Joi.number().integer().required()
});
