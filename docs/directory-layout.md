Perigress Setup
===============

Perigress (in most cases) uses a directory which mirrors the path of the endpoints. For example, given:
```mermaid
graph LR
    root[root] --> 1[config.js]
    root --> 2[resultSet.spec.js]
    root --> 3[error.spec.js]
    root --> 4[v1]
    subgraph 4g[object endpoints]
        4 --> 21[user.spec.js]
        4 --> 22[transaction.spec.js]
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
