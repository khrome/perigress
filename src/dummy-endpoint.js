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

const defaults = {
    error : ()=>{

    },
    results: ()=>{

    }
}


const DummyEndpoint = function(options, api){
    this.options = options || {};
    if(this.options.spec && !this.options.name){
        this.options.name = this.options.spec.split('.').shift();
    }
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

DummyEndpoint.prototype.generate = function(id, cb){
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
                default : throw new Error('Cannot create a primary key with type:'+this.schema.properties[primaryKey].type)
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

const handleListPage = (ob, pageNumber, req, res, urlPath)=>{
    let seeds = [];
    let gen = makeGenerator('3c38adefd2f5bf4');
    let idGen = null;
    let config = ob.config();
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
            ob.generate(seed, (err, generated)=>{
                generated[primaryKey] = seed;
                items[index] = generated;
                done();
            });
        }, ()=>{
            access.set(returnValue, resultSpec.resultSetLocation, items);
            res.send(JSON.stringify(returnValue, null, '    '))
        });
    }).catch((ex)=>{

    });
};

DummyEndpoint.prototype.attach = function(expressInstance){
    let prefix = this.options.path.substring(
        path.join(this.options.root, this.options.subpath).length
    );
    let urlPath = prefix+'/'+this.options.spec.split('.').shift();
    // TODO: make saving work
    let instances = {};
    let ob = this;

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/list`, (req, res)=>{
        handleListPage(this, 1, req, res, urlPath);
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/list/:pageNumber`, (req, res)=>{
        handleListPage(this, parseInt(req.params.pageNumber), req, res, urlPath);
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/create`, (req, res)=>{
        res.send('hello world')
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/:id/edit`, (req, res)=>{
        res.send('hello world')
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/:id`, (req, res)=>{
        let config = this.config();
        let primaryKey = config.primaryKey || 'id';
        this.generate(req.params[primaryKey], (err, generated)=>{
            res.send(JSON.stringify(generated, null, '    '))
        });
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
            schema = require(fixedPath);
            schema = joiToJSONSchema(schema);
            setTimeout(()=>{
                callback(null, schema);
            });
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
    this.loadSchema(filePath, extension, (err, schema)=>{
        if(err) return callback(err);
        this.schema = schema;
        this.loadSchema(filePath, extension, (err, requestSchema)=>{
            if(err) return callback(err);
            this.requestSchema = requestSchema;
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
    return callback.return;
}


module.exports = DummyEndpoint;
