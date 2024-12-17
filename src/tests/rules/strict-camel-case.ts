import { parse } from "@typescript-eslint/parser";
import { RuleTester as TsEsLintRuleTester } from "@typescript-eslint/rule-tester";
import { ESLintUtils as EsLintUtils } from "@typescript-eslint/utils";
import { RuleTester as EsLintRuleTester } from "eslint";
import EventEmitter from "events";

import strictCamelCaseRule from "@adashrodEps/lib/rules/strict-camel-case";

const es13RuleTester = new EsLintRuleTester({
    languageOptions: {
        parserOptions: {
            // 13 has support for # private field/function syntax
            ecmaVersion: 13
        }
    }
});
es13RuleTester.run("strict-camel-case", strictCamelCaseRule, {
    valid: [
        `let xmlToHtml = () => {};`,
        `let русскийВоенныйКорабльИдиНаХуй = true;`,
        {
            code: `const AFunction = () => {};`,
            options: [{ allowOneCharWords: "always" }]
        }, {
            code: `const getX = () => {};`,
            options: [{ allowOneCharWords: "last" }]
        }, {
            code: `class API {}`,
            options: [{ ignoreSingleWords: true }]
        },
        `const apiApiApi = "...";`,
        `const someFunc = (firstParam, secondParam) => {};`,
        `const someFunc = function(firstParam, secondParam) {};`,
        `const someFunc = function func(firstParam, secondParam) {};`,
        `class MyApiClass {}`,
        `const SomeClass = class {};`,
        `try { throw new Error(); } catch (anIoException) {}`,
        `let obj = { htmlApi: "..." }`,
        {
            code: `let obj = { htmlAPI: "..." };`,
            options: [{ ignoreProperties: true }]
        }, {
            code: `let JSONAPI = {}, xmlApi = {};`,
            options: [{ ignoredIdentifiers: ["JSONAPI"] }]
        },
        `class MyClass { convertToXml(theHtml) {} }`,
        `class MyClass { constructor() { this.myApi = null; } }`,
        `class TheClass { #somePrivateData = 5; }`,
        `class SomeClass { #doPrivateStuff() {} }`,
        `myLabel1:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                break myLabel1;
            }
        }`,
        `label2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                continue label2;
            }
        }`,
        `export function toXml() {}`,
        `export { default as someStuff } from "/utils"`,
        `import * as fs from "fs";`,
        `import { exec as doExec } from "child_process";`,
        `import { notMyFAULT } from "badNames";`,
        `import { notMyFAULT as betterName } from "badNames";`,
        `import MyClass from "MyClass";
        console.log(MyClass.VERSION);
        `,
        `import Status from "status";
        const a = Status.GOOD;
        this.a = Status.BAD;
        `,
        {
            code: `export const MAX = 10;`,
            options: [{ ignoreSingleWordsIn: [ "first_class_constant" ] }]
        }, {
            code: `const esEnumDirection = { NORTH: 0, EAST: 1, SOUTH: 2, WEST: 3 }`,
            options: [{ ignoreSingleWordsIn: [ "object_field" ] }]
        }, {
            code: `const obj = {}; obj.VERSION = "1.0";`,
            options: [{ ignoreSingleWordsIn: [ "object_field" ] }]
        }, {
            code: `const obj = {
                FIELD1: 123
            };`,
            options: [{ ignoreSingleWordsIn: [ "object_field" ] }]
        }, {
            code: `const obj = {}; obj.FIELD1 = "1.0";`,
            options: [{ ignoreSingleWordsIn: [ "object_field" ] }]
        }
    ],
    invalid: [{
        code:  `const obj = {}; obj.VERSION = "1.0";`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const obj = {}; obj.Version = "1.0";`
            }]
        }]
    }, {
        code: `let xmlToHTML = () => {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `let xmlToHtml = () => {};`,
            }]
        }]
    }, {
        code: `const AFunction = () => {};`,
        errors: [{
            messageId: "notCamelCaseNoSuggestion"
        }]
    }, {
        code: `const AFunction = () => {};`,
        options: [{ allowOneCharWords: "last" }],
        errors: [{
            messageId: "notCamelCaseNoSuggestion"
        }]
    }, {
        code: `class API {}`,
        options: [{ ignoreSingleWords: false }],
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class Api {}`
            }]
        }]
    }, {
        code: `const apiApiAPI = () => {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const apiApiApi = () => {};`
            }]
        }]
    }, {
        code: `const someFunc = (firstParam, secondPARAM) => {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const someFunc = (firstParam, secondParam) => {};`
            }]
        }]
    }, {
        code: `const func = function(firstPARAM, secondParam) {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const func = function(firstParam, secondParam) {};`
            }]
        }]
    }, {
        code: `const func = function myFUNC(firstParam, secondParam) {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const func = function myFunc(firstParam, secondParam) {};`
            }]
        }]
    }, {
        code: `class MyAPIClass {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyApiClass {}`
            }]
        }]
    }, {
        code: `const MyAPIClass = class {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const MyApiClass = class {}`
            }]
        }]
    }, {
        code: `try { throw new Error(); } catch (anIOException) {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `try { throw new Error(); } catch (anIoException) {}`
            }]
        }]
    }, {
        code: `let obj = { htmlAPI: "..." };`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `let obj = { htmlApi: "..." };`
            }]
        }]
    }, {
        code: `class MyClass { convertToXML(html) {} }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyClass { convertToXml(html) {} }`
            }]
        }]
    }, {
        code: `class MyClass { convertToXml(theHTML) {} }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyClass { convertToXml(theHtml) {} }`
            }]
        }]
    }, {
        code: `class MyClass { convertToXML(theHTML) {} }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyClass { convertToXml(theHTML) {} }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyClass { convertToXML(theHtml) {} }`
            }]
        }]
    }, {
        code: `class MyClass { constructor() { this.myAPI = null; } }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyClass { constructor() { this.myApi = null; } }`
            }]
        }]
    }, {
        code: `class TheClass { #somePrivateTXT = 5; }`,
        errors: [{
            messageId: "notCamelCasePrivateWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class TheClass { #somePrivateTxt = 5; }`
            }]
        }]
    }, {
        code: `class SomeClass { #privateAPICall() {} }`,
        errors: [{
            messageId: "notCamelCasePrivateWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class SomeClass { #privateApiCall() {} }`
            }]
        }]
    }, {
        code: `class TheClass { constructor() { this.myAPI = {}; } }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class TheClass { constructor() { this.myApi = {}; } }`
            }]
        }]
    }, {
        code: `export function toXML() {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export function toXml() {}`
            }]
        }]
    }, {
        code: `export { default as some_stuff } from "/utils"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export { default as someStuff } from "/utils"`
            }]
        }]
    }, {
        code: `import * as FS from "fs"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `import * as Fs from "fs"`
            }]
        }]
    }, {
        code: `import UNDERSCORE from "underscore"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `import Underscore from "underscore"`
            }]
        }]
    }, {
        code: `import { exec as doEXEC } from "child_process"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `import { exec as doExec } from "child_process"`
            }]
        }]
    }, {
        code: `export const MAX = 10;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export const Max = 10;`
            }]
        }]
    }, {
        code: `export let NOTCONST = 10;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export let Notconst = 10;`
            }]
        }]
    }, {
        code: `export var NOTCONST = 10;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export var Notconst = 10;`
            }]
        }]
    }, {
        code: `export let NOTCONST = 10;`,
        options: [{ ignoreSingleWordsIn: [ "first_class_constant" ] }],
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export let Notconst = 10;`
            }]
        }]
    }, {
        code: `export var NOTCONST = 10;`,
        options: [{ ignoreSingleWordsIn: [ "first_class_constant" ] }],
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `export var Notconst = 10;`
            }]
        }]
    }, {
        code: `const esEnumDirection = { NORTH: 0, EAST: 1, SOUTH: 2, WEST: 3 }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const esEnumDirection = { North: 0, EAST: 1, SOUTH: 2, WEST: 3 }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const esEnumDirection = { NORTH: 0, East: 1, SOUTH: 2, WEST: 3 }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const esEnumDirection = { NORTH: 0, EAST: 1, South: 2, WEST: 3 }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `const esEnumDirection = { NORTH: 0, EAST: 1, SOUTH: 2, West: 3 }`
            }]
        }]
    }]
});

// tester for all selectors that only apply to TS source code
const tsRuleTester = new EsLintRuleTester({
    languageOptions: {
        parser: { parse }
    }
});
tsRuleTester.run("strict-camel-case", strictCamelCaseRule, {
    valid: [
        `class MyClass { private innerHtml: string; }`,
        `interface MyInterface { aField: number; parseXml(): void; }`,
        `type MyType = { aField: number, anotherField: string }`,
        `enum Error { JsError, JS_ERROR }`,
        {
            code: `enum HtmlTags { HEAD, BODY, DIV }`,
            options: [{ ignoredIdentifiers: ["HEAD", "BODY", "DIV"] }]
        },
        {
            code: `enum Direction { NORTH, EAST, SOUTH, WEST }`,
            options: [{ ignoreSingleWordsIn: ["enum_member"] }]
        },
        {
            code: `class Util { public static NAME = "TheUtil"; }`,
            options: [{ ignoreSingleWordsIn: ["static_class_field"] }]
        }
    ],
    invalid: [{
        code: `class MyClass { private innerHTML: string; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class MyClass { private innerHtml: string; }`
            }]
        }]
    }, {
        code: `interface MyXMLInterface { xml: string; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `interface MyXmlInterface { xml: string; }`
            }]
        }]
    }, {
        code: `interface MyInterface { innerHTML: string; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `interface MyInterface { innerHtml: string; }`
            }]
        }]
    }, {
        code: `interface MyInterface { parseHTML(html: string): any; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `interface MyInterface { parseHtml(html: string): any; }`
            }]
        }]
    }, {
        code: `type MyType = { someHTML: string }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `type MyType = { someHtml: string }`
            }]
        }]
    }, {
        code: `type MyType = { aBoolean: boolean, someHTML: string }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `type MyType = { aBoolean: boolean, someHtml: string }`
            }]
        }]
    }, {
        code: `enum HTMLTags { HEAD, BODY, DIV }`,
        options: [{ ignoredIdentifiers: ["HEAD", "BODY", "DIV"] }],
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `enum HtmlTags { HEAD, BODY, DIV }`
            }]
        }]
    }, {
        code: `enum Error { JSError }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `enum Error { JsError }`
            }]
        }]
    }, {
        code: `enum Direction { NORTH, EAST, SOUTH, WEST }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `enum Direction { North, EAST, SOUTH, WEST }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `enum Direction { NORTH, East, SOUTH, WEST }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `enum Direction { NORTH, EAST, South, WEST }`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `enum Direction { NORTH, EAST, SOUTH, West }`
            }]
        }]
    }, {
        code: `class Util { public static NAME = "TheUtil"; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `class Util { public static Name = "TheUtil"; }`
            }]
        }]
    }]
});

// without migrating all rule source code from the RuleModule types in eslint core to that of @typescript-eslint, the
// following code rebuilds the rule as a @typescript-eslint RuleModule to use with TSESL's RuleTester
type SccMessageIds = 
    "notCamelCaseWithSuggestion" |
    "notCamelCasePrivateWithSuggestion" |
    "notCamelCaseNoSuggestion" |
    "notCamelCasePrivateNoSuggestion" |
    "suggestionMessage";
const createRule = EsLintUtils.RuleCreator(
    name => `https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/${name}`);
const theRule = createRule({
    name: "strict-camel-case",
    defaultOptions: [],
    // the schema of RuleModule in @typescript-eslint/utils and RuleModule in eslint are slightly different
    // some janky casting, but it works because they're close enough
    create: strictCamelCaseRule.create as unknown as EsLintUtils.RuleCreateAndOptions<unknown[], SccMessageIds>["create"],
    meta: strictCamelCaseRule.meta as EsLintUtils.NamedCreateRuleMeta<SccMessageIds>
});

const ruleTesterEventEmitter = new EventEmitter();
TsEsLintRuleTester.afterAll = (): void => {};
TsEsLintRuleTester.it = function(text, method): void {
    ruleTesterEventEmitter.emit("it", text, method);
    method.call(this);
};
TsEsLintRuleTester.describe = function(text, method): void {
    ruleTesterEventEmitter.emit("describe", text, method);
    method.call(this);
};
// the suggestions in these test cases can't be verified using EsLintRuleTester because it parses the suggested output
// and fails the test case if there are any errors, which happens when renaming identifiers and only applying one
// suggestion at a time. Fortunately TsEsLintRuleTester isn't as strict
// see https://github.com/eslint/eslint/pull/16639
const tsEsRuleTester = new TsEsLintRuleTester();
tsEsRuleTester.run("strict-camel-case", theRule , {
    valid: [],
    invalid: [{
        code: `myXYZLabel1:
my_label_2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        break my_label_2;
    }
}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `myXyzLabel1:
my_label_2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        break my_label_2;
    }
}`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `myXYZLabel1:
myLabel2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        break my_label_2;
    }
}`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `myXYZLabel1:
my_label_2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        break myLabel2;
    }
}`
            }]
        }]
    }, {
        code: `label_2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        continue label_2;
    }
}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion",
            suggestions:[{
                messageId: "suggestionMessage",
                output: `label2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        continue label_2;
    }
}`
            }]
        }, {
            messageId: "notCamelCaseWithSuggestion",
            suggestions: [{
                messageId: "suggestionMessage",
                output: `label_2:
for (let i = 0; i < 5; i++) {
    if (i == 3) {
        continue label2;
    }
}`
            }]
        }]
    }]
})
