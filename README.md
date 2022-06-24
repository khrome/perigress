Perigress
=========

A medium for contract based development.

Data maintenance, contract testing and data generation without boilerplate using a series of either [joi validators](https://joi.dev/api/)(.spec.js), [JSON Schema](https://json-schema.org/)(.spec.schema.js), or example [JSON](https://json.org/example.html)(.spec.json) files to represent the structure of the API URLs(which you are probably **already** writing). This started as [an experiment](https://github.com/khrome/joinerator) with [joi](https://joi.dev/) to see if it were possible to generate a reasonable, [coherent + consistent](https://github.com/khrome/perigress/blob/master/docs/coherent-consistent.md) data, but then I realized using [json-schema](https://json-schema.org/) could support joi **and** many other features and pipelines.

The ultimate goal of this library is to generate fully functional and tested backends, mocks, seeds and migrations from nothing more than a set of schema.

### 1. Setup the directory layout

Only a single file is required to generate a test api, and that's the schema of the object you want to generate. That might be as simple as:

```bash
mkdir verifiers
mkdir verifiers/api
cp ../joi_user_definition.js verifiers/api/user.spec.js # OR
# cp ../json-schema_user.js verifiers/api/user.spec.schema.js
```


More complex options are described in the [detailed setup document](https://github.com/khrome/perigress/blob/master/docs/directory-layout.md).

### 2. Use the mock in testing

You can launch the mock on the command line:

```bash
# use ./node_modules/perigress/bin/peri if you don't have a global `peri`
peri serve ./verifiers --port 8080
#in another terminal:
open "http://localhost:8080/api/user/list"
```

You can also launch the server within your code:

```javascript
const { DummyAPI } = require('perigress');
const api = new DummyAPI({
    subpath : 'verifiers',
    dir: __dirname
});
api.attach(expressInstance);

```

### 3. Generate data definitions

You can generate data definitions(SQL, Data Model) based on your endpoint contract.

- [SQL + db-migrate](https://github.com/khrome/perigress/blob/master/docs/sql-db-migrate.md)
- [Sequelize](https://github.com/khrome/perigress/blob/master/docs/sequelize.md)
- [Mongo](https://github.com/khrome/perigress/blob/master/docs/mongo.md)<sup>TBD</sup>


### 4. Generate DB seed files

You can generate consistent fake data to load into your database without having to be paranoid about sanitizing the dev DB (or having to update seed scripts by hand every single time the DB structure is altered).

- [SQL + db-migrate](https://github.com/khrome/perigress/blob/master/docs/sql-db-migrate-insert.md)
- [Sequelize](https://github.com/khrome/perigress/blob/master/docs/sequelize-insert.md)
- [Mongo](https://github.com/khrome/perigress/blob/master/docs/mongo-insert.md)<sup>TBD</sup>

### 5. Generate migrations

Finally, because you can compute the difference between schema, you can also generate migrations for sets of changes of your data definitions.

- [SQL + db-migrate](https://github.com/khrome/perigress/blob/master/docs/sql-db-migrate-migration.md)
- [Sequelize](https://github.com/khrome/perigress/blob/master/docs/sequelize-migration.md)
- [Mongo](https://github.com/khrome/perigress/blob/master/docs/mongo-migration.md)<sup>TBD</sup>

### 6. Documentation

At any time the current spec is available at `/spec` with it's corresponding data at `/openapi.json`.

Roadmap
-------

- [x] - list output
- [x] - primary key support
- [x] - audit columns
- [x] - edit support (ephemeral)
- [x] - example json support
- [x] - url mapping
- [x] - seed scripts
- [x] - documentation via OpenAPI
- [x] - error output
- [x] - selector support [query filter documents](https://www.mongodb.com/docs/manual/core/document/#std-label-document-query-filter)
- [x] - foreign key support
- [x] - document assembly
- [x] - generate + persist requested filter values
- [x] - internal requests
- [ ] - validator assembly
- [ ] - db test suites
- [ ] - verbose mode, clearer errors
- [ ] - better documentation
- [ ] - deep object support (allow subobjects and arrays in schema)
- [ ] - [mongosh](https://www.mongodb.com/docs/mongodb-shell/reference/methods/#std-label-mdb-shell-methods) + [mongojs](https://www.npmjs.com/package/mongojs) support
- [ ] - [yup](https://www.npmjs.com/package/yup) support
- [ ] - [prisma](https://www.prisma.io/) support
- [ ] - [mongoose](https://www.npmjs.com/package/mongoose) support
- [ ] - pluggable transports (ex: REST+XML, REST+form, REST+json ...)
- [ ] - api generation


Testing
-------

```bash
    mocha
    #or
    ./node_modules/mocha/bin/mocha
```
