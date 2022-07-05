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
    foreignKeyJoin : (...parts)=>{
        return parts.join('_');
    },
    foreignKey : (id, getTables)=>{
        let parts = id.split('_');
        let suffix = parts.pop();
        if(suffix === 'id'){
            let tableString = parts.pop();
            let tables = getTables(tableString);
            let result = {
                suffix,
                type: tableString,
                raw: id
            };
            if(tables.to) result.to = tables.to;
            if(tables.from) result.from = tables.from;
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
