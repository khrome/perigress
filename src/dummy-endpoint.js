const ks = require('kitchen-sync');
const arrays = require('async-arrays');
//const joiToJSONSchema = require('joi-to-json-schema');
const jsonToJSONSchema = require('to-json-schema');
const joiToJSONSchema = require('joi-to-json')
const jsonSchemaFaker = require('json-schema-faker');
const { makeGenerator } = require('./random');
const fs = require('fs');
const path = require('path');

const defaults = {
    error : ()=>{

    },
    results: ()=>{

    }
}


const DummyEndpoint = function(options){
    this.options = options || {};
    this.endpointOptions = {};
    this.cleanupOptions(this.endpointOptions);
}

DummyEndpoint.prototype.cleanupOptions = function(options){
    if(!options.method){
        options.method = 'ALL';
    }
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
    ](`${urlPath}/:id`, function (req, res){
        // TODO: consistency
        // TODO: coherence
        let gen = makeGenerator(req.params.id);
        jsonSchemaFaker.option('random', () => gen.randomInt(0, 1000)/1000);
        jsonSchemaFaker.resolve(ob.schema, [], process.cwd()).then((value)=>{
            if(value.id) value.id = req.params.id;
            res.send(JSON.stringify(value, null, '    '))
        }).catch((ex)=>{

        });
    });
    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/:id/edit`, function (req, res){
        res.send('hello world')
    });
    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/list`, function (req, res){
        res.send('hello world')
    });

    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ](`${urlPath}/create`, function (req, res){
        res.send('hello world')
    });
}

DummyEndpoint.prototype.loadSchema = function(filePath, extension, callback){
    switch(extension){
        case 'spec.js':
            schema = require(filePath);
            schema = joiToJSONSchema(schema);
            setTimeout(()=>{
                callback(null, schema);
            });
            break;
        case 'spec.json':
            fs.readFile(filePath, (err, body)=>{
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
            fs.readFile(filePath, (err, body)=>{
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
