const ks = require('kitchen-sync');
const arrays = require('async-arrays');
//const joiToJSONSchema = require('joi-to-json-schema');
const jsonToJSONSchema = require('to-json-schema');
const joiToJSONSchema = require('joi-to-json')
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
    console.log('!!', this.options);
    let prefix = this.options.path.substring(
        path.join(this.options.root, this.options.subpath).length
    );
    expressInstance[
        this.endpointOptions.method.toLowerCase()
    ]('/', function (req, res){
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
