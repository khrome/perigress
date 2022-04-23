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
    foreignKey : (id, getTables)=>{
        let suffix = id.substring(id.length-2);
        if(suffix === 'Id'){
            let tableString = id.substring(id.length-2);
            let parts = getTables(tableString);
            let result = {
                suffix,
                raw: id
            };
            if(parts.to) result.to = parts.to;
            if(parts.from) result.from = parts.from;
            return result;
        }else return null;
    },
    auditColumns : Joi.object().keys({
        id: Joi.number().integer().required(),
        isDeleted: Joi.boolean(),
        updatedBy: Joi.number().integer().required(),
        updatedOn: Joi.date().iso(),
        modifiedBy: Joi.number().integer().required(),
        modifiedOn: Joi.date().iso()
    })
}
