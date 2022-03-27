const DummyEndpoint = require('./src/dummy-endpoint');
const DummyAPI = require('./src/dummy-api');
const { WKR } = require('well-known-regex');

module.exports = {
    DummyEndpoint,
    DummyAPI,
    validators : WKR,
    validator : (group, name)=>{
        try{
            if(WKR[group] && WKR[group][name] && WKR[group][name].pattern){
                return new RegExp(WKR[group][name].pattern);
            }
        }catch(ex){
            return new Error(ex);
        }
    }
};
