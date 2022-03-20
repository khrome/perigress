Perigress : SQL + db-migrate Migration
======================================

let's assume you have a set of validators in `./data/validators`... here's how you might generate a set of migrations, then overwrite the directory we store the previous state in with the current state:

```bash
    # now forget about it until you change the data again, after which you run
    peri generate-migration ./data/validators ./.lastMigration --sql up > ./data/migrations/1647317213970350981-update-up.sql
    peri generate-migration ./data/validators ./.lastMigration --sql down > ./data/migrations/1647317213970350981-update-down.sql
    db-migrate up 1647317213970350981-update --sql-file
    # once you make the new migration, save the current state
    rm -Rf ./.lastMigration
    cp -R ./data/validators ./.lastMigration
```
