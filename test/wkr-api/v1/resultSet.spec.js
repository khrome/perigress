const Joi = require('joi');
module.exports = function(resultSpec){
    return Joi.object().keys({
        status: 'success',
        results: Joi.array().items(resultSpec)
    });
};;
