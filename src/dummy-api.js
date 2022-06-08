const ks = require('kitchen-sync');
const arrays = require('async-arrays');
const access = require('object-accessor');
const fs = require('fs');
const path = require('path');
const hash = require('object-hash');
const { toSQL, toSQLUpdates } = require('json-schema2sql');
const sequelize = require('json-schema2sequelize');

const DummyEndpoint = require('./dummy-endpoint');

const writeInto = (ob, values)=>{
    Object.keys(values).forEach((key)=>{
        ob[key] = values[key];
    })
};


const DummyAPI = function(dir){
    this.readyResolve = null;
    this.ready = new Promise((resolve, rjct)=>{
        this.readyResolve = resolve;
    });
    this.resultSpecs = {};
    this.errorSpecs = {};
    this.configSpecs = {};
    this.endpoints = [];
    if(dir){
        this.load(dir, ()=>{

        });
    }
    setTimeout(()=>{
    }, 0);
}

const returnError = (res, error, errorConfig, config)=>{
    let response = JSON.parse(JSON.stringify(errorConfig.structure));
    access.set(response, errorConfig.code, error.code);
    access.set(response, errorConfig.message, error.message);
    res.send(JSON.stringify(response, null, '    '));
};

DummyAPI.prototype.attach = function(instance, cb){
    this.ready.then(()=>{
        try{
            let firstEndpoint = this.endpoints[0];
            this.endpoints.forEach((endpoint)=>{
                endpoint.attach(instance);
            });
            instance.get('/openapi.json', (req, res)=>{
                let org = {
                    'list': '', 
                    'display': '', 
                    'create': '', 
                    'edit': ''
                }
                let serverList = [];
                let pathReferenceDirectory = {};
                this.endpoints.forEach((endpoint)=>{
                    org = {
                        'list': endpoint.urls.list, 
                        'display': endpoint.urls.display.replace(':id', '{id}'), 
                        'create': endpoint.urls.create, 
                        'edit': endpoint.urls.edit.replace(':id', '{id}')
                    }
                    Object.keys(org).forEach((key)=>{
                        pathReferenceDirectory[org[key]] = {$ref: endpoint.basePath+'/'+key+'-schema.json'};
                    });
                    //console.log(endpoint); 
                });
                res.send(JSON.stringify({
                    openapi: '3.0.0',
                    servers: serverList,
                    paths: pathReferenceDirectory
                }));
            });
            instance.get('/spec', (req, res)=>{
                res.send(`<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta
                    name="description"
                    content="SwaggerUI"
                  />
                  <title>SwaggerUI</title>
                  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
                </head>
                <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
                <script>
                  window.onload = () => {
                    window.ui = SwaggerUIBundle({
                      url: 'http://localhost:8080/openapi.json',
                      dom_id: '#swagger-ui',
                    });
                  };
                </script>
                </body>
                </html>`);
            });
            instance.all('*', (req, res)=>{
                returnError(res, new Error('Path not found.'), firstEndpoint.errorSpec(), firstEndpoint.config())
            });
            if(cb) cb();
        }catch(ex){
            console.log('ERROR', ex);
        }
    });
};

const getLeastGeneralPathMatch = (index, path)=>{
    if(!Array.isArray(path)) return getLeastGeneralPathMatch(index, path.split('/'));
    let thisPath = path.join('/');
    if(index[thisPath]) return index[thisPath];
    if(!path.length) return null;
    //do next match
    path.pop();
    return getLeastGeneralPathMatch(index, path)
};

DummyAPI.prototype.resultSpec = function(dir){
    return getLeastGeneralPathMatch(this.resultSpecs, dir);
};

DummyAPI.prototype.generateMigrations = function(otherAPI, options, cb){
    this.ready.then(()=>{
        otherAPI.ready.then(()=>{
            if((!options.format) || options.format.toLowerCase() === 'sql'){
                let ups = [];
                let downs = [];
                arrays.forEachEmission(this.endpoints, (endpoint, index, done)=>{
                    let otherEndpoint = otherAPI.endpoints.find((e)=> e.options.name === endpoint.options.name);
                    let statements = toSQLUpdates(endpoint.options.name, endpoint.schema, otherEndpoint.schema);
                    ups = ups.concat(statements.ups);
                    downs = downs.concat(statements.downs);
                    //TODO: write definitions if output option is set
                    done();
                }, ()=>{
                    cb(null, {ups, downs: downs.reverse()});
                });
                return;
            }
            if(options.format.toLowerCase() === 'sequelize' || !options.format){
                let ups = [];
                let downs = [];
                arrays.forEachEmission(this.endpoints, (endpoint, index, done)=>{
                    let otherEndpoint = otherAPI.endpoints.find((e)=> e.options.name === endpoint.options.name);
                    let statements = sequelize.toSequelizeUpdates(endpoint.options.name, endpoint.schema, otherEndpoint.schema);
                    ups = ups.concat(statements.ups);
                    downs = downs.concat(statements.downs);
                    done();
                }, ()=>{
                    result = options.seperate?
                        {ups, downs: downs.reverse()}:
                        `module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
        ${'    '+ups.join(",\n").replace(/\n/g, "\n            ")}
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
        ${'    '+downs.reverse().join(",\n").replace(/\n/g, "\n            ")}
        ]);
    }
};`;
                    cb(null, result);
                });
                return;
            }
            setTimeout(()=>{
                cb(new Error('Unknown format: '+options.format))
            })
        });
    });
}

DummyAPI.prototype.generateDataDefinitions = function(options, cb){
    this.ready.then(()=>{
        let allStatements = [];
        let type = (options.format || 'sql').toLowerCase();
        let names = [];
        this.endpoints.forEach((endpoint)=>{
            let statements = endpoint.toDataDefinition(options, names);
            allStatements = allStatements.concat(statements);
        });
        let anEndpoint = this.endpoints[0];
        setTimeout(()=>{
            options.export = names;
            let formattedFile = anEndpoint.makeDataFileWrapper(
                options,
                allStatements
            );
            cb(null, formattedFile)
        });
    });
}

DummyAPI.prototype.errorSpec = function(dir){
    return getLeastGeneralPathMatch(this.errorSpecs, dir);
}

DummyAPI.prototype.config = function(dir){
    return getLeastGeneralPathMatch(this.configSpecs, dir);
}

DummyAPI.prototype.load = function(dir, cb){
    let directory = (dir.subpath && dir.dir)?path.join(dir.dir, dir.subpath):dir;
    let opts = (dir.subpath && dir.dir)?{
        subpath: dir.subpath,
        dir: dir.dir
    }:dir;
    const callback = ks(cb);
    this.ready = Promise.all([this.ready, new Promise((resolve)=>{
        if(this.readyResolve){ // fuse readys
            const oldResolve = this.readyResolve;
            this.readyResolve = ()=>{
                oldResolve();
                resolve();
            }
        }else this.readyResolve = resolve;
    })]);
    this.scan(directory, (err, specs, resultsIndex, errorIndex, configIndex)=>{
        if(err) return console.log(err);
        writeInto(this.resultSpecs, resultsIndex);
        writeInto(this.errorSpecs, errorIndex);
        writeInto(this.configSpecs, configIndex);
        if(!specs) throw new Error('ack '+directory);
        arrays.forEachEmission(specs, (spec, index, emit)=>{
            let parts = spec.spec.split('.');
            let name = parts.shift();
            let type = parts.join('.');
            spec.subpath = opts.subpath;
            spec.root = opts.dir;
            let endpoint = new DummyEndpoint(spec, this);
            endpoint.load(spec.path, name, type, (err)=>{
                this.endpoints.push(endpoint);
                emit();
            });
        }, ()=>{
            if(this.readyResolve){
                this.readyResolve();
                this.readyResolve = null;
            }
        });
    });

};

DummyAPI.prototype.scan = function(directory, cb, incomingSpecs, iResults, iErrors, iConfig){
    const callback = ks(cb);
    let resultSpecs = iResults || {};
    let errorSpecs = iErrors || {};
    let configSpecs = iConfig || {};
    fs.readdir(directory, (err, result)=>{
        if(err || (!result) || !result.length) return cb();
        let specs = incomingSpecs || [];
        arrays.forEachEmission(result, (item, index, done)=>{
            let itemPath = path.join(directory, item);
            fs.stat(itemPath, (err, stat)=>{
                if(stat.isDirectory()){
                    this.scan(itemPath, (err, incomingSpecs, results, errors, configs)=>{
                        let hashes = specs.map(s => hash(s));
                        /*specs = incomingSpecs.reduce((res, item)=>{
                            if(hashes.indexOf(hash(item)) !== -1) res.push(item);
                            return res;
                        }, specs);
                        writeInto(resultSpecs, results);
                        writeInto(errorSpecs, errors);
                        writeInto(configSpecs, configs);*/
                        done();
                    }, specs, resultSpecs, errorSpecs, configSpecs)
                }else{
                    let fixedPath = itemPath[0] === '/'?itemPath:path.join(process.cwd(), itemPath);
                    if(item === 'resultSet.spec.js'){
                        resultSpecs[directory] = require(fixedPath);
                        return done();
                    }
                    if(item === 'error.spec.js'){
                        errorSpecs[directory] = require(fixedPath);
                        return done();
                    }
                    if(item === 'config.js'){
                        configSpecs[directory] = require(fixedPath);
                        return done();
                    }
                    if(item.indexOf('.spec.js') !== -1){
                        specs.push({
                            spec: item,
                            path: directory,
                            type: 'joi'
                        });
                        return done();
                    }
                    if(item.indexOf('.spec.json') !== -1){
                        specs.push({
                            spec: item,
                            path: directory,
                            type: 'json'
                        });
                        return done();
                    }
                    if(item.indexOf('.spec.schema.json') !== -1){
                        specs.push({
                            spec: item,
                            path: directory,
                            type: 'json-schema'
                        });
                        return done();
                    }
                    //nothing to do`
                    done();
                }
            });
        }, ()=>{
            callback(null, specs, resultSpecs, errorSpecs, configSpecs);
        });
    });
    return callback.return;
};

module.exports = DummyAPI;
