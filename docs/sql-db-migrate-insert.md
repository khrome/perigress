Perigress : SQL + db-migrate Seed Files
=======================================

let's assume you have a set of validators in `./data/validators`... here's how you might handle generating a seed file with 2 users and 3 transactions (We'll also save a copy of the current state, so we can generate migrations later):

```bash
    peri generate-data ./data/validators --sql user some-seed-value > ./data/seeds.js
    peri generate-data ./data/validators --sql user other-seed-value >> ./data/seeds.js
    peri generate-data ./data/validators --sql transaction trans-seed-1 >> ./data/seeds.js
    peri generate-data ./data/validators --sql transaction trans-seed-2 >> ./data/seeds.js
    peri generate-data ./data/validators --sql transaction trans-seed-3 >> ./data/seeds.js
```
