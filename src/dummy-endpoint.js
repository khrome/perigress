const ks = require('kitchen-sync');
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
    if(!this.options.primaryKey) this.options.primaryKey = 'id';
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

DummyEndpoint.prototype.generate = function(id, cb){
    let gen = makeGenerator(id);
    jsonSchemaFaker.option('random', () => gen.randomInt(0, 1000)/1000);
    jsonSchemaFaker.resolve(this.schema, [], process.cwd()).then((value)=>{
        if(value.id) value.id = id;
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

    });
}

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
        let seeds = [];
        let gen = makeGenerator('3c38adefd2f5bf4');
        let idGen = null;
        if(this.schema.properties[this.options.primaryKey].type === 'string'){
            idGen = ()=>{
                let value = gen.randomString(30);
                return value;
            }
        }
        if(this.schema.properties[this.options.primaryKey].type === 'number'){
            idGen = ()=>{
                return gen.randomInt(0, 10000);
            }
        }
        let length = 30 * gen.randomInt(1, 3) + gen.randomInt(0, 30);
        for(let lcv=0; lcv < length; lcv++){
            seeds.push(idGen());
        }
        let items = [];
        arrays.forEachEmission(seeds, (seed, index, done)=>{
            this.generate(seed, (err, generated)=>{
                generated[this.options.primaryKey] = seed;
                items[index] = generated;
                done();
            });
        }, ()=>{
            res.send(JSON.stringify(items, null, '    '))
        });
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
        // TODO: consistency
        // TODO: coherence
        this.generate(req.params.id, (err, generated)=>{
            res.send(JSON.stringify(generated, null, '    '))
        });
    });
}

DummyEndpoint.prototype.config = function(){
    this.api.config(this.options.path);
}

DummyEndpoint.prototype.config = function(){
    this.api.errorSpec(this.options.path);
}

DummyEndpoint.prototype.config = function(){
    this.api.resultSpec(this.options.path);
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
