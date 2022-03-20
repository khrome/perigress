Perigress : Sequelize
=====================

let's assume you have a set of validators in `./data/validators`... here's how you might handle generating a set of Models (We'll also save a copy of the current state, so we can generate migrations later):

```bash
    # first configure db-migrate by setting up your `database.json` config
    peri generate-tables ./data/validators --sequelize="`./src/sequelize`" > ./data/models.js
    node -e "require('./data/models'); require('./src/sequelize').sync()"
    cp -R ./data/validators ./.lastMigration
```
