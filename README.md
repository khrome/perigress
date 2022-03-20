Perigress
=========

Going around the problem of where to start.

Data maintenance, contract testing and data generation without boilerplate. This started as [an experiment](https://github.com/khrome/joinerator) with [joi](https://joi.dev/) to see if it were possible to generate a reasonable, consistent data, but then I became aware of a slightly different approach that could provide even better functionality with much less surface using [json-schema](https://json-schema.org/), but still support joi.

The ultimate goal of this library is to generate fully functional and tested backends, mocks, seeds and migrations from nothing more than a set of schema.

### coherant + consistent

The output data is "coherent". By that we mean: for [well known regexs](https://www.npmjs.com/package/well-known-regex), the generated data is consistent between fields in an object, in addition lists are coherent with individual item displays( they have the same data, both in a list and when requested directly) and, last, the data is consistent, meaning the same request will always generate the same output(excepting behavior changes between major versions).

### layout

Perigress (in most cases) uses a directory which mirrors the path of the endpoints. For example, given:
```mermaid
graph LR
    root[root] --> 1[config.js]
    root --> 2[resultSet.spec.js]
    root --> 3[error.spec.js]
    root --> 4[v1]
    subgraph 4g[object endpoints]
        4 --> 21[user.spec.js]
        4 --> 21[transaction.spec.js]
    end
    subgraph 1g[root endpoint config]
        1
    end
    subgraph 2g[root return structure]
        2
    end
    subgraph 3g[root error structure]
        3
    end

linkStyle 0,1,2,3,4 stroke-width:1px;

style 1g fill:transparent, stroke:#E5E5E5, stroke-width: 1px, stroke-dasharray:5;
style 2g fill:transparent, stroke:#E5E5E5, stroke-width: 1px, stroke-dasharray:5;
style 3g fill:transparent, stroke:#E5E5E5, stroke-width: 1px, stroke-dasharray:5;
style 4g fill:transparent, stroke:#E5E5E5, stroke-width: 1px, stroke-dasharray:5;
```

you'll have the following endpoints:

- `/v1/user/:id`
- `/v1/user/:id/edit`
- `/v1/user/list`
- `/v1/transaction/:id`
- `/v1/transaction/:id/edit`
- `/v1/transaction/list`


Command Line
------------

<table>
    <tr>
        <td><details><summary> <b>SQL+db-migrate</b> </summary><p>

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

</p></details></td></tr><tr>
<td><details><summary> <b>Sequelize</b> </summary><p>


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

</p></details></td></tr><tr>
<td><details><summary> <b>Mongo</b> </summary><p>


let's assume you have a set of validators in `./data/validators`... here's how you might handle working with the data:

```bash
    # TBD
```

</p></details></td></tr>
</table>

Launch a server:

```bash
peri serve ./test/api
```


Generate some fake data using the `transaction` definition.

```bash
peri generate-data ./test/api transaction my-seed-value
```

`Perigress.DummyAPI`
--------------------

The DummyAPI uses a directory structure and a series of either [joi validators](https://joi.dev/)(.spec.js), [JSON Schema](https://json-schema.org/)(.spec.schema.js), or example [JSON](https://json.org/example.html)(.spec.json) files to represent the structure of the API URLs.


Using `DummyEndpoint`
--------------------

Docs TBD


Roadmap
-------

- [ ] - list output
- [ ] - primary key support
- [ ] - audit columns
- [ ] - edit support (ephemeral)
- [ ] - example json support
- [ ] - url mapping
- [ ] - seed scripts
- [ ] - documentation via swagger
- [ ] - error output
- [ ] - deep object support (support generating from subobjects and arrays)
- [ ] - mongo support
- [ ] - api generation


Testing
-------

```bash
    mocha
    #or
    ./node_modules/mocha/bin/mocha
```
