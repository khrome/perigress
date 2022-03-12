Perigress
=========

Going around the problem of where to start.

Data maintenance, contract testing and data generation without boilerplate. This started as [an experiment](https://github.com/khrome/joinerator) with [joi](https://joi.dev/) to see if it were possible to generate a reasonable, consistent data, but then I became aware of a slightly different approach that could provide even better functionality with much less surface using [json-schema](), but still support joi.

Using `DummyAPI`
---------------

uses a directory structure and a series of either [joi validators](), [JSON Schema](), or example [JSON]() files to represent the structure of the API URLs

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
