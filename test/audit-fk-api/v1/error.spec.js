const Joi = require('joi');

module.exports = {
    structure: {
        status: 'error',
        error: {}
    },
    code : 'error.code',
    message : 'error.message',
    validator: function(err){
        return Joi.object().keys({
            status: 'error',
            error: Joi.object().keys({
                code: err.code,
                message: err.message
            })
        });
    }
};
