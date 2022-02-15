# Rule: ordered-imports-by-path

This rule checks that import statements are sorted in ascending order, alphabetically by path.

`fixable`: calling EsLint with the `--fix` option rearranges imports.

An example of valid imports under this rule:

```javascript
import { exec } from "child_process";
import * as fs from "fs";
import fetch from "node-fetch";
```

example configuration:
```javascript
"rules": {
    "sequence/ordered-imports-by-path": [
        "error", {
            "ignoreCase": true,
            "sortSideEffectsFirst": true
        }
    ],
    ...
}
```

# Options

## ignoreCase
-------------

type: `boolean`

default: `false`

`false`: sorting is case-sensitive; uppercase letters sort before lowercase, e.g. `["A", "D", "E", "b", "c"]`

`true`: sorting is done in a case-insensitive manner, e.g. `["A", "b", "c", "D", "E"]`

## allowSeparateGroups
----------------------

type: `boolean`

default: `true`

`true`: "groups" of imports can be separated from each other by lines of whitespace and each group will be sorted individually, e.g.

```javascript
import { exec } from "child_process";
import * as fs from "fs";
import fetch from "node-fetch";

import Article from "model/Article"
import User from "model/User";
```
In the above example, the two groups of imports are each sorted separately.

`false`: grouping is ignored and all imports are sorted as a single collection of imports

## sortSideEffectsFirst
-----------------------

type: `boolean`

default: `false`

Side-effect imports are ones that execute code from the import without assigning the import to a value, e.g.

```javascript
import "module-alias/register";
```

In some cases, side-effect imports must execute before anything else for the program to function correctly; this facilitates that use case.

`false`: side-effect imports are sorted like all other imports, by path.

valid format:
```javascript
import { exec } from "child_process";
import * as fs from "fs";
import "module-alias/register";
import fetch from "node-fetch";
```

`true`: side-effect imports are sorted before imports that import values or types.

valid format:
```javascript
import "module-alias/register";
import { exec } from "child_process";
import * as fs from "fs";
import fetch from "node-fetch";
```

## sortTypeImportsFirst (TypeScript only)
-----------------------

type: `boolean`

default: `true`

Since TypeScript allows importing both types and values, it's possible to have 2 imports with the same path. This parameter determines whether the type imports come before or after value imports with the same path.

`true`: valid format:
```javascript
import type { User } from "@app/user";
import { Admin } from "@app/user";
```

`false`: valid format
```javascript
import { Admin } from "@app/user";
import type { User } from "@app/user";
```
