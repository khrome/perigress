const should = require('chai').should();
const Perigress = require('../perigress');
const path = require('path');
const express = require('express');
const request = require('postman-request');

const port = 8080;

describe('perigress', ()=>{
    describe('loads an API', ()=>{
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
                            let user = JSON.parse(body);
                            let joiSchema = require(path.join(
                                __dirname, 'api', 'v1', 'transaction.spec.js'
                            ));
                            let valid = joiSchema.validate(user);
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
    })
})
