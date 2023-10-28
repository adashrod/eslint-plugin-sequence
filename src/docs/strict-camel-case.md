# Rule: strict-camel-case

This rule enforces strict camel case and forbids camel case identifier names that have any all-caps words in them.

`fixable`: *not* fixable at the command line using `--fix`

`hasSuggestions`: suggestions are provided for IDEs that support making suggested changes

#### Suggestion screenshot:

![VsCode screenshot](https://github.com/adashrod/eslint-plugin-sequence/blob/main/src/docs/images/strictCamelCaseQuickFix.jpg)


An example of valid names under this rule:

```javascript
let innerHtml, xmlHttpRequest;

class HtmlToXmlConverter {
    ...

class JsonApiSerializer {
    ...
```

An example of invalid names under this rule:

```javascript
let innerHTML, an_invalid_name;

class HTMLToXMLConverter {
    ...

class JSONAPISerializer {
    ...
```

## Rant

The opinion of this rule is that acronyms, abbreviations, initialisms, etc. that are all-caps in sentence case should absolutely *never* be all-caps in camel case. Camel case is a form of destructive editing; it does not acknowledge, respect, or preserve the original case of the input, whether that input is a capitalized proper noun (e.g. "Billie"), a lowercase common noun (e.g. "chair"), any other type of word (e.g. "listen"), or even an acronym/abbreviation/etc.

Further reading:
[Google Java style guide](https://google.github.io/styleguide/javaguide.html#s5.3-camel-case),
[My detailed rant](https://gist.github.com/adashrod/66564c690906c9b774e77ddacbd06e1b)

## Notes about validation and suggested replacements:

1. Although the rule is not fixable at the command line, suggestions are made, which some IDEs can use to make changes on a case-by-case basis. Logic to validate names and generate suggestions use generic Unicode letter matching, and therefore should work for non-english characters.

1. For loose camel case names that have multiple, contiguous all-caps words, the rule has no way of knowing when the words begin and end, so it treats them as one long word, e.g. `JSONAPISerializer` ostensibly means "JSON API serializer", but without prior knowledge of the words "JSON" and "API", it can't know how to properly tokenize the string and instead yields `["JSONAPI", "Serializer"]`, and the suggested replacement would be `JsonapiSerializer`, rather than `JsonApiSerializer`.

1. Some programmers like to maintain the all-caps aspect of acronyms even when they're the first word in a lower camel case identifier, e.g.
    ```typescript
    let hTMLElement: HTMLElement;
    ```
    The rule has no way of knowing that the "hTML" is intended to be one word, so it parses it as `["h", "TML", "Element"]` and would suggest `hTmlElement` as a replacement.

1. Due to the convention of sometimes using leading or trailing underscores in identifiers, especially in private fields, leading and trailing underscores are ignored for camel case validity, and are preserved in suggestions.
    ```
    "__privateStuff_" -> valid, no suggestion
    "_someXML___" -> "_someXml___"
    ```


### example configuration:
```javascript
"rules": {
    "sequence/strict-camel-case": [
        "error", {
            "ignoreProperties": false,
            "ignoreImports": false,
            "ignoredIdentifiers": ["htmlToXML", "legacyAPI"],
            "allowOneCharWords": "last",
            "ignoreSingleWords": false,
            "ignoreSingleWordsIn": ["enum_member", "static_class_field"]
        }
    ],
    ...
}
```


# Configuration

## ignoreImports
---

type: `boolean`

default: `false`

Set to `true` to ignore all identifiers in import statements. Note: this doesn't check original names, but does check aliases and named default imports.

```javascript
import { HTMLTags } from "htmlUtil"; // this doesn't trigger an error when ignoreImports=false because it should only validate identifiers in the current project, not external ones
// however if "htmlUtil" is part of your project, the export statement in that file will trigger an error
```
```javascript
import { Tags4 as HTML4Tags } from "htmlUtil"; // this does trigger an error because the identifier alias "HTML4Tags" is declared here and can indeed be fixed
```
```javascript
import FS from "fs"; // this does trigger an error because the default import alias "FS" is declared here and can indeed be fixed
```


## ignoredIdentifiers
---

type: `string[]`

default: `[]`

An array of identifiers to ignore during linting. Any identifier put in this array will not trigger an error.

## allowOneCharWords
---

type: `enum`

values: `"never" | "always" | "last"`

default `"never"`

Since tokens in camel case have one letter capitalized and the rest lowercase, a 1-letter word can create problems for camel case because, even following strict camel case, there could be contiguous uppercase letters, e.g. `ThisIsAClass`. This option allows some control over how to handle that. Note: when identifiers trigger an error due to this configuration, the lint rule will not provide a suggestion, because none exists.

`"never"`: 1-letter, uppercase words are considered invalid
```javascript
// example invalid identifiers
class ThisIsAClass {}
class AClass {};
class A {}
function getX() {}
```

`"always"`: 1-letter, uppercase words are always allowed
```javascript
// example allowed identifiers
class ThisIsAClass {}
class AClass {};
class A {}
function getX() {}
```

`"last"`: 1-letter, uppercase words are only allowed as the last word in an identifier, i.e. there are no contiguous sequences of uppercase letters
```javascript
// example invalid identifiers
class ThisIsAClass {}
class AClass {};
// example allowed identifiers
function getX() {}
class A {}
```

## ignoreSingleWordsIn
---

type: `enum[]`

values: `"enum_member" | "first_class_constant" | "object_field" | "static_class_field"`

default: `[]`

Identifiers that are all-caps and contain only one word are inherently ambiguous, e.g. `HTML, JSON, PI, TAU, EPSILON`. Any of these could be names of classes that are in loose camel case, or names of constants that are in all-caps snake case. There's no way to make that determination without knowing the semantic meaning of them.
Adding additional words demontstrates how the single-word versions are ambiguous: `HTMLTags, JSONSerializer, TAU_IS_2_PI, EPSILON_UNCERTAINTY`.

As opposed to `ignoreSingleWords`, which is very broad, this option lets you allow all-caps single words in certain contexts that are likely to have constant members. For example, you can allowlist 1st-class constants (`export const MAX = 10`) or static class fields (`class Util { public static MAX = 10; }`), but not identifiers that are not usually used as constants (`class API {}` or `type HTML = {...}`).

#### Example allowed single-word identifiers with each option:

`enum_member`:
```
enum Direction {
    NORTH, EAST, SOUTH, WEST
}
```

`first_class_constant`:
```
export const VERSION = "1.0"
```

`object_field`:
```
const myEs6EnumDirection = {
    NORTH: "north",
    EAST: "east",
    SOUTH: "south",
    WEST: "west"
}
```

`static_class_field`:
```
class MyUtil {
    public static VERSION = "1.0";
}
```

## ignoreProperties (deprecated)

type: `boolean`

default: `false`

#### This option will be removed in a future release. Please use `ignoredIdentifiers` and/or `ignoreSingleWordsIn` instead

Set to `true` to ignore: class fields, class methods, object keys, object methods, and private fields and methods.

Example items that are ignored:
```javascript
let obj = {
    ignoredKey: 10,
    ignoredFunction() {}
};

class MyJsClass {
    constructor() {
        this.ignoredProperty = "";
    }
    ignoredFunction() {}
    #ignoredPrivateField = 5;
    #ignoredPrivateFunction() {}
}

class MyTsClass {
    public ignoredField: string = "";
}
```

## ignoreSingleWords (deprecated)
---

type: `boolean`

default: `false`

#### This option will be removed in a future release. Please use `ignoredIdentifiers` and/or `ignoreSingleWordsIn` instead

Identifiers that are all-caps and contain only one word are inherently ambiguous, e.g. `HTML, JSON, PI, TAU, EPSILON`. Any of these could be names of classes that are in loose camel case, or names of constants that are in all-caps snake case. There's no way to make that determination without knowing the semantic meaning of them.
Adding additional words demontstrates how the single-word versions are ambiguous: `HTMLTags, JSONSerializer, TAU_IS_2_PI, EPSILON_UNCERTAINTY`.

`true`: all-caps single-word identifiers are ignored and don't trigger errors (assumed to be all-caps snake case, i.e. constants)

`false`: all-caps single-word identifiers trigger errors (assumed to be loose camel case)

If you'd like to enforce `strict-camel-case` on single-word identifiers, but not trigger errors for single-word all-caps constants, ~~consider keeping this option set to `false` and either adding your constant names to the `ignoredIdentifiers` option, or using `/* eslint-disable sequence/strict-camel-case */` around your constants.~~ use `ignoreSingleWordsIn` to specify how you are using constants or put your identifiers in `ignoredIdentifiers`.
