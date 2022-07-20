const should = require('chai').should();
const Perigress = require('../perigress');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('postman-request');

const port = 8080;

describe('perigress', ()=>{
    describe('Works with a simple API', ()=>{
        it('loads the demo API', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'api',
                dir: __dirname
            });
            api.ready.then(()=>{
                done();
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

        it('runs the demo API and requests a consistent object', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    let url = `http://localhost:${port}/v1/transaction/F74bf5aF-aB23-4FCa-BfC5-ebA5480FDf64`
                    request({
                        url,
                        method: 'POST'
                    }, (err, res, body)=>{
                        request({
                            url: `http://localhost:${port}/v1/transaction/10`,
                            method: 'POST'
                        }, (err2, res2, body2)=>{
                        should.not.exist(err);
                        try{
                            let transaction = JSON.parse(body);
                            let joiSchema = require(path.join(
                                __dirname, 'api', 'v1', 'transaction.spec.js'
                            ));
                            let valid = joiSchema.validate(transaction);
                            valid.value.id.should.equal('F74bf5aF-aB23-4FCa-BfC5-ebA5480FDf64');
                            valid.value.cardId.should.equal('814Ad8D5-F14e-4F20-9862-8fF01Cd40567');
                            valid.value.total.should.equal('5729438717.91');
                            valid.value.currency.should.equal('USD');
                            valid.value.externalTransactionId.should.equal('873-347-8319');
                            valid.value.network.should.equal('VISA');
                            (!!valid).should.equal(true);
                            should.not.exist(valid.error);
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex, body, body2, url, api.endpoints);
                            should.not.exist(ex);
                        }
                        });
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

    });

    describe('works using well-known-regex overlay', ()=>{

        it('runs the demo API and requests a consistent object', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'wkr-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/user/1`,
                        method: 'POST'
                    }, (err, res, body)=>{
                        should.not.exist(err);
                        try{
                            let user = JSON.parse(body);
                            let joiSchema = require(path.join(
                                __dirname, 'wkr-api', 'v1', 'user.spec.js'
                            ));
                            let valid = joiSchema.validate(user);
                            (!!valid).should.equal(true);
                            user.id.should.equal(1);
                            user.firstName.should.equal('Sim');
                            user.lastName.should.equal('Ruecker');
                            user.email.should.equal('Jared_Franey19@gmail.com');
                            user.phone.should.equal('520-674-9557');
                            try{
                                should.exist(user.birthday);
                                let date = new Date(user.birthday);
                                date.getFullYear().should.equal(1975);
                            }catch(ex){ should.not.exist(ex) }
                            should.not.exist(valid.error);
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

    });

    describe('works using a paging API', ()=>{

        it('runs the demo API and requests a consistent object', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'paged-wkr-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST'
                    }, (err, res, body)=>{
                        should.not.exist(err);
                        try{
                            let result = JSON.parse(body);
                            let joiSchema = require(path.join(
                                __dirname, 'paged-wkr-api', 'v1', 'user.spec.js'
                            ));
                            should.exist(result);
                            should.exist(result.status);
                            result.status.toLowerCase().should.equal('success');
                            should.exist(result.results);
                            Array.isArray(result.results).should.equal(true);
                            should.exist(result.results[0]);
                            should.exist(result.results[0].id);
                            should.exist(result.results[0].firstName);
                            should.exist(result.results[0].lastName);
                            should.exist(result.results[0].email);
                            should.exist(result.results[0].phone);
                            should.exist(result.results[0].birthday);
                            result.results.forEach((res)=>{
                                let valid = joiSchema.validate(res);
                                (!!valid).should.equal(true);
                                should.not.exist(valid.error);
                            });
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

        it('saves changes', (done)=>{
            const app = express();
            app.use(bodyParser.json({strict: false}))
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.attach(app, ()=>{
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST',
                        json: true
                    }, (err, res, body)=>{
                        should.not.exist(err);
                        item = body.results[0];
                        item.firstName = 'Bob';
                        request({
                            url: `http://localhost:${port}/v1/user/${item.id}/edit`,
                            method: 'POST',
                            json : item
                        }, (err, res, body)=>{
                            should.not.exist(err);
                            request({
                                url: `http://localhost:${port}/v1/user/${item.id}`,
                                method: 'POST',
                                json: true
                            }, (err, res, body)=>{
                                should.not.exist(err);
                                body.firstName.should.equal('Bob');
                                request({
                                    url: `http://localhost:${port}/v1/user/list`,
                                    method: 'POST',
                                    json: true
                                }, (err, res, body)=>{
                                    should.not.exist(err);
                                    body.results[0].firstName.should.equal('Bob');
                                    server.close(()=>{
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

    });
    
    describe('works using a paging API with audit columns and custom FK (underscore) handling', ()=>{
        it('loads and fetches generated objects through links', function(done){
            this.timeout(20000);
            const app = express();
            app.use(bodyParser.json({strict: false}))
            const api = new Perigress.DummyAPI({
                subpath : 'audit-fk-api',
                dir: __dirname
            });
            let joiSchema = require(path.join(
                __dirname, 'audit-fk-api', 'v1', 'user.spec.js'
            ));
            api.ready.then(()=>{
                // fetch a deep 
                api.attach(app);
                const server = app.listen(port, (err)=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST',
                        json: {
                            query: {},
                            link: ['user+transaction']
                        }
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            should.exist(result.results);
                            should.exist(result.results[0]);
                            should.exist(result.results[0].transaction_list);
                            result.results[0].transaction_list.length.should.be.above(0);
                            let item = result.results[0].transaction_list[0];
                            //item.card_id.should.equal( 'ACBF68d9-4AEA-4dd5-Aa3B-AE5F1cb7b8ad');
                            item.card_id = 'SOMETHING_ELSE';
                            request({
                                url: `http://localhost:${port}/v1/transaction/${item.id}/edit`,
                                method: 'POST',
                                json: item
                            }, (saveErr, saveRes, saveResult)=>{
                                should.not.exist(saveErr);
                                request({
                                    url: `http://localhost:${port}/v1/user/list`,
                                    method: 'POST',
                                    json: {
                                        query: {},
                                        link: ['user+transaction']
                                    }
                                }, (secondErr, secondRes, secondResult)=>{
                                    should.not.exist(secondErr);
                                    should.exist(secondResult);
                                    should.exist(secondResult.results);
                                    should.exist(secondResult.results[0]);
                                    should.exist(secondResult.results[0].transaction_list);
                                    should.exist(secondResult.results[0].transaction_list.length);
                                    secondResult.results[0].transaction_list.length.should.be.above(0);
                                    result.results[0].transaction_list[0].card_id.should.equal( 'SOMETHING_ELSE');
                                    server.close(()=>{
                                        done();
                                    });
                                });
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            });
        });
        
        it('Loads and saves a complex object', function(done){
            this.timeout(20000);
            const app = express();
            app.use(bodyParser.json({strict: false}))
            const api = new Perigress.DummyAPI({
                subpath : 'audit-fk-api',
                dir: __dirname
            });
            let joiSchema = require(path.join(
                __dirname, 'audit-fk-api', 'v1', 'user.spec.js'
            ));
            api.ready.then(()=>{
                // fetch a deep 
                api.attach(app);
                const server = app.listen(port, (err)=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST',
                        json: {
                            query: {},
                            link: ['user+transaction']
                        }
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            should.exist(result.results);
                            should.exist(result.results[0]);
                            let user = result.results[0];
                            should.exist(result.results[0].transaction_list);
                            result.results[0].transaction_list.length.should.be.above(0);
                            result.results[0].transaction_list.push({
                              card_id: 'SOME_OTHER_THING',
                              total: '5894.21',
                              currency: 'USD',
                              externalTransactionId: '021-661-5622',
                              network: 'CHASE',
                              updatedBy: -73800000,
                              modifiedBy: 56200000,
                              isDeleted: false
                            })
                            let item = result.results[0].transaction_list[0];
                            item.card_id.should.equal( '23A81f36-78Fe-4Cd6-8B5F-66EAcD4cE1fB');
                            item.card_id = 'SOMETHING_ELSE';
                            request({
                                url: `http://localhost:${port}/v1/user/save`,
                                method: 'POST',
                                json: {
                                    objects: [user],
                                    link: ['user+transaction']
                                }
                            }, (err, res, saveResult)=>{
                                request({
                                    url: `http://localhost:${port}/v1/user/list`,
                                    method: 'POST',
                                    json: {
                                        query: {},
                                        link: ['user+transaction']
                                    }
                                }, (err, res, secondResult)=>{
                                    should.exist(secondResult);
                                    should.exist(secondResult.results);
                                    should.exist(secondResult.results[0]);
                                    let user = secondResult.results[0];
                                    should.exist(user.transaction_list);
                                    user.transaction_list.length.should.be.above(1);
                                    let item = result.results[0].transaction_list[0];
                                    item.card_id.should.equal( 'SOMETHING_ELSE');
                                    let item2 = result.results[0].transaction_list[1];
                                    item2.card_id.should.equal( 'SOME_OTHER_THING');
                                    server.close(()=>{
                                        done();
                                    });
                                });
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            });
        });
        
        let hasConsistentObjectOfType = (server, port, type, id, field, value, cb)=>{
            let joiSchema = require(path.join(
                __dirname, 'audit-fk-api', 'v1', type+'.spec.js'
            ));
            request({
                url: `http://localhost:${port}/v1/${type}/${id}`,
                method: 'POST',
                json: true
            }, (err, res, result)=>{
                should.not.exist(err);
                request({
                    url: `http://localhost:${port}/v1/${type}/${id}/edit`,
                    method: 'POST',
                    json: {
                        firstName: 'Bob'
                    }
                }, (editErr, editRes, editResult)=>{
                    should.not.exist(editErr);
                    request({
                        url: `http://localhost:${port}/v1/${type}/${id}`,
                        method: 'POST',
                        json: true
                    }, (secondErr, secondRes, secondResult)=>{
                        should.not.exist(secondErr);
                        Object.keys(result).should.deep.equal(Object.keys(secondResult))
                        cb(null);
                    });
                });
            });
        };
        
        it('can list objects it has saved consistently', function(done){
            this.timeout(20000);
            const app = express();
            app.use(bodyParser.json({strict: false}))
            const api = new Perigress.DummyAPI({
                subpath : 'audit-fk-api',
                dir: __dirname
            });
            let joiSchema = require(path.join(
                __dirname, 'audit-fk-api', 'v1', 'user.spec.js'
            ));
            api.ready.then(()=>{
                // fetch a deep 
                api.attach(app);
                const server = app.listen(port, (err)=>{
                    hasConsistentObjectOfType(server, port, 'user', 23872837, 'firstName', 'Bob', (err)=>{
                        server.close(()=>{
                            done();
                        });
                    });
                });
            });
        });
        
        it('returns a consistent type', function(done){
            this.timeout(20000);
            const app = express();
            app.use(bodyParser.json({strict: false}))
            const api = new Perigress.DummyAPI({
                subpath : 'audit-fk-api',
                dir: __dirname
            });
            let joiSchema = require(path.join(
                __dirname, 'audit-fk-api', 'v1', 'user.spec.js'
            ));
            api.ready.then(()=>{
                // fetch a deep 
                api.attach(app);
                const server = app.listen(port, (err)=>{
                    request({
                        url: `http://localhost:${port}/v1/user/create`,
                        method: 'POST',
                        json: {
                            firstName: 'Ed',
                            lastName: "Beggler",
                            email: 'robble@rauser.com',
                            phone: '404-555-4202',
                            updatedBy: 0234,
                            modifiedBy: 5555,
                            birthday: '1956-10-29T00:00:00.0Z',
                            updatedOn: '2015-04-23T06:00:00.0Z',
                            isDeleted: false,
                            modifiedOn: '1993-03-24T07:00:00.0Z'
                        }
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            request({
                                url: `http://localhost:${port}/v1/user/list`,
                                method: 'POST',
                                json: {
                                    includeSaved: true,
                                    query: { lastName: 'Beggler'}
                                }
                            }, (listErr, listRes, listResult)=>{
                                should.exist(listResult);
                                should.exist(listResult.results);
                                should.exist(listResult.results[0]);
                                listResult.results[0].firstName.should.equal('Ed');
                                server.close(()=>{
                                    done();
                                });
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            });
        });
        
    });

    describe('works using a paging API with audit columns', ()=>{

        it('loads and fetches an example file', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/transaction/15`,
                        method: 'POST',
                        json: true
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            should.exist(result.cardId);
                            result.cardId.should.equal('AD7D24D566CB7489');
                            should.exist(result.total);
                            result.total.should.equal('24.03');
                            should.exist(result.currency);
                            result.currency.should.equal('USD');
                            should.exist(result.externalTransactionId);
                            result.externalTransactionId.should.equal('472-224-4455');
                            should.exist(result.network);
                            result.network.should.equal('CHASE');
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

        it('outputs an error', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/notAnObject/15`,
                        method: 'POST',
                        json: true
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            should.exist(result.status);
                            result.status.should.equal('error');
                            should.exist(result.error);
                            should.exist(result.error.message);
                            result.error.message.should.equal('Path not found.');
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

        it('works with query documents ', (done)=>{
            const app = express();
            app.use(bodyParser.json({strict: false}));
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST',
                        json: {
                            query: {
                                'id': {$lt: 500}
                            }
                        }
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            should.exist(result.status);
                            result.status.toLowerCase().should.equal('success');
                            should.exist(result.results);
                            result.results.forEach((item)=>{
                                (item.id < 500).should.equal(true);
                            });
                            result.results.length.should.equal(15);
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

        it('assembles a tree', function(done){
            this.timeout(10000);
            const app = express();
            app.use(bodyParser.json({strict: false}));
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST',
                        json: {
                            query: {
                                'id': {$lt: 500}
                            },
                            link: ['user+transaction']
                        }
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            should.exist(result);
                            should.exist(result.status);
                            result.status.toLowerCase().should.equal('success');
                            should.exist(result.results);
                            result.results.forEach((item)=>{
                                (item.id < 500).should.equal(true);
                            });
                            should.exist(result.results[0].transactionList);
                            result.results.length.should.equal(15);
                            server.close(()=>{
                                done();
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });
        
        it('returns explicit query results', (done)=>{
            const app = express();
            app.use(bodyParser.json({strict: false}));
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/v1/user/list`,
                        method: 'POST',
                        json: {
                            query: {
                                'id': {$gt :0, $lt: 500},
                                'blah': { $eq : 'foobar' },
                                'foo' : { $in : ['bar', 'baz']},
                                'bar': { $lt : '05/05/2012 00:00:00' },
                            },
                            generate: 4,
                            persistGenerated: true
                        }
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        try{
                            let exampleItem = result.results[0];
                            request({
                                url: `http://localhost:${port}/v1/user/${exampleItem.id}`,
                                method: 'POST',
                                json: true
                            }, (err, res, result)=>{
                                should.not.exist(err);
                                try{
                                    should.exist(exampleItem);
                                    should.exist(result);
                                    exampleItem.should.deep.equal(result);
                                    server.close(()=>{
                                        done();
                                    });
                                }catch(ex){
                                    console.log(ex)
                                    throw ex;
                                }
                            });
                        }catch(ex){
                            console.log(ex)
                            throw ex;
                        }
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });
        
        it('fetches a spec', function(done){
            this.timeout(10000);
            const app = express();
            app.use(bodyParser.json({strict: false}));
            const api = new Perigress.DummyAPI({
                subpath : 'audit-api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(port, ()=>{
                    request({
                        url: `http://localhost:${port}/openapi.json`,
                        method: 'GET',
                        json: true
                    }, (err, res, result)=>{
                        should.not.exist(err);
                        should.exist(result);
                        should.exist(result.openapi);
                        result.openapi.should.equal('3.0.0');
                        should.exist(result.servers);
                        should.exist(result.paths);
                        Object.keys(result.paths).length.should.equal(12);
                        server.close(()=>{
                            done();
                        });
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });

    });
    
    describe('fetches internally', ()=>{
        
        it('runs the demo API and requests a consistent list', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'paged-wkr-api',
                dir: __dirname
            });
            api.internal('user', 'list', {}, (err, results)=>{
                let joiSchema = require(path.join(
                    __dirname, 'paged-wkr-api', 'v1', 'user.spec.js'
                ));
                should.exist(results);
                Array.isArray(results).should.equal(true);
                should.exist(results[0]);
                should.exist(results[0].id);
                should.exist(results[0].firstName);
                should.exist(results[0].lastName);
                should.exist(results[0].email);
                should.exist(results[0].phone);
                should.exist(results[0].birthday);
                results.forEach((res)=>{
                    let valid = joiSchema.validate(res);
                    (!!valid).should.equal(true);
                    should.not.exist(valid.error);
                });
                done();
            });
        });
        
        it('runs the demo API and requests a consistent object', async ()=>{
            try{
                const app = express();
                const api = new Perigress.DummyAPI({
                    subpath : 'wkr-api',
                    dir: __dirname
                });
                let joiSchema = require(path.join(
                    __dirname, 'paged-wkr-api', 'v1', 'user.spec.js'
                ));
                let user = await api.internal('user', 'read', { id : 1 });
                should.exist(user);
                let valid = joiSchema.validate(user);
                (!!valid).should.equal(true);
                user.id.should.equal(1);
                user.firstName.should.equal('Elizabeth');
                user.lastName.should.equal('Zulauf');
                user.email.should.equal('Zion.Reichel12@yahoo.com');
                user.phone.should.equal('520-674-9557');
            }catch(ex){
                console.log(ex)
                should.not.exist(ex);
            }
        });
        
        it('saves changes', (done)=>{
            try{
                const app = express();
                const api = new Perigress.DummyAPI({
                    subpath : 'wkr-api',
                    dir: __dirname
                });
                let joiSchema = require(path.join(
                    __dirname, 'paged-wkr-api', 'v1', 'user.spec.js'
                ));
                api.internal('user', 'list', {}, (err, users)=>{
                    let item = users[0];
                    item.firstName = 'Bob';
                    api.internal('user', 'update', { 
                        id : item.id, 
                        body: item 
                    }, (err, savedUser)=>{
                        should.exist(savedUser);
                        api.internal('user', 'read', { id : item.id}, (err, user)=>{
                            user.firstName.should.equal('Bob');
                            done();
                        });
                    });
                });
            }catch(ex){
                console.log(ex)
                should.not.exist(ex);
            }
        });
        
    });
});
