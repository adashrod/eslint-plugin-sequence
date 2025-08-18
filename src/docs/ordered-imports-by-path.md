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

## groups
---------

type: `string[]`

default: `[]`

Each string is a regular expression to match import path/package names. One special value is `THE_REST`. Each regex corresponds to a group of imports matching that regex, with groups separated by an additional line break. The token `THE_REST` *must* be present in the `groups` array; if it's missing, then this option is ignored. If using `sortSideEffectsFirst: true`, then those imports will implicitly be put into a first group called `SIDE_EFFECTS`.

Example:
```
    // eslint config
    groups: [
        "node:.*",
        "THE_REST",
        "app/.*"
    ]
```

```
// compliant code
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";

import { Logger } from "simple-node-logger";
import yargs from "yargs/yargs";

import User from "app/model/User"
import User from "app/model/Article"
```

Example with side-effects imports:
```
    // eslint config
    sortSideEffectsFirst: true,
    groups: [
        "node:.*",
        "THE_REST",
        "app/.*"
    ]
```

```
// compliant code
import "module-alias/register";

import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";

import { Logger } from "simple-node-logger";
import yargs from "yargs/yargs";

import User from "app/model/User"
import User from "app/model/Article"
```

All package names in the first group - `node:process`, `node:timers` - match the first regex, `node:.*`. All path names in the third group - `app/model/User`, `app/model/Article` - match the third regex - `app/.*`. All other path/package names that don't match any regexes get sorted into the group labeled `THE_REST`.

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

type: `boolean` | `undefined`

default: `undefined`

Since TypeScript allows importing both types and values, it's possible to have 2 imports with the same path. This parameter determines whether the type imports come before or after value imports with the same path.

Fun fact: with TypeScript 5+, it's no longer necessary to explicitly use type imports to minimize the size of the output JS when using the TS compiler. The TS compiler can determine if an import is only being used as a type and won't include the import in the output; this is called import elision.


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

`undefined`: if this option is omitted, the order of type imports vs. regular imports is ignored, i.e. both examples above pass
