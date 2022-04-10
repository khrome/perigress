const ks = require('kitchen-sync');
const access = require('object-accessor');
const arrays = require('async-arrays');
const jsonToJSONSchema = require('to-json-schema');
const joiToJSONSchema = require('joi-to-json')
const jsonSchemaFaker = require('json-schema-faker');
const { makeGenerator } = require('./random');
const fs = require('fs');
const path = require('path');
const { WKR, classifyRegex, generateData } = require('well-known-regex');
const sql = require('json-schema2sql');
const sequelize = require('json-schema2sequelize');
const validate = require('jsonschema').validate;
const template = require('es6-template-strings');

const defaults = {
    error : ()=>{

    },
    results: ()=>{

    }
}

const returnError = (res, error, errorConfig, config)=>{
    let response = JSON.parse(JSON.stringify(errorConfig.structure));
    access.set(response, errorConfig.code, error.code);
    access.set(response, errorConfig.message, error.message);
    res.send(JSON.stringify(response, null, '    '));
};

const returnContent = (res, result, errorConfig, config)=>{
    res.send(JSON.stringify(result, null, '    '));
};


const DummyEndpoint = function(options, api){
    this.options = options || {};
    if(this.options.spec && !this.options.name){
        this.options.name = this.options.spec.split('.').shift();
    }
    this.instances = {};
    //this.config = api.config(this.options.path);
    this.api = api;
    //this.config = api.config();
    this.endpointOptions = {};
    this.cleanupOptions(this.endpointOptions);
}

DummyEndpoint.prototype.cleanupOptions = function(options){
    if(!options.method){
        options.method = 'ALL';
    }
}

DummyEndpoint.prototype.makeDataFileWrapper = function(opts, statements){
    let options = opts || {format:'sql'};
    let result = null;
    let config = this.config();
    // TODO: switch to a plugin loader pattern
    let exportNames = opts.export || [ this.options.name.substring(0,1).toUpperCase()+
        this.options.name.substring(1) ];
    switch((options.format||'').toLowerCase()){
        case 'sequelize':
            let include = `const { Sequelize, DataTypes, Model } = require('@sequelize/core');`;
            include += `\nconst sequelize = require('${options.sequelizePath}');\n`
            let exportText = `module.exports = ###;`
            result = include+statements.join("\n")+'';
            if(!options.seperate){
                result = result+"\n"+exportText.replace('###', `{${exportNames.join(', ')}}`)
            }
            break;
        case 'sql':
            result = statements.join(";\n")+';';
            break;
        default: throw new Error('Unknown Type: '+options.format);
    }
    return result;
}

DummyEndpoint.prototype.toDataDefinition = function(opts, names){
    let options = opts || {format:'sql'};
    let tableDefinitions = [];
    let config = this.config();
    // TODO: switch to a plugin loader pattern
    let statements = null;
    let isSerial = config.primaryKey?
        [
            'integer',
            'number'
        ].indexOf(this.schema.properties[config.primaryKey].type) !== -1:
        false;
    switch((options.format||'').toLowerCase()){
        case 'sequelize':
            let capName = this.options.name.substring(0,1).toUpperCase()+
                this.options.name.substring(1);
            if(names) names.push(capName);
            statements = sequelize.toSequelize(this.options.name, this.schema, {
                primaryKey: config.primaryKey,
                serial: isSerial
            });
            if(options.seperate){
                statements = statements.map(
                    (s)=>include+"\n"+s+"\n"+exportText.replace('###', capName)
                )
            }
            tableDefinitions = tableDefinitions.concat(statements);
            break;
        case 'sql':
            statements = sql.toSQL(this.options.name, this.schema, {
                primaryKey: config.primaryKey,
                serial: isSerial
            });
            tableDefinitions = tableDefinitions.concat(statements);
            break;
        default: throw new Error('Unknown Type: \''+options.format+'\'');
    }
    return tableDefinitions;
}

DummyEndpoint.prototype.makeMigrationFileWrapper = function(opts, statements){
    let options = opts || {format:'sql'};
    let result = null;
    let config = this.config();
    // TODO: switch to a plugin loader pattern
    let exportNames = opts.export || [ this.options.name.substring(0,1).toUpperCase()+
        this.options.name.substring(1) ];
    switch((options.format||'').toLowerCase()){
        case 'sequelize':

            break;
        case 'sql':

            break;
        default: throw new Error('Unknown Type: '+options.format);
    }
    return result;
}

DummyEndpoint.prototype.toDataMigration = function(schema, opts, names){
    let options = opts || {format:'sql'};
    let tableDefinitions = [];
    let config = this.config();
    // TODO: switch to a plugin loader pattern
    let statements = null;
    switch((options.format||'').toLowerCase()){
        case 'sequelize':

            break;
        case 'sql':

            break;
        default: throw new Error('Unknown Type: \''+options.format+'\'');
    }
    return tableDefinitions;
}

DummyEndpoint.prototype.cleanedSchema = function(s){
    let schema = s;
    if(schema.type === 'object' && schema['$_root']){ //this is a joi def
        schema = joiToJSONSchema(schema);
    }
    let copy = JSON.parse(JSON.stringify(schema));
    (Object.keys(copy.properties)).forEach((key)=>{
        if(copy.properties[key] && copy.properties[key].pattern){
            copy.properties[key].pattern = copy.properties[key].pattern.replace(/\?<[A-Za-z][A-Za-z0-9]*>/g, '')
        }
        if(!copy.properties[key]){
            process.exit();
        }
        //TODO: object, array support
    });
    return copy;
}

DummyEndpoint.prototype.formatItems = function(opts, items){
    let options = opts || {format:'sql'};
    let result = null;
    let config = this.config();
    // TODO: switch to a plugin loader pattern
    let exportNames = opts.export || [ this.options.name.substring(0,1).toUpperCase()+
        this.options.name.substring(1) ];
    switch((options.format||'').toLowerCase()){
        case 'sequelize':
            result = sequelize.toSequelizeInsert(this.options.name, items, {});
            break;
        case 'sql':
            result = sql.toSQLInsert(this.options.name, items, {});
            break;
        default: throw new Error('Unknown Type: '+options.format);
    }
    return result;
}

DummyEndpoint.prototype.generate = function(id, o, c){
    let cb = typeof o === 'function'?o:(typeof c === 'function'?c:()=>{});
    let options = typeof o === 'object'?o:{};
    let gen = makeGenerator(id+'');
    jsonSchemaFaker.option('random', () => gen.randomInt(0, 1000)/1000);
    // JSF's underlying randexp barfs on named capture groups, which we care about
    let cleaned = this.cleanedSchema(this.schema);
    let config = this.config();
    //TODO: make default come from datasource
    let primaryKey = config.primaryKey || 'id';
    jsonSchemaFaker.resolve(cleaned, [], process.cwd()).then((value)=>{
        if(this.schema.properties[primaryKey] && value[primaryKey]){
            switch(this.schema.properties[primaryKey].type){
                case 'integer':
                    value[primaryKey] = parseInt(id);
                    break
                case 'string':
                    value[primaryKey] = id;
                    break;
                default : throw new Error(
                    'Cannot create a primary key with type:'+
                        this.schema.properties[primaryKey].type
                )
            }
        }
        let generated;
        try{
            generated = generateData(this.schema, {
                locale: 'en_us',
                seed: id
            });
        }catch(ex){
            console.log(ex);
        }
        Object.keys(generated).forEach((key)=>{
            value[key] = generated[key];
        });
        cb(null, value);
    }).catch((ex)=>{
        console.log(ex);
    });
}

const handleListPage = (ob, pageNumber, req, res, urlPath, instances)=>{
    let seeds = [];
    let gen = makeGenerator('3c38adefd2f5bf4');
    let idGen = null;
    let config = ob.config();
    let errorConfig = ob.errorSpec();
    //TODO: make default come from datasource
    let primaryKey = config.primaryKey || 'id';
    if(ob.schema.properties[primaryKey].type === 'string'){
        idGen = ()=>{
            let value = gen.randomString(30);
            return value;
        }
    }
    if(
        ob.schema.properties[primaryKey].type === 'number' ||
        ob.schema.properties[primaryKey].type === 'integer'
    ){
        idGen = ()=>{
            return gen.randomInt(0, 10000);
        }
    }
    let length = 30 * gen.randomInt(1, 3) + gen.randomInt(0, 30);
    for(let lcv=0; lcv < length; lcv++){
        seeds.push(idGen());
    }
    let items = [];
    jsonSchemaFaker.option('random', () => gen.randomInt(0, 1000)/1000);
    let resultSpec = ob.resultSpec();
    let cleaned = ob.cleanedSchema(resultSpec.returnSpec);
    jsonSchemaFaker.resolve(cleaned, [], process.cwd()).then((returnValue)=>{
        if(config.total){
            access.set(returnValue, config.total, seeds.length);
        }
        if(config.page){
            let size = config.defaultSize || 30;
            let pageFrom0 = pageNumber - 1;
            let offset = pageFrom0 * size;
            let count = Math.ceil(seeds.length/size);
            if(config.page.size){
                access.set(returnValue, config.page.size, size);
            }
            if(config.page.count){
                access.set(returnValue, config.page.count, count);
            }
            if(config.page.next && pageNumber < count){
                access.set(returnValue, config.page.next, urlPath+'/list/'+(pageNumber+1));
            }
            if(config.page.previous && pageNumber > 1){
                access.set(returnValue, config.page.previous, urlPath+'/list/'+(pageNumber-1));
            }
            if(config.page.number){
                access.set(returnValue, config.page.number, pageNumber);
            }
            seeds = seeds.slice(offset, offset+size);
        }
        arrays.forEachEmission(seeds, (seed, index, done)=>{
            if(instances[seed]){
                items[index] = instances[seed];
                done();
            }else{
                ob.generate(seed, (err, generated)=>{
                    generated[primaryKey] = seed;
                    items[index] = generated;
                    done();
                });
            }
        }, ()=>{
            access.set(returnValue, resultSpec.resultSetLocation, items);
            returnContent(res, returnValue, errorConfig, config);
        });
    }).catch((ex)=>{
        console.log(ex);
        returnError(res, ex, errorConfig, config)
    });
};

DummyEndpoint.prototype.attach = function(expressInstance){
    let prefix = this.options.path.substring(
        path.join(this.options.root, this.options.subpath).length
    );
    let urlPath = prefix+'/'+this.options.spec.split('.').shift();
    let ob = this;
    let config = this.config();
    let errorConfig = this.errorSpec();
    let primaryKey = config.primaryKey || 'id';

    getInstance = (ob, key, cb)=>{
        if(this.instances[key]){
            cb(null, this.instances[key]);
        }else{
            this.generate(key, cb);
        }
    }

    let pathOptions = {
        basePath : urlPath,
        primaryKey : primaryKey
    }

    let urls = {
        list : template(
            (
                (config.paths && config.paths.list) ||
                '${basePath}/list'
            ),
            pathOptions
        ),
        listPage : template(
            (
                (config.paths && config.paths.listPage) ||
                '${basePath}/list/:pageNumber'
            ),
            pathOptions
        ),
        create : template(
            (
                (config.paths && config.paths.create) ||
                '${basePath}/create'
            ),
            pathOptions
        ),
        edit : template(
            (
                (config.paths && config.paths.edit) ||
                '${basePath}/:${primaryKey}/edit'
            ),
            pathOptions
        ),
        display : template(
            (
                (config.paths && config.paths.display) ||
                '${basePath}/:${primaryKey}'
            ),
            pathOptions
        )
    }


    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](urls.list, (req, res)=>{
        handleListPage(this, 1, req, res, urlPath, this.instances);
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](urls.listPage, (req, res)=>{
        handleListPage(this, parseInt(req.params.pageNumber), req, res, urlPath);
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](urls.create, (req, res)=>{
        if(validate(req.body, this.originalSchema)){
            this.instances[req.body[primaryKey]] = req.body;
            returnContent(res, {success:true}, errorConfig, config);
        }else{
            res.send('fail')
        }
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](urls.edit, (req, res)=>{
        getInstance(this, req.params[primaryKey], (err, item)=>{
            if(req.body && typeof req.body === 'object'){
                Object.keys(req.body).forEach((key)=>{
                    item[key] = req.body[key];
                });
                //item is now the set of values to save
                if(validate(item, this.originalSchema)){
                    this.instances[req.params[primaryKey]] = item;
                    returnContent(res, {success:true}, errorConfig, config);
                }else{
                    //fail
                    console.log('**')
                }
            }else{
                //fail
                console.log('*', req.body)
            }
        })
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](urls.display, (req, res)=>{
        let config = this.config();
        let primaryKey = config.primaryKey || 'id';
        if(this.instances[req.params[primaryKey]]){
            res.send(JSON.stringify(this.instances[req.params[primaryKey]], null, '    '))
        }else{
            this.generate(req.params[primaryKey], (err, generated)=>{
                res.send(JSON.stringify(generated, null, '    '))
            });
        }
    });
}

DummyEndpoint.prototype.config = function(){
    return this.api.config(this.options.path);
}

DummyEndpoint.prototype.errorSpec = function(){
    return this.api.errorSpec(this.options.path);
}

DummyEndpoint.prototype.resultSpec = function(){
    return this.api.resultSpec(this.options.path);
}

DummyEndpoint.prototype.loadSchema = function(filePath, extension, callback){
    let fixedPath = filePath[0] === '/'?filePath:path.join(process.cwd(), filePath);
    switch(extension){
        case 'spec.js':
            try{
                schema = require(fixedPath);
                schema = joiToJSONSchema(schema);
                setTimeout(()=>{
                    callback(null, schema);
                });
            }catch(ex){
                callback(ex);
            }
            break;
        case 'spec.json':
            fs.readFile(fixedPath, (err, body)=>{
                try{
                    schema = JSON.parse(body);
                    schema = jsonToJSONSchema(schema);
                    callback(null, schema);
                }catch(ex){
                    callback(ex);
                }
            });
            break;
        case 'spec.schema.json':
            fs.readFile(fixedPath, (err, body)=>{
                try{
                    schema = JSON.parse(body);
                    schema = jsonToJSONSchema(schema);
                    callback(null, schema);
                }catch(ex){
                    callback(ex);
                }
            });
            break;
        default : throw new Error('Unrecognized extension: '+extension);
    }
}

DummyEndpoint.prototype.load = function(dir, name, extension, cb){
    const callback = ks(cb);
    const filePath = path.join(dir, `${name}.${extension}`);
    const requestPath = filePath.replace('.spec.', '.request.');
    const optionsPath = path.join(dir, `${name}.options.json`);
    fs.readdir(dir, (err, list)=>{
        let exampleFiles = list.filter(listname =>{
            return (listname.indexOf(`.${name}.example.json`) !== -1) ||
                (listname.indexOf(`.${name}.input.json`) !== -1);
        });
        let matched = null;
        if(exampleFiles.length){
            let examples = exampleFiles.filter(listname => listname.indexOf(`.${name}.example.json`) !== -1);
            let inputs = exampleFiles.filter(listname => listname.indexOf(`.${name}.input.json`) !== -1);
            matched = examples.map((i)=>{ return {
                output: i,
                input: (
                    inputs.filter(
                        item =>  item.indexOf(`${i.split('.').shift()}.${name}.input.json`) === 0
                    )[0]
                )
            }});
            //now load
            matched = matched.map((item)=>{
                let res = {};
                if(item.input) res.input = require(path.join(dir, item.input));
                if(item.output) res.output = require(path.join(dir, item.output));
                return res;
            });
        }
        this.loadSchema(filePath, extension, (err, schema)=>{
            if(err) return callback(err);
            this.schema = schema;
            this.originalSchema = JSON.parse(JSON.stringify(schema));
            let config = this.config();
            let primaryKey = config.primaryKey || 'id';
            if(matched){
                matched.forEach((item)=>{
                    if(item.output && item.output[primaryKey]){
                        this.instances[item.output[primaryKey]] = item.output;
                    }
                });
                //TODO: handle inputs
            }
            if(config && config.auditColumns && config.auditColumns['$_root']){
                config.auditColumns = joiToJSONSchema(config.auditColumns);
            }
            if(config.auditColumns && config.auditColumns.properties){
                Object.keys(config.auditColumns.properties).forEach((key)=>{
                    this.schema.properties[key] = config.auditColumns.properties[key];
                });
            }
            if(config.auditColumns && config.auditColumns.required){
                config.auditColumns.required.forEach((key)=>{
                    this.schema.required.push(key);
                });
            }
            this.loadSchema(requestPath, extension, (err, requestSchema)=>{
                if(!err){
                    this.requestSchema = requestSchema;
                }
                fs.readFile(optionsPath, (err, body)=>{
                    if(err) return callback(err);
                    try{
                        this.endpointOptions = JSON.parse(body);
                        this.cleanupOptions(this.endpointOptions);
                    }catch(ex){
                        callback(ex);
                    }
                });
            });
        });
    });
    return callback.return;
}


module.exports = DummyEndpoint;
