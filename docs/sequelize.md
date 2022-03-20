Perigress : Sequelize
=====================

let's assume you have a set of validators in `./data/validators`... here's how you might handle working with the data:

```bash
    # first configure db-migrate by setting up your `database.json` config
    peri generate-tables ./data/validators --sequelize="`./src/sequelize`" > ./data/models.js
    node -e "require('./data/models'); require('./src/sequelize').sync()"
    cp -R ./data/validators ./.lastMigration

    # now forget about it until you change the data again, after which you run
    peri generate-migration ./data/validators ./.lastMigration --sequelize=true > ./data/migrations/1647317213970350981-update.js
    sequelize db:migrate
    # once you make the new migration, save the current state
    rm -Rf ./.lastMigration
    cp -R ./data/validators ./.lastMigration
```
