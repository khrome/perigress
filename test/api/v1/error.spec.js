const Joi = require('joi');

module.exports = function(err){
    return Joi.object().keys({
        status: 'error',
        error: Joi.object().keys({
            code: err.code,
            message: err.message
        })
    });
};
