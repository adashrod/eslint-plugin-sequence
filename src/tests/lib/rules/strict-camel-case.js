const rule = require("../../../lib/rules/strict-camel-case");
const { RuleTester } = require("eslint");

const es5RuleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 5,
    }
});
es5RuleTester.run("strict-camel-case", rule, {
    valid: [
        `var anXmlString = "";`,
        `var xmlToHtml = function() {};`,
        `function xmlToHtml() {}`,
        `this.aGlobalVar = true;`,
        `anotherGlobalVar = true;`
    ],
    invalid: [{
        code: `var aVAR = 5, aVar2 = 1;`,
        errors: [{
            suggestions: [{
                output: `var aVar = 5, aVar2 = 1;`
            }]
        }]
    }, {
        code: `var xmlToHTML = function() {};`,
        errors: [{
            suggestions: [{
                output: `var xmlToHtml = function() {};`
            }]
        }]
    }, {
        code: `function xmlToHTML() {};`,
        errors: [{
            suggestions: [{
                output: `function xmlToHtml() {};`
            }]
        }]
    }, {
        code: `this.aGLOBALVar = 5;`,
        errors: [{
            suggestions: [{
                output: `this.aGlobalVar = 5;`
            }]
        }]
    }, {
        code: `aGLOBALVar = 5;`,
        errors: [{
            suggestions: [{
                output: `aGlobalVar = 5;`
            }]
        }]
    }]
});

const es13RuleTester = new RuleTester({
    parserOptions: {
        // 13 has support for # private field/function syntax
        ecmaVersion: 13,
        sourceType: "module"
    }
});
es13RuleTester.run("strict-camel-case", rule, {
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
            suggestions: [{
                output: `const obj = {}; obj.Version = "1.0";`
            }]
        }]
    }, {
        code: `let xmlToHTML = () => {};`,
        errors: [{
            suggestions: [{
                output: `let xmlToHtml = () => {};`,
            }]
        }]
    }, {
        code: `const AFunction = () => {};`,
        errors: [{
            message: `Identifier "AFunction" is not in strict camel case, no suggestion possible for 1-char words.`
        }]
    }, {
        code: `const AFunction = () => {};`,
        options: [{ allowOneCharWords: "last" }],
        errors: [{
            message: `Identifier "AFunction" is not in strict camel case, no suggestion possible for 1-char words.`
        }]
    }, {
        code: `class API {}`,
        options: [{ ignoreSingleWords: false }],
        errors: [{
            suggestions: [{
                output: `class Api {}`
            }]
        }]
    }, {
        code: `const apiApiAPI = () => {};`,
        errors: [{
            suggestions: [{
                output: `const apiApiApi = () => {};`
            }]
        }]
    }, {
        code: `const someFunc = (firstParam, secondPARAM) => {};`,
        errors: [{
            suggestions: [{
                output: `const someFunc = (firstParam, secondParam) => {};`
            }]
        }]
    }, {
        code: `const func = function(firstPARAM, secondParam) {};`,
        errors: [{
            suggestions: [{
                output: `const func = function(firstParam, secondParam) {};`
            }]
        }]
    }, {
        code: `const func = function myFUNC(firstParam, secondParam) {};`,
        errors: [{
            suggestions: [{
                output: `const func = function myFunc(firstParam, secondParam) {};`
            }]
        }]
    }, {
        code: `class MyAPIClass {}`,
        errors: [{
            suggestions: [{
                output: `class MyApiClass {}`
            }]
        }]
    }, {
        code: `const MyAPIClass = class {}`,
        errors: [{
            suggestions: [{
                output: `const MyApiClass = class {}`
            }]
        }]
    }, {
        code: `try { throw new Error(); } catch (anIOException) {}`,
        errors: [{
            suggestions: [{
                output: `try { throw new Error(); } catch (anIoException) {}`
            }]
        }]
    }, {
        code: `let obj = { htmlAPI: "..." };`,
        errors: [{
            suggestions: [{
                output: `let obj = { htmlApi: "..." };`
            }]
        }]
    }, {
        code: `class MyClass { convertToXML(html) {} }`,
        errors: [{
            suggestions: [{
                output: `class MyClass { convertToXml(html) {} }`
            }]
        }]
    }, {
        code: `class MyClass { convertToXml(theHTML) {} }`,
        errors: [{
            suggestions: [{
                output: `class MyClass { convertToXml(theHtml) {} }`
            }]
        }]
    }, {
        code: `class MyClass { convertToXML(theHTML) {} }`,
        errors: [{
            suggestions: [{
                output: `class MyClass { convertToXml(theHTML) {} }`
            }]
        }, {
            suggestions: [{
                output: `class MyClass { convertToXML(theHtml) {} }`
            }]
        }]
    }, {
        code: `class MyClass { constructor() { this.myAPI = null; } }`,
        errors: [{
            suggestions: [{
                output: `class MyClass { constructor() { this.myApi = null; } }`
            }]
        }]
    }, {
        code: `class TheClass { #somePrivateTXT = 5; }`,
        errors: [{
            suggestions: [{
                output: `class TheClass { #somePrivateTxt = 5; }`
            }]
        }]
    }, {
        code: `class SomeClass { #privateAPICall() {} }`,
        errors: [{
            suggestions: [{
                output: `class SomeClass { #privateApiCall() {} }`
            }]
        }]
    }, {
        code: `myXYZLabel1:
        my_label_2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                break my_label_2;
            }
        }`,
        errors: [{
            suggestions: [{
                output: `myXyzLabel1:
        my_label_2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                break my_label_2;
            }
        }`
            }]
        }, {
            suggestions: [{
                output: `myXYZLabel1:
        myLabel2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                break my_label_2;
            }
        }`
            }]
        }, {
            suggestions: [{
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
            suggestions:[{
                output: `label2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                continue label_2;
            }
        }`
            }]
        }, {
            suggestions: [{
                output: `label_2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                continue label2;
            }
        }`
            }]
        }]
    }, {
        code: `export function toXML() {}`,
        errors: [{
            suggestions: [{
                output: `export function toXml() {}`
            }]
        }]
    }, {
        code: `export { default as some_stuff } from "/utils"`,
        errors: [{
            suggestions: [{
                output: `export { default as someStuff } from "/utils"`
            }]
        }]
    }, {
        code: `import * as FS from "fs"`,
        errors: [{
            suggestions: [{
                output: `import * as Fs from "fs"`
            }]
        }]
    }, {
        code: `import UNDERSCORE from "underscore"`,
        errors: [{
            suggestions: [{
                output: `import Underscore from "underscore"`
            }]
        }]
    }, {
        code: `import { exec as doEXEC } from "child_process"`,
        errors: [{
            suggestions: [{
                output: `import { exec as doExec } from "child_process"`
            }]
        }]
    }, {
        code: `export const MAX = 10;`,
        errors: [{
            suggestions: [{
                output: `export const Max = 10;`
            }]
        }]
    }, {
        code: `export let NOTCONST = 10;`,
        errors: [{
            suggestions: [{
                output: `export let Notconst = 10;`
            }]
        }]
    }, {
        code: `export var NOTCONST = 10;`,
        errors: [{
            suggestions: [{
                output: `export var Notconst = 10;`
            }]
        }]
    }, {
        code: `export let NOTCONST = 10;`,
        options: [{ ignoreSingleWordsIn: [ "first_class_constant" ] }],
        errors: [{
            suggestions: [{
                output: `export let Notconst = 10;`
            }]
        }]
    }, {
        code: `export var NOTCONST = 10;`,
        options: [{ ignoreSingleWordsIn: [ "first_class_constant" ] }],
        errors: [{
            suggestions: [{
                output: `export var Notconst = 10;`
            }]
        }]
    }, {
        code: `const esEnumDirection = { NORTH: 0, EAST: 1, SOUTH: 2, WEST: 3 }`,
        errors: [{
            suggestions: [{
                output: `const esEnumDirection = { North: 0, EAST: 1, SOUTH: 2, WEST: 3 }`
            }]
        }, {
            suggestions: [{
                output: `const esEnumDirection = { NORTH: 0, East: 1, SOUTH: 2, WEST: 3 }`
            }]
        }, {
            suggestions: [{
                output: `const esEnumDirection = { NORTH: 0, EAST: 1, South: 2, WEST: 3 }`
            }]
        }, {
            suggestions: [{
                output: `const esEnumDirection = { NORTH: 0, EAST: 1, SOUTH: 2, West: 3 }`
            }]
        }]
    }]
});

const tsRuleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser')
});
tsRuleTester.run("strict-camel-case", rule, {
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
            options: [{ ignoreSingleWordsIn: ["enum_member"]}]
        },
        {
            code: `class Util { public static NAME = "TheUtil"; }`,
            options: [{ ignoreSingleWordsIn: ["static_class_field"]}]
        }
    ],
    invalid: [{
        code: `class MyClass { private innerHTML: string; }`,
        errors: [{
            suggestions: [{
                output: `class MyClass { private innerHtml: string; }`
            }]
        }]
    }, {
        code: `interface MyXMLInterface { xml: string; }`,
        errors: [{
            suggestions: [{
                output: `interface MyXmlInterface { xml: string; }`
            }]
        }]
    }, {
        code: `interface MyInterface { innerHTML: string; }`,
        errors: [{
            suggestions: [{
                output: `interface MyInterface { innerHtml: string; }`
            }]
        }]
    }, {
        code: `interface MyInterface { parseHTML(html: string): any; }`,
        errors: [{
            suggestions: [{
                output: `interface MyInterface { parseHtml(html: string): any; }`
            }]
        }]
    }, {
        code: `type MyType = { someHTML: string }`,
        errors: [{
            suggestions: [{
                output: `type MyType = { someHtml: string }`
            }]
        }]
    }, {
        code: `type MyType = { aBoolean: boolean, someHTML: string }`,
        errors: [{
            suggestions: [{
                output: `type MyType = { aBoolean: boolean, someHtml: string }`
            }]
        }]
    }, {
        code: `enum HTMLTags { HEAD, BODY, DIV }`,
        options: [{ ignoredIdentifiers: ["HEAD", "BODY", "DIV"] }],
        errors: [{
            suggestions: [{
                output: `enum HtmlTags { HEAD, BODY, DIV }`
            }]
        }]
    }, {
        code: `enum Error { JSError }`,
        errors: [{
            suggestions: [{
                output: `enum Error { JsError }`
            }]
        }]
    }, {
        code: `enum Direction { NORTH, EAST, SOUTH, WEST }`,
        errors: [{
            suggestions: [{
                output: `enum Direction { North, EAST, SOUTH, WEST }`
            }]
        }, {
            suggestions: [{
                output: `enum Direction { NORTH, East, SOUTH, WEST }`
            }]
        }, {
            suggestions: [{
                output: `enum Direction { NORTH, EAST, South, WEST }`
            }]
        }, {
            suggestions: [{
                output: `enum Direction { NORTH, EAST, SOUTH, West }`
            }]
        }]
    }, {
        code: `class Util { public static NAME = "TheUtil"; }`,
        errors: [{
            suggestions: [{
                output: `class Util { public static Name = "TheUtil"; }`
            }]
        }]
    }]
});
