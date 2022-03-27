const Joi = require('joi');

module.exports = {
    primaryKey: 'id',
    page: {
        count: 'page.count',
        number: 'page.number',
        next: 'page.next',
        previous: 'page.previous',
        size: 'page.size',
        defaultSize: 30
    },
    total : 'total',
    auditColumns : Joi.object().keys({
        id: Joi.number().integer().required(),
        isDeleted: Joi.boolean(),
        updatedBy: Joi.number().integer().required(),
        updatedOn: Joi.date().iso(),
        modifiedBy: Joi.number().integer().required(),
        modifiedOn: Joi.date().iso()
    })
}
