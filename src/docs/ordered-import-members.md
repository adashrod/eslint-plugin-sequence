# Rule: ordered-import-members

This rule checks that members in import statements are sorted alphabetically in ascending order.

`fixable`: calling EsLint with the `--fix` option rearranges import members.

An example of valid imports under this rule:

```javascript
import {
    existsSync,
    readFileSync,
    writeFileSync
} from "fs";
```

example configuration:
```javascript
"rules": {
    "sequence/ordered-import-members": [
        "error", {
            "ignoreCase": true,
            "sortSpecifiersWithComments": true
        }
    ],
    ...
}
```

# Configuration

## ignoreCase
-------------

type: `boolean`

default: `false`

`false`: sorting is case-sensitive; uppercase letters sort before lowercase, e.g. `import { "A", "D", "E", "b", "c" } from "letters";`

`true`: sorting is done in a case-insensitive manner, e.g. `import { "A", "b", "c", "D", "E" } from "letters";`

## sortSpecifiersWithComments
-----------------------------

type: `boolean`

default: `false`

Note: this parameter only affects behavior when using `--fix`. It doesn't change anything about how errors/warnings are reported.

Using the fix can cause odd whitespace rearrangement, but does not attempt to fix indentation. It can also cause trailing commas to be inserted after the list of members. Fixing whitespace and removing trailing commas (if desired) should be left to a [lint rule](https://eslint.style/rules/default/comma-dangle) or a [formatter](https://github.com/prettier/prettier).

`false`: when using `--fix`, import members are rearranged if there are no surrounding comments.

`true`: when using `--fix`, import members are rearranged even if there are surrounding comments

Comments are treated as being attached to a preceding member and are moved together with that member. No attempt is made to alphabetize comment content.

Examples:

before:
```javascript
import { Echo, Bravo, Alpha, /* Charlie, Delta,*/ } from "alphabet";
```

after `--fix`:
```javascript
import { Alpha, /* Charlie, Delta,*/ Bravo, Echo, } from "alphabet";
// the "Charlie, Delta" comment is treated as attached to the "Alpha" token and moved with it
```

before:
```javascript
import {
    // Alpha,
    Echo,
    /* Charlie,
    Delta,*/
    Bravo
} from "alphabet";
```

after `--fix`:
```javascript
import {
    // Alpha,
    Bravo,
Echo,
    /* Charlie,
    Delta,*/
    } from "alphabet";
```

before:
```javascript
import {
Bravo, // second letter
Delta,
// Alpha,
Charlie } from "alphabet";
```

after `--fix`
```javascript
import {
Bravo, // second letter
Charlie, Delta,
// Alpha,
} from "alphabet";
// "second letter" comment stays with "Bravo" token and "Alpha" comment stays with "Delta" token
```
