# eslint-plugin-sequence

![github actions](https://github.com/adashrod/eslint-plugin-sequence/actions/workflows/node.js.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/eslint-plugin-sequence.svg)](https://www.npmjs.com/package/eslint-plugin-sequence)
[![npm downloads](https://img.shields.io/npm/dt/eslint-plugin-sequence.svg?maxAge=2592000)](https://www.npmtrends.com/eslint-plugin-sequence)

A collection of [EsLint](https://github.com/eslint/eslint) rules variously related to sequences: sequences of imports, import members, characters, and other elements.

Import rules can be used on ES6+ imports, as well as TypeScript imports

### [ordered-imports-by-path](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-imports-by-path.md)
(fixable): sort import statements by path
### [ordered-import-members](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-import-members.md)
(fixable): sort imported members by name
### [strict-camel-case](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/strict-camel-case.md)
(fixable via suggestions): enforce StrictCamelCase style in identifiers, forbid LOOSECamelCase
### [logical-expression-complexity](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/logical-expression-complexity.md)
(*not* fixable): enforce limits on complexity of logical expressions
### [ordered-destructuring](https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-destructuring.md)
(fixable): sort keys in object destructuring statements

## Installation

```bash
npm install --save-dev eslint-plugin-sequence
```

Configure with EsLint, e.g. in `eslint.config.mjs`
```javascript
import sequence from "eslint-plugin-sequence";

...

        plugins: [
            sequence
        ],
        rules: {
            "sequence/ordered-imports-by-path": [
                "error", {
                    ignoreCase: true,
                    sortSideEffectsFirst: true,
                    allowSeparateGroups: true,
                    sortTypeImportsFirst: true
                }
            ],
            "sequence/ordered-import-members": [
                "error", {
                    ignoreCase: true,
                    sortSpecifiersWithComments: true
                }
            ],
            "sequence/strict-camel-case": [
                "error", {
                    ignoreImports: false,
                    ignoredIdentifiers: ["legacyAPI", "htmlToXML", "PI", "TAU", "EPSILON"],
                    allowOneCharWords: "last",
                    ignoreSingleWordsIn: ["enum_member", "static_class_field"]
                }
            ],
            "sequence/logical-expression-complexity": [
                "error", {
                    maxHeight: 3,
                    maxTerms: 6,
                    binaryOperators: ["==", "===", "!=", "!=="],
                    includeTernary: true
                }
            ],
            "sequence/ordererd-destructuring": [
                "error", {
                    ignoreCase: true,
                    natural: true
                }
            ],
...
```

## Compatibility

As of version `1.0.0`, the plugin requires `eslint` peer `9.x`. To use with older versions of `eslint`, use version `0.7.0`.