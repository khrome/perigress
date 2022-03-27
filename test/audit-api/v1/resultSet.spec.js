const Joi = require('joi');
module.exports = {
    returnSpec: Joi.object().keys({
        status: Joi.string().regex(/[Ss][Uu][Cc][Cc][Ee][Ss][Ss]/).required(),
        results: Joi.array()
    }),
    resultSetLocation: 'results'
};
