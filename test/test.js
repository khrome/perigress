const should = require('chai').should();
const Perigress = require('../api-dummy');
const path = require('path');
const express = require('express');
const request = require('postman-request');

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

        it('runs the demo API', (done)=>{
            const app = express();
            const api = new Perigress.DummyAPI({
                subpath : 'api',
                dir: __dirname
            });
            api.ready.then(()=>{
                api.attach(app);
                const server = app.listen(8080, ()=>{
                    server.close(()=>{
                        done();
                    });
                });
            }).catch((ex)=>{
                should.not.exist(ex);
            });
        });
    })
})
