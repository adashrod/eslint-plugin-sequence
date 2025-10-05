/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, it } from "node:test";

import { RuleTester } from "eslint";

import orderedDestructuringRule from "@adashrodEps/lib/rules/ordered-destructuring";

const ruleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            ecmaVersion: 9,
        },
    },
});
describe("ordered-destructuring", () => {
    it("passes and fails appropriately", () => {
        ruleTester.run("ordered-destructuring", orderedDestructuringRule, {
            valid: [
                `let { a, b, c } = {};`,
                `let { a, b, c, } = {};`,
                `let { a, b, d, ...c } = {};`,
                `let { a: d, b, c } = {};`,
                `let { a: d, b, c, } = {};`,
                `const { a: c, b, c: a } = {};`,
                `const { a: c, b, c: a, } = {};`,
                `const { address: { city, country }, name } = {};`,
                `const {\n` +
                    `alpha, // first letter\n` +
                    `bravo,\n` +
                    `// charlie,\n` +
                    `delta } = {};`,
                `const { alpha, bravo, /* charlie, delta,*/ echo } = {};`,
                `const {\n` +
                    `alpha,\n` +
                    `bravo,\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `echo } = {};`,
                `const {\n` +
                    `// alpha,\n` +
                    `bravo,\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `echo } = {};`,
                `const {\n` +
                    `alpha, // first letter\n` +
                    `bravo,\n` +
                    `// charlie,\n` +
                    `delta: { deltaSub1: { x, y } }` +
                    `} = {};`,
                {
                    code: `const { Alpha, bravoFun, Charlie } = {};\n`,
                    options: [{ ignoreCase: true }],
                },
                `const { key1, key10, key5 } = {}`,
                {
                    code: `const { key1, key5, key10 } = {}`,
                    options: [{ natural: true }],
                },
                {
                    code: `const { key1, Key5, key10 } = {}`,
                    options: [{ ignoreCase: true, natural: true }],
                },
                `function func({ a, b, c }) {}`,
            ],
            invalid: [{
                code: `let { b, a, c } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `let { a, b, c, } = {};`,
            }, {
                code: `let { a, d, b, ...c } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `let { a, b, d, ...c } = {};`,
            }, {
                code: `let { c, b, a: d } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }, { messageId: "sortPropsInObjectPattern" }],
                output: `let { a: d, b, c, } = {};`,
            }, {
                code: `const { c: a, b, a: c } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }, { messageId: "sortPropsInObjectPattern" }],
                output: `const { a: c, b, c: a, } = {};`,
            }, {
                code: `const { name, address: { city, country } } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const { address: { city, country }, name, } = {};`,
            }, {
                code: `const {\n` +
                    `bravo, // second letter\n` +
                    `delta,\n` +
                    `// alpha,\n` +
                    `charlie } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `bravo, // second letter\n` +
                    `charlie, delta,\n` +
                    `// alpha,\n` +
                    `} = {};`,
            }, {
                code: `const { echo, bravo, /* charlie, delta,*/ alpha } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }, { messageId: "sortPropsInObjectPattern" }],
                output: `const { alpha, bravo, /* charlie, delta,*/ echo, } = {};`,
            }, {
                code: `const {\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `echo,\n` +
                    `bravo,\n` +
                    `alpha } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }, { messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `alpha, bravo,\n` +
                    `echo,\n} = {};`,
            }, {
                code: `const {\n` +
                    `// alpha,\n` +
                    `echo,\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `bravo } = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `// alpha,\n` +
                    `bravo, echo,\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `} = {};`,
            }, {
                code: `const {\n` +
                    `// alpha,\n` +
                    `echo,\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `bravo,\n` +
                    `...theRest\n` +
                    `} = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `// alpha,\n` +
                    `bravo,\n` +
                    `echo,\n` +
                    `/* charlie,\n` +
                    `delta,*/\n` +
                    `...theRest\n` +
                    `} = {};`,
            }, {
                code: `const {\n` +
                    `bravo,\n` +
                    `alpha, // first letter\n` +
                    `// charlie,\n` +
                    `delta: { deltaSub1: { x, y } }\n` +
                    `//...theRest\n` +
                    `} = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `alpha, // first letter\n` +
                    `// charlie,\n` +
                    `bravo,\n` +
                    `delta: { deltaSub1: { x, y } },\n` +
                    `//...theRest\n` +
                    `} = {};`,
            }, {
                code: `const {\n` +
                    `bravo,\n` +
                    `alpha, // first letter\n` +
                    `delta: { deltaSub1: { x, y } },\n` +
                    `// charlie,\n` +
                    `...theRest\n` +
                    `} = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `alpha, // first letter\n` +
                    `bravo,\n` +
                    `delta: { deltaSub1: { x, y } },\n` +
                    `// charlie,\n` +
                    `...theRest\n` +
                    `} = {};`,
            }, {
                code: `const {\n` +
                    `delta: { deltaSub1: { x, y } },\n` +
                    `// charlie,\n` +
                    `bravo,\n` +
                    `alpha, // first letter\n` +
                    `...theRest\n` +
                    `} = {};`,
                errors: [{ messageId: "sortPropsInObjectPattern" }, { messageId: "sortPropsInObjectPattern" }],
                output: `const {\n` +
                    `alpha, // first letter\n` +
                    `bravo,\n` +
                    `delta: { deltaSub1: { x, y } },\n` +
                    `// charlie,\n` +
                    `...theRest\n` +
                    `} = {};`,
            }, {
                code: `const { Delta, Echo, Foxtrot, alphaFun, bravoFun, charlieFun } = {};`,
                options: [{ ignoreCase: true }],
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const { alphaFun, bravoFun, charlieFun, Delta, Echo, Foxtrot, } = {};`,
            }, {
                code: `const { key1, key10, key5 } = {}`,
                options: [{ natural: true }],
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `const { key1, key5, key10, } = {}`,
            }, {
                code: `const { Key10, key5, key2 } = {}`,
                options: [{ ignoreCase: true, natural: true }],
                errors: [{ messageId: "sortPropsInObjectPattern" }, { messageId: "sortPropsInObjectPattern" }],
                output: `const { key2, key5, Key10, } = {}`,
            }, {
                code: `function func({ b, a, c }) {}`,
                errors: [{ messageId: "sortPropsInObjectPattern" }],
                output: `function func({ a, b, c, }) {}`,
            }],
        });
    });
});
