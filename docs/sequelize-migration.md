Sequelize Migrations
====================

let's assume you have a set of validators in `./data/validators`... here's how you might generate a set of migrations, then overwrite the directory we store the previous state in with the current state:

```bash
    # now forget about it until you change the data again, after which you run
    peri generate-migration ./data/validators ./.lastMigration --sequelize=true > ./data/migrations/1647317213970350981-update.js
    sequelize db:migrate
    # once you make the new migration, save the current state
    rm -Rf ./.lastMigration
    cp -R ./data/validators ./.lastMigration
```
