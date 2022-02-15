# eslint-plugin-sequence

![github actions](https://github.com/adashrod/eslint-plugin-sequence/actions/workflows/node.js.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/eslint-plugin-sequence.svg)](https://www.npmjs.com/package/eslint-plugin-sequence)
<!--[![npm downloads](https://img.shields.io/npm/dt/eslint-plugin-sequence.svg?maxAge=2592000)](https://www.npmtrends.com/eslint-plugin-sequence)-->

A collection of EsLint rules variously related to sequences: sequences of imports, import members, and other elements.

Import rules can be used on ES6+ imports, as well as TypeScript imports

### [ordered-imports-by-path](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-imports-by-path.md)
(fixable): sort import statements by path
### [ordered-import-members](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-import-members.md)
(fixable): sort imported members by name

## Installation

```bash
npm install --save-dev eslint-plugin-sequence
```

Configure with EsLint, e.g. in `.eslintrc.json`
```javascript

"plugins": [
    "sequence"
],
"rules": {
    "sequence/ordered-imports-by-path": [
        "error", {
            "ignoreCase": true,
            "sortSideEffectsFirst": true
        }
    ],
    "sequence/ordered-import-members": [
        "error", {
            "sortSpecifiersWithComments": true
        }
    ],
    ...
}
```
