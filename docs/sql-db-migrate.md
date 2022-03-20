Perigress : SQL + db-migrate
============================

let's assume you have a set of validators in `./data/validators`... here's how you might handle generating a set of Models (We'll also save a copy of the current state, so we can generate migrations later):

```bash
    # first configure db-migrate by setting up your `database.json` config
    peri generate-tables ./data/validators --sql > ./data/migrations/1647316034481982946-create-up.sql
    db-migrate up 1647316034481982946-create --sql-file
    cp -R ./data/validators ./.lastMigration
```
