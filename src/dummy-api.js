const ks = require('kitchen-sync');
const arrays = require('async-arrays');
const fs = require('fs');
const path = require('path');

const DummyEndpoint = require('./dummy-endpoint');


const DummyAPI = function(dir){
    this.readyResolve = null;
    this.ready = new Promise((resolve, rjct)=>{
        this.readyResolve = resolve;
    });
    this.resultSpecs = {};
    this.errorSpecs = {};
    this.endpoints = [];
    if(dir){
        this.load(dir, ()=>{

        });
    }
    setTimeout(()=>{
    }, 0);
}

DummyAPI.prototype.attach = function(instance){
    this.endpoints.forEach((endpoint)=>{
        endpoint.attach(instance);
    });
}

const getLeastGeneralPathMatch = (index, path)=>{
    if(!Array.isArray(path)) return getLeastGeneralPathMatch(index, path.split('/'));
    let thisPath = path.join('/');
    if(index[thisPath]) return index[thisPath];
    if(!path.length) return null;
    path.pop();
    return getLeastGeneralPathMatch(path)
}

DummyAPI.prototype.resultSpec = function(dir){
    return getLeastGeneralPathMatch(this.resultSpecs, dir);
}

DummyAPI.prototype.errorSpec = function(instance){
    return getLeastGeneralPathMatch(this.errorSpecs, dir);
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
    this.scan(directory, (err, specs, resultsIndex, errorIndex)=>{
        this.resultSpecs = resultsIndex;
        this.errorSpecs = errorIndex;
        if(!specs) throw new Error('ack '+directory)
        arrays.forEachEmission(specs, (spec, index, emit)=>{
            let parts = spec.spec.split('.');
            let name = parts.shift();
            let type = parts.join('.');
            spec.subpath = opts.subpath;
            spec.root = opts.dir;
            let endpoint = new DummyEndpoint(spec);
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

DummyAPI.prototype.scan = function(directory, cb, incomingSpecs){
    const callback = ks(cb);
    fs.readdir(directory, (err, result)=>{
        if(err || (!result) || !result.length) return cb();
        let resultSpecs = {};
        let errorSpecs = {};
        let specs = incomingSpecs || [];
        arrays.forEachEmission(result, (item, index, done)=>{
            let itemPath = path.join(directory, item);
            fs.stat(itemPath, (err, stat)=>{
                if(stat.isDirectory()){
                    this.scan(itemPath, ()=>{
                        done();
                    }, specs)
                }else{
                    if(item === 'resultSet.spec.js'){
                        resultSpecs[directory] = require(itemPath);
                        return done();
                    }
                    if(item === 'error.spec.js'){
                        errorSpecs[directory] = require(itemPath);
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
            callback(null, specs, resultSpecs, errorSpecs);
        });
    });
    return callback.return;
};

module.exports = DummyAPI;
