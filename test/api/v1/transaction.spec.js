const Joi = require('joi');

module.exports = Joi.object().keys({
    id: Joi.string().regex(/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89AB][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$/).required(),
    cardId: Joi.string().regex(/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89AB][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$/).required(),
    total: Joi.string().regex(/[1-9]+[0-9]*\.[0-9][0-9]/).required(),
    currency: Joi.string().regex(/(USD)/).required(),
    externalTransactionId: Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/).required(),
    network: Joi.string().regex(/(VISA|PAYPAL|CHASE)/).required(),
});
