const rand = require('seed-random');

const Random = {
    seed : function(seed){
        return rand(seed)
    },
    numSeed : (str) => str
                .split('')
                .map((a) => a.charCodeAt(0))
                .reduce((a, b) => a + b)
 };

 let randomInt = (from, to, fractionalGenerator) =>{
    let diff = to - from;
    let val = Math.floor(from + fractionalGenerator()*diff);
    return val;
}

const makeGenerator = (seed) => {
    let gen = Random.seed(Random.numSeed(seed));
    gen.randomInt = (from, to)=>{
        return randomInt(from, to, gen);
    };
    return gen;
}

module.exports = {
    makeGenerator
}
