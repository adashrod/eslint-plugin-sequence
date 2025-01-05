# Rule: ordered-destructuring

This rule enforces lexical sorting of property names in destructuring statements

`fixable`: yes

Examples of compliant code:

```javascript
const { alpha, bravo, charlie } = data;

function sort({algorithm, ascending, key}) {
    ...

// if properties are aliased, the original name, not the alias, is used for sorting
// e.g. this is compliant because x, y, and z are sorted; lastName, firstName, and age are ignored
const { x: lastName, y: firstName, z: age } = data;
```

Examples of non-compliant code:
```javascript
const { z, y, x } = data;

function post({method, headers, body}) {
    ...
```

example configuration:
```javascript
"rules": {
    "sequence/ordered-destructuring": [
        "error", {
            ignoreCase: true,
            natural: true
        }
    ],
    ...
}
```

Using the fix to sort keys can cause odd whitespace rearrangement, but does not attempt to fix indentation. It can also cause trailing commas to be inserted after the list of keys. Fixing whitespace and removing trailing commas (if desired) should be left to a [lint rule](https://eslint.style/rules/default/comma-dangle) or a [formatter](https://github.com/prettier/prettier).

# Configuration

## ignoreCase

type: `boolean`

default: `false`

Set to true to do case-insensitive sorting.

## natural

type: `boolean`

default: `false`

Sort numeric tokens by arithmetic value, rather than lexical. When true, numbers are sorted like:
`"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"`. When false, numbers are sorted like: `"1", "10", "2", "3", "4", "5", "6", "7", "8", "9" `.

Example compliant code with true:

```javascript
const { key1, key5, key10 } = data;
```

Example compliant code with false:

```javascript
const { key1, key10, key5 } = data;
```
