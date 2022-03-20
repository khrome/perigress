Perigress : SQL + db-migrate
============================

let's assume you have a set of validators in `./data/validators`... here's how you might handle working with the data:

```bash
    # first configure db-migrate by setting up your `database.json` config
    peri generate-tables ./data/validators --sql > ./data/migrations/1647316034481982946-create-up.sql
    db-migrate up 1647316034481982946-create --sql-file
    cp -R ./data/validators ./.lastMigration

    # now forget about it until you change the data again, after which you run
    peri generate-migration ./data/validators ./.lastMigration --sql up > ./data/migrations/1647317213970350981-update-up.sql
    peri generate-migration ./data/validators ./.lastMigration --sql down > ./data/migrations/1647317213970350981-update-down.sql
    db-migrate up 1647317213970350981-update --sql-file
    # once you make the new migration, save the current state
    rm -Rf ./.lastMigration
    cp -R ./data/validators ./.lastMigration
```
