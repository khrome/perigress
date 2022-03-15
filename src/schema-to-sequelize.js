const hash = require('object-hash');

const sequelizeType = (jsonType, pattern, opts)=>{
    switch(jsonType){
        case 'string': return 'STRING';
        case 'number': return 'FLOAT(24)';
        //case 'object': return 'varchar(255)'; //currently unsupported
        case 'integer': return 'INTEGER';
        //case 'array': return 'varchar(255)'; //currently unsupported
        case 'boolean': return 'BOOLEAN';
        default: throw new Error('Unknown type: '+jsonType);
    }
}


const fieldSequelize = (f)=>{
    let field = f || {};
    return `{
type: DataTypes.${field.sequelizeType},${
(field.serial && "\n    "+'autoIncrement: true,') || ''
}${
(field.primaryKey && "\n    "+'primaryKey: true,') || ''
}
allowNull : ${field.canBeNull?'true':'false'}
}`;
}

const sequelizeAddUpdate = (table, f)=>{
    let field = f || {};
    return {
        up: `queryInterface.addColumn( '${table}', '${field.name}', ${
            fieldSequelize(field).replace(/\n/g, "\n    ").replace('    }', '}')
        })`,
        down: `queryInterface.removeColumn( '${table}', '${field.name}')`
    }
}

const sequelizeDeleteUpdate = (table, f)=>{
    let field = f || {};
    let inverted = sequelizeAddUpdate(table, field);
    return {
        up : inverted.down,
        down: inverted.up
    }
}

const util = {
    toSequelizeParts : (name, schema, opts)=>{
        return {
            name: name,
            fields : Object.keys(schema.properties).map((property)=>{
                return {
                    name : property,
                    sequelizeType : sequelizeType(
                        schema.properties[property].type,
                        schema.properties[property].pattern,
                        opts
                    ),
                    jsonType : schema.properties[property].type,
                    canBeNull : schema.required.indexOf(property)==-1
                };
            })
        };
    },
    toSequelize : (name, schema, opts)=>{
        let options = opts || {};
        let table = util.toSequelizeParts(name, schema, opts);
        let capName = name.substring(0,1).toUpperCase()+name.substring(1);
        let model = table.fields.reduce((agg, field)=>{
            agg.push(`${field.name}: {
    type: DataTypes.${field.sequelizeType},${
        (field.serial && "\n    "+'autoIncrement: true,') || ''
    }${
        (field.serial && "\n    "+'autoIncrement: true,') || ''
    }
    allowNull : ${field.canBeNull?'true':'false'}
}`);
            return agg;
        }, []).join("\n").replace(/\n/g, "\n    ");
        let classDef = null;
        if(!options.define){
            classDef = `class ${capName} extends Model {}
${capName}.init({
    ${model}
}, {
    sequelize,
    modelName: '${name}'
});
`;
        }else{
            classDef = `const ${capName} = sequelize.define(${name}, ${model}, {});`;
        }
        return [classDef];
    },
    toSequelizeUpdates : (name, schemaNew, schemaOld, opts)=>{
        let newTable = util.toSequelizeParts(name, schemaNew, opts);
        let oldTable = util.toSequelizeParts(name, schemaOld, opts);
        let ups = [];
        let downs = [];
        newTable.fields.forEach((newField)=>{
            let found = false;
            let newHash = hash(newField);
            oldTable.fields.forEach((oldField)=>{
                let oldHash = hash(oldField);
                if(newHash === oldHash){
                    found = true;
                }
            });
            if(!found){
                let update = sequelizeAddUpdate(name, newField);
                ups.push(update.up);
                downs.push(update.down)
            }
        });
        oldTable.fields.forEach((oldField)=>{
            let found = false;
            let oldHash = hash(oldField);
            newTable.fields.forEach((newField)=>{
                let newHash = hash(newField);
                if(newHash === oldHash){
                    found = true;
                }
            });
            if(!found){
                let update = sequelizeDeleteUpdate(name, oldField);
                ups.push(update.up);
                downs.push(update.down)
            }
        });
        return {
            ups, downs
        }
    }
}

module.exports = util;
