Perigress
=========

Going around the problem of where to start.

Data maintenance, contract testing and data generation without boilerplate. This started as [an experiment](https://github.com/khrome/joinerator) with [joi](https://joi.dev/) to see if it were possible to generate a reasonable, consistent data, but then I became aware of a slightly different approach that could provide even better functionality with much less surface using [json-schema](https://json-schema.org/), but still support joi.


let's assume you have a set of validators in `./data/validators`... here's how you might handle working with the data:

Command Line - **SQL + db-migrate**
-----------------------------------

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

Command Line - **Sequelize**
----------------------------

for this, let's also assume we have a configured sequelize at `./src/sequelize`:

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


Generate some fake data using the `transaction` definition.

```bash
peri generate-data ./test/api transaction my-seed-value
```

Using `DummyAPI`
---------------

The DummyAPI uses a directory structure and a series of either [joi validators](https://joi.dev/)(.spec.js), [JSON Schema](https://json-schema.org/)(.spec.schema.js), or example [JSON](https://json.org/example.html)(.spec.json) files to represent the structure of the API URLs.

given:
```
└── v1
   ├── error.spec.js
   ├── resultSet.spec.js
   ├── transaction.spec.js
   └── user.spec.js
```

you'll have the following endpoints:

- `/v1/user/:id`
- `/v1/user/:id/edit`
- `/v1/user/list`
- `/v1/transaction/:id`
- `/v1/transaction/:id/edit`
- `/v1/transaction/list`


Using `DummyEndpoint`
--------------------

Docs TBD


coherence + consistency
-----------------------

The output data is "coherent", by that it means, for [well known regexs](https://www.npmjs.com/package/well-known-regex), the generated data is consistent between fields in an object, in addition lists are coherent with individual item displays( they have the same data, both in a list and when requested directly) and, last, the data is consistent, meaning the same request will always generate the same output(excepting behavior changes between major versions).

Roadmap
-------

- [ ] - list output
- [ ] - primary key support
- [ ] - audit columns
- [ ] - edit support (ephemeral)
- [ ] - example json support
- [ ] - url mapping
- [ ] - error output


Testing
-------
