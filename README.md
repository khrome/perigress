Perigress
=========

Going around the problem of where to start.

Data maintenance, contract testing and data generation without boilerplate. This started as [an experiment](https://github.com/khrome/joinerator) with [joi](https://joi.dev/) to see if it were possible to generate a reasonable, consistent data, but then I became aware of a slightly different approach that could provide even better functionality with much less surface using [json-schema](https://json-schema.org/), but still support joi.

Command Line
------------

Generate an `up` migration in SQL from two snapshots of the data model

```bash
peri generate-migration ./path/to/snapshot1 ./path/to/snapshot2 up --sql
```

Generate a `down` migration using sequelize from two snapshots of the data model

```bash
peri generate-migration ./path/to/snapshot1 ./path/to/snapshot2 down --sequelize
```

Generate a set of tables using the provided definitions in SQL

```bash
peri generate-tables ./path/to/snapshot --sql
```

Generate some fake data using the `transaction` definition.

```bash
peri generate-data ./test/api transaction my-seed-value
```

Using `DummyAPI`
---------------

uses a directory structure and a series of either [joi validators](https://joi.dev/), [JSON Schema](https://json-schema.org/), or example [JSON](https://json.org/example.html) files to represent the structure of the API URLs.

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

Using `Table`
-------------

TBD

Using `Migration`
-----------------

TBD

Using `Insert`
--------------

TBD

Using `Database`
----------------

TBD

coherence + consistency
-----------------------


Testing
-------
