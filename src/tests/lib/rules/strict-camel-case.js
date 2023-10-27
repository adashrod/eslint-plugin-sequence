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
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `var xmlToHTML = function() {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `function xmlToHTML() {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `this.aGLOBALVar = 5;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `aGLOBALVar = 5;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
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
        }
    ],
    invalid: [{
        code: `let xmlToHTML = () => {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
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
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `const apiApiAPI = () => {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `const someFunc = (firstParam, secondPARAM) => {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `const func = function(firstPARAM, secondParam) {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `const func = function myFUNC(firstParam, secondParam) {};`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `class MyAPIClass {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `const MyAPIClass = class {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `try { throw new Error(); } catch (anIOException) {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `let obj = { htmlAPI: "..." };`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `class MyClass { convertToXML(html) {} }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `class MyClass { convertToXml(theHTML) {} }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `class MyClass { convertToXML(theHTML) {} }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }, {
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `class MyClass { constructor() { this.myAPI = null; } }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `class TheClass { #somePrivateTXT = 5; }`,
        errors: [{
            messageId: "notCamelCasePrivateWithSuggestion"
        }]
    }, {
        code: `class SomeClass { #privateAPICall() {} }`,
        errors: [{
            messageId: "notCamelCasePrivateWithSuggestion"
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
            messageId: "notCamelCaseWithSuggestion"
        }, {
            messageId: "notCamelCaseWithSuggestion"
        }, {
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `label_2:
        for (let i = 0; i < 5; i++) {
            if (i == 3) {
                continue label_2;
            }
        }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }, {
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `export function toXML() {}`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `export { default as some_stuff } from "/utils"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `import * as FS from "fs"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `import UNDERSCORE from "underscore"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `import { exec as doEXEC } from "child_process"`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `export const MAX = 10;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `export let MAX = 10;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `export var MAX = 10;`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `const esEnumDirection = { NORTH: 0, EAST: 1, SOUTH: 2, WEST: 3 }`,
        errors: [{
            message: 'Identifier "NORTH" is not in strict camel case, should be "North".',
        }, {
            message: 'Identifier "EAST" is not in strict camel case, should be "East".',
        }, {
            message: 'Identifier "SOUTH" is not in strict camel case, should be "South".',
        }, {
            message: 'Identifier "WEST" is not in strict camel case, should be "West".',
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
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `interface MyXMLInterface { xml: string; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `interface MyInterface { innerHTML: string; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `interface MyInterface { parseHTML(html: string): any; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `type MyType = { someHTML: string }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `type MyType = { aBoolean: boolean, someHTML: string }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `enum HTMLTags { HEAD, BODY, DIV }`,
        options: [{ ignoredIdentifiers: ["HEAD", "BODY", "DIV"] }],
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `enum Error { JSError }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }, {
        code: `enum Direction { NORTH, EAST, SOUTH, WEST }`,
        errors: [{
            message: 'Identifier "NORTH" is not in strict camel case, should be "North".',
        }, {
            message: 'Identifier "EAST" is not in strict camel case, should be "East".',
        }, {
            message: 'Identifier "SOUTH" is not in strict camel case, should be "South".',
        }, {
            message: 'Identifier "WEST" is not in strict camel case, should be "West".',
        }]
    }, {
        code: `class Util { public static NAME = "TheUtil"; }`,
        errors: [{
            messageId: "notCamelCaseWithSuggestion"
        }]
    }]
});
