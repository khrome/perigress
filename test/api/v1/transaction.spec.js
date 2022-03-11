const Joi = require('joi');

module.exports = Joi.object().keys({
    cardId: Joi.string().regex(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i).required(),
    total: Joi.string().regex(/\[0-9]+\.[0-9][0-9]/).required(),
    currency: 'USD',
    externalTransactionId: Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/).required(),
    network: Joi.string().regex(/(VISA|PAYPAL|CHASE)/i).required(),
});
