const Joi = require('joi');
module.exports = function(resultSpec){
    return Joi.object().keys({
        status: Joi.string().regex(/[Ss][Uu][Cc][Cc][Ee][Ss][Ss]/).required(),
        results: Joi.array().items(resultSpec)
    });
};;
