const should = require('chai').should();
const Perigress = require('../perigress');
const path = require('path');
const express = require('express');
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
                    request({
                        url: `http://localhost:${port}/v1/transaction/F74bf5aF-aB23-4FCa-BfC5-ebA5480FDf64`,
                        method: 'POST'
                    }, (err, res, body)=>{
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
                            should.not.exist(ex);
                        }
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
                            user.birthday.should.equal('1975-08-30T06:00:00.0Z');
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

    });
});
